from fastapi import FastAPI, APIRouter, HTTPException, Request, BackgroundTasks, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, date, time, timedelta
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import sendgrid
from sendgrid.helpers.mail import Mail
import httpx
import json
import paypalrestsdk
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Exclusive Gulf Float Enhanced API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')

# PayPal Configuration
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'paypal_client_id_here')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', 'paypal_client_secret_here')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')  # 'sandbox' or 'live'

# Google Sheets Configuration
GOOGLE_CREDENTIALS_FILE = os.environ.get('GOOGLE_CREDENTIALS_FILE', 'google_credentials.json')
GOOGLE_SPREADSHEET_ID = os.environ.get('GOOGLE_SPREADSHEET_ID', 'your_spreadsheet_id_here')

# PayPal Configuration
paypalrestsdk.configure({
    "mode": PAYPAL_MODE,
    "client_id": PAYPAL_CLIENT_ID,
    "client_secret": PAYPAL_CLIENT_SECRET
})

# Service Categories and Pricing
SERVICES = {
    "crystal_kayak": {
        "id": "crystal_kayak",
        "name": "Crystal-Clear Kayak Rental (2 person)",
        "price": 60.0,
        "duration": "hourly",
        "description": "Experience the emerald waters in our crystal-clear kayaks with LED lighting",
        "image": "/api/placeholder/300/200",
        "features": ["Crystal-clear transparent kayak", "Built-in LED lighting system", "2-person capacity", "Life jackets included", "Perfect for night adventures"],
        "category": "watercraft"
    },
    "canoe": {
        "id": "canoe",
        "name": "Canoe Rental (2+ people)", 
        "price": 75.0,
        "duration": "hourly",
        "description": "Stable canoe perfect for families and groups",
        "image": "/api/placeholder/300/200",
        "features": ["Stable canoe for 2+ people", "Perfect for families", "Paddles included", "Safety equipment provided", "Great for beginners"],
        "category": "watercraft"
    },
    "paddle_board": {
        "id": "paddle_board",
        "name": "Paddle Board Rental",
        "price": 75.0,
        "duration": "hourly",
        "description": "Individual paddle board experience on the emerald waters",
        "image": "/api/placeholder/300/200",
        "features": ["Premium paddle board", "Individual experience", "Paddle included", "Safety leash provided", "Perfect for fitness"],
        "category": "watercraft"
    },
    "luxury_cabana_hourly": {
        "id": "luxury_cabana_hourly",
        "name": "Luxury Floating Cabana (per person per hour)",
        "price": 35.0,
        "duration": "hourly",
        "description": "Private floating cabana with premium amenities",
        "image": "/api/placeholder/300/200",
        "features": ["Luxury floating platform", "Plush seating & shade", "Private floating space", "Refreshment storage", "Ultimate relaxation"],
        "category": "cabana"
    },
    "luxury_cabana_3hr": {
        "id": "luxury_cabana_3hr",
        "name": "Luxury Floating Cabana (3 hours)",
        "price": 100.0,
        "duration": "3 hours",
        "description": "3-hour luxury floating cabana experience",
        "image": "/api/placeholder/300/200",
        "features": ["Luxury floating platform", "Plush seating & shade", "Private floating space", "Refreshment storage", "3-hour experience"],
        "category": "cabana"
    },
    "luxury_cabana_4hr": {
        "id": "luxury_cabana_4hr",
        "name": "Luxury Floating Cabana (4 hours, 6 person max)",
        "price": 299.0,
        "duration": "4 hours",
        "description": "Premium 4-hour floating cabana experience for groups",
        "image": "/api/placeholder/300/200",
        "features": ["Luxury floating platform", "Plush seating & shade", "Private floating space", "Refreshment storage", "Group experience"],
        "category": "cabana"
    }
}

# Helper functions
def prepare_for_mongo(data):
    """Convert date/time objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('booking_date'), date):
        data['booking_date'] = data['booking_date'].isoformat()
    if isinstance(data.get('booking_time'), time):
        data['booking_time'] = data['booking_time'].strftime('%H:%M:%S')
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('signed_at'), datetime):
        data['signed_at'] = data['signed_at'].isoformat()
    if isinstance(data.get('expires_at'), datetime):
        data['expires_at'] = data['expires_at'].isoformat()
    
    # Handle cart items array
    if 'items' in data and isinstance(data['items'], list):
        for item in data['items']:
            if isinstance(item.get('booking_date'), date):
                item['booking_date'] = item['booking_date'].isoformat()
            if isinstance(item.get('booking_time'), time):
                item['booking_time'] = item['booking_time'].strftime('%H:%M:%S')
    
    # Handle guests array for waivers
    if 'guests' in data and isinstance(data['guests'], list):
        for guest in data['guests']:
            if isinstance(guest.get('date'), date):
                guest['date'] = guest['date'].isoformat()
    
    return data

def parse_from_mongo(item):
    """Parse date/time strings from MongoDB back to Python objects"""
    if isinstance(item.get('booking_date'), str):
        try:
            item['booking_date'] = datetime.fromisoformat(item['booking_date']).date()
        except:
            pass
    if isinstance(item.get('booking_time'), str):
        try:
            item['booking_time'] = datetime.strptime(item['booking_time'], '%H:%M:%S').time()
        except:
            pass
    if isinstance(item.get('created_at'), str):
        try:
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        except:
            pass
    if isinstance(item.get('signed_at'), str):
        try:
            item['signed_at'] = datetime.fromisoformat(item['signed_at'])
        except:
            pass
    if isinstance(item.get('expires_at'), str):
        try:
            item['expires_at'] = datetime.fromisoformat(item['expires_at'])
        except:
            pass
    
    # Handle guests array for waivers
    if 'guests' in item and isinstance(item['guests'], list):
        for guest in item['guests']:
            if isinstance(guest.get('date'), str):
                try:
                    guest['date'] = datetime.fromisoformat(guest['date']).date()
                except:
                    pass
    
    return item

# Models
class CartItem(BaseModel):
    service_id: str
    quantity: int = 1
    booking_date: date
    booking_time: time
    special_requests: Optional[str] = None

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[CartItem] = []
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=1))

class CartItemAdd(BaseModel):
    service_id: str
    quantity: int = 1
    booking_date: date
    booking_time: time
    special_requests: Optional[str] = None

class CustomerInfo(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None

class CheckoutRequest(BaseModel):
    customer_info: CustomerInfo
    payment_method: str = "stripe"  # stripe, paypal, venmo, cashapp, zelle
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None

class BookingConfirmation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cart_id: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    items: List[Dict[str, Any]] = []
    total_amount: float
    payment_method: str
    payment_status: str = "pending"
    payment_session_id: Optional[str] = None
    booking_reference: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    payment_method: str
    payment_provider: str  # stripe, paypal, etc.
    session_id: str
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"
    metadata: Dict = {}
    customer_email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

class WaiverGuest(BaseModel):
    id: int
    name: str
    date: date
    isMinor: bool = False
    guardianName: Optional[str] = None
    guardianSignature: Optional[str] = None
    participantSignature: Optional[str] = None

class WaiverData(BaseModel):
    emergency_contact_name: str
    emergency_contact_phone: str
    emergency_contact_relationship: Optional[str] = None
    medical_conditions: Optional[str] = None
    additional_notes: Optional[str] = None

class WaiverSubmission(BaseModel):
    cart_id: str
    waiver_data: WaiverData
    guests: List[WaiverGuest]
    signed_at: datetime
    total_guests: int

class Waiver(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cart_id: str
    waiver_data: WaiverData
    guests: List[WaiverGuest]
    signed_at: datetime
    total_guests: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Google Sheets Service
class GoogleSheetsService:
    def __init__(self):
        self.credentials = None
        self.service = None
        self.spreadsheet_id = GOOGLE_SPREADSHEET_ID
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize Google Sheets service with service account credentials"""
        try:
            if os.path.exists(GOOGLE_CREDENTIALS_FILE):
                self.credentials = service_account.Credentials.from_service_account_file(
                    GOOGLE_CREDENTIALS_FILE,
                    scopes=['https://www.googleapis.com/auth/spreadsheets']
                )
                self.service = build('sheets', 'v4', credentials=self.credentials)
                logger.info("Google Sheets service initialized successfully")
            else:
                logger.warning("Google credentials file not found, Google Sheets integration disabled")
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets service: {str(e)}")
    
    async def record_booking(self, booking: BookingConfirmation):
        """Record booking in Google Sheets"""
        if not self.service:
            logger.warning("Google Sheets service not available")
            return
        
        try:
            # Prepare booking data for sheets
            items_text = ", ".join([f"{item['name']} (x{item['quantity']})" for item in booking.items])
            total_amount = sum(item['price'] * item['quantity'] for item in booking.items)
            
            row_data = [
                datetime.now().isoformat(),  # Timestamp
                booking.booking_reference,
                booking.customer_name,
                booking.customer_email,
                booking.customer_phone or '',
                items_text,
                str(total_amount),
                booking.payment_method,
                booking.payment_status,
                booking.status
            ]
            
            # Prepare request body
            body = {
                'values': [row_data]
            }
            
            # Make API call
            result = self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range='Bookings!A:J',
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
            
            logger.info(f"Successfully recorded booking to Google Sheets: {booking.booking_reference}")
            
        except HttpError as error:
            logger.error(f"Google Sheets API error: {error}")
        except Exception as error:
            logger.error(f"Unexpected error recording to sheets: {error}")
    
    async def record_waiver(self, waiver: Waiver):
        """Record waiver in Google Sheets"""
        if not self.service:
            logger.warning("Google Sheets service not available")
            return
        
        try:
            # Prepare guest information
            guests_info = []
            for guest in waiver.guests:
                guest_text = f"{guest.name} (Age: {'Minor' if guest.isMinor else 'Adult'})"
                if guest.isMinor and guest.guardianName:
                    guest_text += f" - Guardian: {guest.guardianName}"
                guests_info.append(guest_text)
            
            guests_text = "; ".join(guests_info)
            
            row_data = [
                waiver.signed_at.isoformat(),  # Timestamp
                waiver.id,  # Waiver ID
                waiver.cart_id,  # Cart ID
                str(waiver.total_guests),  # Total Guests
                guests_text,  # Guest Names & Info
                waiver.waiver_data.emergency_contact_name,
                waiver.waiver_data.emergency_contact_phone,
                waiver.waiver_data.emergency_contact_relationship or '',
                waiver.waiver_data.medical_conditions or '',
                waiver.waiver_data.additional_notes or '',
                'Signed'  # Status
            ]
            
            # Prepare request body
            body = {
                'values': [row_data]
            }
            
            # Make API call to Waivers sheet
            result = self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range='Waivers!A:K',
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
            
            logger.info(f"Successfully recorded waiver to Google Sheets: {waiver.id}")
            
        except HttpError as error:
            logger.error(f"Google Sheets API error recording waiver: {error}")
        except Exception as error:
            logger.error(f"Unexpected error recording waiver to sheets: {error}")

# Global services
google_sheets = GoogleSheetsService()

# Cart storage - now using MongoDB for persistence
# carts_storage = {} # Old in-memory storage - replaced with MongoDB

# Waiver service
async def add_waiver_to_sheets(waiver: Waiver):
    """Add waiver to Google Sheets"""
    try:
        await google_sheets.record_waiver(waiver)
    except Exception as e:
        logger.error(f"Failed to add waiver to Google Sheets: {str(e)}")

# Email service
async def send_booking_confirmation_email(booking: BookingConfirmation):
    """Send booking confirmation email using SendGrid"""
    try:
        if not SENDGRID_API_KEY or SENDGRID_API_KEY == "your_sendgrid_api_key_here":
            logger.warning("SendGrid API key not configured")
            return False
            
        items_html = ""
        total_amount = 0
        for item in booking.items:
            item_total = item['price'] * item['quantity']
            total_amount += item_total
            items_html += f"""
            <div style="margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <strong>{item['name']}</strong><br>
                Date: {item['booking_date']}<br>
                Time: {item['booking_time']}<br>
                Quantity: {item['quantity']}<br>
                Price: ${item['price']:.2f} each<br>
                <strong>Subtotal: ${item_total:.2f}</strong>
            </div>
            """
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e7b85 0%, #2d9ca8 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">Exclusive Gulf Float</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Your Premium Gulf Experience Awaits</p>
                </div>
                
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #1e7b85; margin-bottom: 20px;">Booking Confirmation</h2>
                    
                    <p>Dear {booking.customer_name},</p>
                    <p>Thank you for choosing Exclusive Gulf Float! Your booking has been confirmed.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1e7b85; margin-top: 0;">Booking Details</h3>
                        <p><strong>Booking Reference:</strong> {booking.booking_reference}</p>
                        <p><strong>Items Booked:</strong></p>
                        {items_html}
                        <div style="border-top: 2px solid #1e7b85; padding-top: 15px; margin-top: 15px;">
                            <p><strong style="font-size: 18px;">Total Amount: ${total_amount:.2f}</strong></p>
                        </div>
                    </div>
                    
                    <div style="background: #e8f5f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1e7b85; margin-top: 0;">What to Expect</h3>
                        <p>• Arrive 15 minutes early for check-in</p>
                        <p>• Bring sunscreen and water</p>
                        <p>• Comfortable swimwear recommended</p>
                        <p>• Life jackets provided</p>
                    </div>
                    
                    <p>If you need to make any changes or have questions, please contact us at:</p>
                    <p><strong>Phone:</strong> (850) 555-GULF<br>
                    <strong>Email:</strong> {SENDER_EMAIL}</p>
                    
                    <p style="margin-top: 30px;">We look forward to providing you with an unforgettable experience on the beautiful emerald waters of Panama City, Florida!</p>
                    
                    <p>Best regards,<br>
                    <strong>The Exclusive Gulf Float Team</strong></p>
                </div>
            </body>
        </html>
        """
        
        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=booking.customer_email,
            subject=f"Booking Confirmed - Exclusive Gulf Float - {booking.booking_reference}",
            html_content=html_content
        )
        
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code == 202
        
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
        return False

# Telegram notification service
async def send_telegram_notification(booking: BookingConfirmation):
    """Send booking notification to Telegram"""
    try:
        if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
            logger.warning("Telegram bot token not configured")
            return False
            
        items_text = "\n".join([f"• {item['name']} (x{item['quantity']}) - ${item['price']:.2f}" for item in booking.items])
        total_amount = sum(item['price'] * item['quantity'] for item in booking.items)
        
        message = f"""🌊 NEW BOOKING - Exclusive Gulf Float 🌊

👤 Customer: {booking.customer_name}
📧 Email: {booking.customer_email}
📱 Phone: {booking.customer_phone or 'Not provided'}

🛍️ ITEMS BOOKED:
{items_text}

💰 Total: ${total_amount:.2f}
💳 Payment Method: {booking.payment_method.upper()}
💳 Payment Status: {booking.payment_status}

🆔 Booking Reference: {booking.booking_reference}
🆔 Booking ID: {booking.id}"""

        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "HTML"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data)
            return response.status_code == 200
            
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {str(e)}")
        return False

# PayPal Integration
class PayPalService:
    @staticmethod
    async def create_payment(booking: BookingConfirmation, success_url: str, cancel_url: str):
        """Create PayPal payment"""
        try:
            items = []
            for item in booking.items:
                items.append({
                    "name": item['name'],
                    "sku": item['service_id'],
                    "price": f"{item['price']:.2f}",
                    "currency": "USD",
                    "quantity": item['quantity']
                })
            
            total_amount = sum(item['price'] * item['quantity'] for item in booking.items)
            
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": success_url,
                    "cancel_url": cancel_url
                },
                "transactions": [{
                    "item_list": {"items": items},
                    "amount": {
                        "total": f"{total_amount:.2f}",
                        "currency": "USD"
                    },
                    "description": f"Booking {booking.booking_reference} - Exclusive Gulf Float"
                }]
            })
            
            if payment.create():
                return {
                    "payment_id": payment.id,
                    "approval_url": next(link.href for link in payment.links if link.rel == "approval_url"),
                    "status": "created"
                }
            else:
                raise HTTPException(status_code=400, detail=f"PayPal payment creation failed: {payment.error}")
                
        except Exception as e:
            logger.error(f"PayPal payment creation error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"PayPal payment error: {str(e)}")
    
    @staticmethod
    async def execute_payment(payment_id: str, payer_id: str):
        """Execute PayPal payment"""
        try:
            payment = paypalrestsdk.Payment.find(payment_id)
            
            if payment.execute({"payer_id": payer_id}):
                return {
                    "payment_id": payment_id,
                    "status": "completed",
                    "payer_id": payer_id
                }
            else:
                raise HTTPException(status_code=400, detail=f"PayPal payment execution failed: {payment.error}")
                
        except Exception as e:
            logger.error(f"PayPal payment execution error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"PayPal execution error: {str(e)}")

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Welcome to Exclusive Gulf Float Enhanced API"}

@api_router.get("/services")
async def get_services():
    """Get available services and pricing"""
    return {"services": SERVICES}

@api_router.post("/cart/create")
async def create_cart():
    """Create a new shopping cart"""
    cart = Cart()
    
    # Store in MongoDB
    cart_dict = prepare_for_mongo(cart.dict())
    await db.carts.insert_one(cart_dict)
    
    return {"cart_id": cart.id, "expires_at": cart.expires_at}

@api_router.get("/cart/{cart_id}")
async def get_cart(cart_id: str):
    """Get cart contents"""
    # Get cart from MongoDB
    cart_data = await db.carts.find_one({"id": cart_id})
    if not cart_data:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Parse cart from MongoDB
    parsed_cart = parse_from_mongo(cart_data)
    cart = Cart(**parsed_cart)
    
    # Check expiration
    if datetime.now(timezone.utc) > cart.expires_at:
        await db.carts.delete_one({"id": cart_id})
        raise HTTPException(status_code=410, detail="Cart expired")
    
    # Calculate totals
    total_amount = 0
    cart_items = []
    
    for item in cart.items:
        if item.service_id in SERVICES:
            service = SERVICES[item.service_id]
            item_total = service['price'] * item.quantity
            total_amount += item_total
            
            cart_items.append({
                "service_id": item.service_id,
                "name": service['name'],
                "price": service['price'],
                "quantity": item.quantity,
                "booking_date": item.booking_date,
                "booking_time": item.booking_time,
                "special_requests": item.special_requests,
                "subtotal": item_total
            })
    
    return {
        "cart_id": cart.id,
        "items": cart_items,
        "total_amount": total_amount,
        "customer_info": {
            "name": cart.customer_name,
            "email": cart.customer_email,
            "phone": cart.customer_phone
        }
    }

@api_router.post("/cart/{cart_id}/add")
async def add_to_cart(cart_id: str, item: CartItemAdd):
    """Add item to cart"""
    # Get cart from MongoDB
    cart_data = await db.carts.find_one({"id": cart_id})
    if not cart_data:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Parse cart from MongoDB
    parsed_cart = parse_from_mongo(cart_data)
    cart = Cart(**parsed_cart)
    
    # Check expiration
    if datetime.now(timezone.utc) > cart.expires_at:
        await db.carts.delete_one({"id": cart_id})
        raise HTTPException(status_code=410, detail="Cart expired")
    
    if item.service_id not in SERVICES:
        raise HTTPException(status_code=400, detail="Invalid service ID")
    
    cart_item = CartItem(
        service_id=item.service_id,
        quantity=item.quantity,
        booking_date=item.booking_date,
        booking_time=item.booking_time,
        special_requests=item.special_requests
    )
    
    cart.items.append(cart_item)
    
    # Update cart in MongoDB
    cart_dict = prepare_for_mongo(cart.dict())
    await db.carts.replace_one({"id": cart_id}, cart_dict)
    
    return {"message": "Item added to cart", "cart_id": cart_id}

@api_router.delete("/cart/{cart_id}/item/{item_index}")
async def remove_from_cart(cart_id: str, item_index: int):
    """Remove item from cart"""
    # Get cart from MongoDB
    cart_data = await db.carts.find_one({"id": cart_id})
    if not cart_data:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Parse cart from MongoDB
    parsed_cart = parse_from_mongo(cart_data)
    cart = Cart(**parsed_cart)
    
    if item_index < 0 or item_index >= len(cart.items):
        raise HTTPException(status_code=400, detail="Invalid item index")
    
    cart.items.pop(item_index)
    
    # Update cart in MongoDB
    cart_dict = prepare_for_mongo(cart.dict())
    await db.carts.replace_one({"id": cart_id}, cart_dict)
    
    return {"message": "Item removed from cart"}

@api_router.put("/cart/{cart_id}/customer")
async def update_cart_customer(cart_id: str, customer_info: CustomerInfo):
    """Update customer information in cart"""
    # Get cart from MongoDB
    cart_data = await db.carts.find_one({"id": cart_id})
    if not cart_data:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Parse cart from MongoDB
    parsed_cart = parse_from_mongo(cart_data)
    cart = Cart(**parsed_cart)
    
    # Update customer info
    cart.customer_name = customer_info.name
    cart.customer_email = customer_info.email
    cart.customer_phone = customer_info.phone
    
    # Update cart in MongoDB
    cart_dict = prepare_for_mongo(cart.dict())
    await db.carts.replace_one({"id": cart_id}, cart_dict)
    
    return {"message": "Customer information updated"}

# Waiver Endpoints
@api_router.post("/waiver/submit")
async def submit_waiver(waiver_submission: WaiverSubmission):
    """Submit electronic waiver"""
    try:
        # Create waiver document
        waiver = Waiver(
            cart_id=waiver_submission.cart_id,
            waiver_data=waiver_submission.waiver_data,
            guests=waiver_submission.guests,
            signed_at=waiver_submission.signed_at,
            total_guests=waiver_submission.total_guests
        )
        
        # Store in MongoDB
        waiver_dict = prepare_for_mongo(waiver.dict())
        result = await db.waivers.insert_one(waiver_dict)
        
        # Add to Google Sheets
        await add_waiver_to_sheets(waiver)
        
        return {
            "message": "Waiver submitted successfully",
            "waiver_id": waiver.id,
            "mongo_id": str(result.inserted_id)
        }
    
    except Exception as e:
        logger.error(f"Error submitting waiver: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit waiver")

@api_router.get("/waiver/{waiver_id}")
async def get_waiver(waiver_id: str):
    """Get waiver by ID"""
    try:
        waiver = await db.waivers.find_one({"id": waiver_id}, {"_id": 0})
        if not waiver:
            raise HTTPException(status_code=404, detail="Waiver not found")
        
        # Parse dates back from MongoDB
        parsed_waiver = parse_from_mongo(waiver)
        return parsed_waiver
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching waiver: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch waiver")

@api_router.get("/waivers")
async def get_all_waivers():
    """Get all waivers for admin"""
    try:
        waivers = await db.waivers.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=None)
        
        # Parse dates back from MongoDB
        parsed_waivers = [parse_from_mongo(waiver) for waiver in waivers]
        return parsed_waivers
    
    except Exception as e:
        logger.error(f"Error fetching waivers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch waivers")

@api_router.post("/cart/{cart_id}/checkout")
async def checkout_cart(cart_id: str, checkout_request: CheckoutRequest, background_tasks: BackgroundTasks):
    """Checkout cart and create booking"""
    # Get cart from MongoDB
    cart_data = await db.carts.find_one({"id": cart_id})
    if not cart_data:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Parse cart from MongoDB
    parsed_cart = parse_from_mongo(cart_data)
    cart = Cart(**parsed_cart)
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Create booking confirmation
    booking_items = []
    total_amount = 0
    
    for item in cart.items:
        service = SERVICES[item.service_id]
        item_total = service['price'] * item.quantity
        total_amount += item_total
        
        booking_items.append({
            "service_id": item.service_id,
            "name": service['name'],
            "price": service['price'],
            "quantity": item.quantity,
            "booking_date": item.booking_date.isoformat(),
            "booking_time": item.booking_time.strftime('%H:%M:%S'),
            "special_requests": item.special_requests,
            "subtotal": item_total
        })
    
    # Generate booking reference
    booking_ref = f"EGF{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}"
    
    booking = BookingConfirmation(
        cart_id=cart_id,
        customer_name=checkout_request.customer_info.name,
        customer_email=checkout_request.customer_info.email,
        customer_phone=checkout_request.customer_info.phone,
        items=booking_items,
        total_amount=total_amount,
        payment_method=checkout_request.payment_method,
        booking_reference=booking_ref
    )
    
    # Save booking to database
    booking_data = prepare_for_mongo(booking.dict())
    await db.bookings.insert_one(booking_data)
    
    # Record in Google Sheets
    background_tasks.add_task(google_sheets.record_booking, booking)
    
    # Handle payment based on method
    if checkout_request.payment_method == "stripe":
        return await handle_stripe_checkout(booking, checkout_request)
    elif checkout_request.payment_method == "paypal":
        return await handle_paypal_checkout(booking, checkout_request)
    else:
        # For now, other payment methods return pending status
        return {
            "booking_id": booking.id,
            "booking_reference": booking_ref,
            "payment_method": checkout_request.payment_method,
            "status": "pending_payment",
            "total_amount": total_amount,
            "message": f"Please complete payment using {checkout_request.payment_method}"
        }

async def handle_stripe_checkout(booking: BookingConfirmation, checkout_request: CheckoutRequest):
    """Handle Stripe checkout process"""
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        
        success_url = checkout_request.success_url or f"{os.environ.get('BASE_URL', 'http://localhost:8000')}/booking-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = checkout_request.cancel_url or f"{os.environ.get('BASE_URL', 'http://localhost:8000')}/cart/{booking.cart_id}"
        
        checkout_session_request = CheckoutSessionRequest(
            amount=booking.total_amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "booking_id": booking.id,
                "booking_reference": booking.booking_reference,
                "customer_email": booking.customer_email
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_session_request)
        
        # Update booking with payment session
        booking.payment_session_id = session.session_id
        await db.bookings.update_one(
            {"id": booking.id},
            {"$set": {"payment_session_id": session.session_id}}
        )
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            booking_id=booking.id,
            payment_method="stripe",
            payment_provider="stripe",
            session_id=session.session_id,
            amount=booking.total_amount,
            currency="usd",
            metadata=checkout_session_request.metadata,
            customer_email=booking.customer_email
        )
        
        transaction_data = prepare_for_mongo(transaction.dict())
        await db.payment_transactions.insert_one(transaction_data)
        
        return {
            "booking_id": booking.id,
            "booking_reference": booking.booking_reference,
            "payment_method": "stripe",
            "checkout_url": session.url,
            "session_id": session.session_id,
            "total_amount": booking.total_amount
        }
        
    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment processing error: {str(e)}")

async def handle_paypal_checkout(booking: BookingConfirmation, checkout_request: CheckoutRequest):
    """Handle PayPal checkout process"""
    try:
        success_url = checkout_request.success_url or f"{os.environ.get('BASE_URL', 'http://localhost:8000')}/booking-success"
        cancel_url = checkout_request.cancel_url or f"{os.environ.get('BASE_URL', 'http://localhost:8000')}/cart/{booking.cart_id}"
        
        payment_result = await PayPalService.create_payment(booking, success_url, cancel_url)
        
        # Update booking with payment session
        booking.payment_session_id = payment_result['payment_id']
        await db.bookings.update_one(
            {"id": booking.id},
            {"$set": {"payment_session_id": payment_result['payment_id']}}
        )
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            booking_id=booking.id,
            payment_method="paypal",
            payment_provider="paypal",
            session_id=payment_result['payment_id'],
            amount=booking.total_amount,
            currency="usd",
            customer_email=booking.customer_email
        )
        
        transaction_data = prepare_for_mongo(transaction.dict())
        await db.payment_transactions.insert_one(transaction_data)
        
        return {
            "booking_id": booking.id,
            "booking_reference": booking.booking_reference,
            "payment_method": "paypal",
            "checkout_url": payment_result['approval_url'],
            "payment_id": payment_result['payment_id'],
            "total_amount": booking.total_amount
        }
        
    except Exception as e:
        logger.error(f"PayPal checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PayPal processing error: {str(e)}")

@api_router.get("/bookings", response_model=List[BookingConfirmation])
async def get_bookings():
    """Get all bookings"""
    try:
        bookings = await db.bookings.find().to_list(length=None)
        return [BookingConfirmation(**parse_from_mongo(booking)) for booking in bookings]
    except Exception as e:
        logger.error(f"Error fetching bookings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch bookings")

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str):
    """Get booking by ID"""
    try:
        booking = await db.bookings.find_one({"id": booking_id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return BookingConfirmation(**parse_from_mongo(booking))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch booking")

@api_router.post("/contact", response_model=ContactMessage)
async def submit_contact_form(contact: ContactCreate):
    """Submit contact form"""
    contact_dict = contact.dict()
    contact_obj = ContactMessage(**contact_dict)
    contact_data = prepare_for_mongo(contact_obj.dict())
    await db.contacts.insert_one(contact_data)
    return contact_obj

# PayPal webhook endpoint
@api_router.post("/webhook/paypal")
async def paypal_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle PayPal webhook notifications"""
    try:
        body = await request.body()
        webhook_data = json.loads(body.decode())
        
        # Process webhook event
        event_type = webhook_data.get("event_type")
        
        if event_type == "PAYMENT.SALE.COMPLETED":
            # Handle payment completion
            resource = webhook_data.get("resource", {})
            parent_payment = resource.get("parent_payment")
            
            if parent_payment:
                # Update booking and transaction status
                await db.bookings.update_one(
                    {"payment_session_id": parent_payment},
                    {"$set": {"payment_status": "completed", "status": "confirmed"}}
                )
                
                await db.payment_transactions.update_one(
                    {"session_id": parent_payment},
                    {"$set": {"payment_status": "completed"}}
                )
                
                # Get booking for notifications
                booking_data = await db.bookings.find_one({"payment_session_id": parent_payment})
                if booking_data:
                    booking = BookingConfirmation(**parse_from_mongo(booking_data))
                    background_tasks.add_task(send_booking_confirmation_email, booking)
                    background_tasks.add_task(send_telegram_notification, booking)
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"PayPal webhook processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

# Stripe webhook endpoint
@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        stripe_signature = request.headers.get("Stripe-Signature")
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Update transaction and booking status
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": "completed",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update booking status
            await db.bookings.update_one(
                {"payment_session_id": webhook_response.session_id},
                {"$set": {"payment_status": "completed", "status": "confirmed"}}
            )
            
            # Get booking for notifications
            booking_data = await db.bookings.find_one({"payment_session_id": webhook_response.session_id})
            if booking_data:
                booking = BookingConfirmation(**parse_from_mongo(booking_data))
                background_tasks.add_task(send_booking_confirmation_email, booking)
                background_tasks.add_task(send_telegram_notification, booking)
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)