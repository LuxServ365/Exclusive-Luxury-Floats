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
import httpx
import json
import paypalrestsdk
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
SENDER_EMAIL = os.environ.get('SENDER_EMAIL')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')

# PayPal Configuration
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'paypal_client_id_here')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', 'paypal_client_secret_here')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')  # 'sandbox' or 'live'

# Gmail SMTP Configuration
GMAIL_EMAIL = os.environ.get('GMAIL_EMAIL', 'exclusivefloat850@gmail.com')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', 'your_gmail_app_password_here')

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
    trip_protection: bool = False
    additional_fees: Optional[Dict] = None
    final_total: float

class BookingConfirmation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cart_id: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    items: List[Dict[str, Any]] = []
    total_amount: float
    trip_protection: bool = False
    trip_protection_fee: float = 0.0
    tax_amount: float = 0.0
    credit_card_fee: float = 0.0
    final_total: float
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

# Configure logging first
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

# Global services
google_sheets = GoogleSheetsService()

# Cart storage (in production, use Redis or database)
carts_storage = {}

# Gmail SMTP Email service
async def send_booking_confirmation_email(booking: BookingConfirmation):
    """Send booking confirmation email using Gmail SMTP"""
    try:
        if not GMAIL_APP_PASSWORD or GMAIL_APP_PASSWORD == "your_gmail_app_password_here":
            logger.warning("Gmail app password not configured")
            return False
            
        items_html = ""
        items_subtotal = 0
        for item in booking.items:
            item_total = item['price'] * item['quantity']
            items_subtotal += item_total
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
        
        # Calculate fee breakdown for email
        trip_protection_html = f"""
        <div style="margin: 5px 0;">
            <span>Trip Protection:</span>
            <span style="float: right;">${booking.trip_protection_fee:.2f}</span>
        </div>
        """ if booking.trip_protection else ""
        
        credit_card_fee_html = f"""
        <div style="margin: 5px 0;">
            <span>Credit Card Processing Fee:</span>
            <span style="float: right;">${booking.credit_card_fee:.2f}</span>
        </div>
        """ if booking.credit_card_fee > 0 else ""
        
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
                            <div style="margin: 5px 0;">
                                <span>Services Subtotal:</span>
                                <span style="float: right;">${items_subtotal:.2f}</span>
                            </div>
                            {trip_protection_html}
                            <div style="margin: 5px 0;">
                                <span>Bay County Tax (7%):</span>
                                <span style="float: right;">${booking.tax_amount:.2f}</span>
                            </div>
                            {credit_card_fee_html}
                            <div style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px;">
                                <p><strong style="font-size: 18px;">Final Total: ${booking.final_total:.2f}</strong></p>
                            </div>
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
                    <strong>Email:</strong> {GMAIL_EMAIL}</p>
                    
                    <p style="margin-top: 30px;">We look forward to providing you with an unforgettable experience on the beautiful emerald waters of Panama City, Florida!</p>
                    
                    <p>Best regards,<br>
                    <strong>The Exclusive Gulf Float Team</strong></p>
                </div>
            </body>
        </html>
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Booking Confirmed - Exclusive Gulf Float - {booking.booking_reference}"
        msg['From'] = GMAIL_EMAIL
        msg['To'] = booking.customer_email
        
        # Create HTML part
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email via Gmail SMTP
        await aiosmtplib.send(
            msg,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=GMAIL_EMAIL,
            password=GMAIL_APP_PASSWORD,
        )
        
        logger.info(f"Email sent successfully to {booking.customer_email}")
        return True
        
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
                        "total": f"{booking.final_total:.2f}",
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
    carts_storage[cart.id] = cart
    return {"cart_id": cart.id, "expires_at": cart.expires_at}

@api_router.get("/cart/{cart_id}")
async def get_cart(cart_id: str):
    """Get cart contents"""
    if cart_id not in carts_storage:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart = carts_storage[cart_id]
    if datetime.now(timezone.utc) > cart.expires_at:
        del carts_storage[cart_id]
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
    if cart_id not in carts_storage:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart = carts_storage[cart_id]
    if datetime.now(timezone.utc) > cart.expires_at:
        del carts_storage[cart_id]
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
    return {"message": "Item added to cart", "cart_id": cart_id}

@api_router.delete("/cart/{cart_id}/item/{item_index}")
async def remove_from_cart(cart_id: str, item_index: int):
    """Remove item from cart"""
    if cart_id not in carts_storage:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart = carts_storage[cart_id]
    if item_index < 0 or item_index >= len(cart.items):
        raise HTTPException(status_code=400, detail="Invalid item index")
    
    cart.items.pop(item_index)
    return {"message": "Item removed from cart"}

@api_router.put("/cart/{cart_id}/customer")
async def update_cart_customer(cart_id: str, customer_info: CustomerInfo):
    """Update customer information in cart"""
    if cart_id not in carts_storage:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart = carts_storage[cart_id]
    cart.customer_name = customer_info.name
    cart.customer_email = customer_info.email
    cart.customer_phone = customer_info.phone
    
    return {"message": "Customer information updated"}

@api_router.post("/cart/{cart_id}/checkout")
async def checkout_cart(cart_id: str, checkout_request: CheckoutRequest, background_tasks: BackgroundTasks):
    """Checkout cart and create booking"""
    if cart_id not in carts_storage:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart = carts_storage[cart_id]
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Create booking confirmation
    booking_items = []
    items_subtotal = 0
    
    for item in cart.items:
        service = SERVICES[item.service_id]
        item_total = service['price'] * item.quantity
        items_subtotal += item_total
        
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
    
    # Calculate fees and taxes
    additional_fees = checkout_request.additional_fees or {}
    trip_protection_fee = additional_fees.get('trip_protection_fee', 0.0)
    tax_rate = additional_fees.get('tax_rate', 0.07)
    credit_card_fee_rate = additional_fees.get('credit_card_fee_rate', 0.0)
    
    taxable_amount = items_subtotal + trip_protection_fee
    tax_amount = taxable_amount * tax_rate
    subtotal_with_tax = taxable_amount + tax_amount
    credit_card_fee = subtotal_with_tax * credit_card_fee_rate
    final_total = subtotal_with_tax + credit_card_fee
    
    # Generate booking reference
    booking_ref = f"EGF{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}"
    
    booking = BookingConfirmation(
        cart_id=cart_id,
        customer_name=checkout_request.customer_info.name,
        customer_email=checkout_request.customer_info.email,
        customer_phone=checkout_request.customer_info.phone,
        items=booking_items,
        total_amount=items_subtotal,
        trip_protection=checkout_request.trip_protection,
        trip_protection_fee=trip_protection_fee,
        tax_amount=tax_amount,
        credit_card_fee=credit_card_fee,
        final_total=final_total,
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
        # Handle manual payment methods (Venmo, CashApp, Zelle)
        payment_instructions = {
            "venmo": {
                "account": "@ExclusiveFloat850",
                "instructions": f"Please send ${final_total:.2f} to @ExclusiveFloat850 on Venmo with note: '{booking_ref}'"
            },
            "cashapp": {
                "account": "$ExclusiveFloat",
                "instructions": f"Please send ${final_total:.2f} to $ExclusiveFloat on Cash App with note: '{booking_ref}'"
            },
            "zelle": {
                "account": "exclusivefloat850@gmail.com",
                "instructions": f"Please send ${final_total:.2f} to exclusivefloat850@gmail.com via Zelle with note: '{booking_ref}'"
            }
        }
        
        method_info = payment_instructions.get(checkout_request.payment_method, {})
        
        return {
            "booking_id": booking.id,
            "booking_reference": booking_ref,
            "payment_method": checkout_request.payment_method,
            "status": "pending_payment",
            "total_amount": final_total,
            "payment_instructions": method_info.get("instructions", ""),
            "payment_account": method_info.get("account", ""),
            "message": f"Booking created! Please complete payment using {checkout_request.payment_method} and we'll confirm your booking."
        }

async def handle_stripe_checkout(booking: BookingConfirmation, checkout_request: CheckoutRequest):
    """Handle Stripe checkout process"""
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        
        success_url = checkout_request.success_url or f"{os.environ.get('BASE_URL', 'http://localhost:8000')}/booking-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = checkout_request.cancel_url or f"{os.environ.get('BASE_URL', 'http://localhost:8000')}/cart/{booking.cart_id}"
        
        checkout_session_request = CheckoutSessionRequest(
            amount=booking.final_total,
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
            amount=booking.final_total,
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
            "total_amount": booking.final_total
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
            amount=booking.final_total,
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
            "total_amount": booking.final_total
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)