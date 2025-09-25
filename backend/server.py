from fastapi import FastAPI, APIRouter, HTTPException, Request, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, date, time
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import sendgrid
from sendgrid.helpers.mail import Mail
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Exclusive Gulf Float API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')

# Service Categories and Pricing
SERVICES = {
    "crystal_kayak": {
        "name": "Crystal-Clear Kayak Rental (2 person)",
        "price": 60.0,
        "duration": "hourly"
    },
    "canoe": {
        "name": "Canoe Rental (2+ people)", 
        "price": 75.0,
        "duration": "hourly"
    },
    "paddle_board": {
        "name": "Paddle Board Rental",
        "price": 75.0,
        "duration": "hourly"
    },
    "luxury_cabana_hourly": {
        "name": "Luxury Floating Cabana (per person per hour)",
        "price": 50.0,
        "duration": "hourly"
    },
    "luxury_cabana_3hr": {
        "name": "Luxury Floating Cabana (3 hours)",
        "price": 100.0,
        "duration": "3 hours"
    },
    "luxury_cabana_4hr": {
        "name": "Luxury Floating Cabana (4 hours, 6 person max)",
        "price": 400.0,
        "duration": "4 hours"
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
class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    service_id: str
    service_name: str
    price: float
    quantity: int = 1
    booking_date: date
    booking_time: time
    special_requests: Optional[str] = None
    payment_status: str = "pending"
    payment_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    service_id: str
    quantity: int = 1
    booking_date: date
    booking_time: time
    special_requests: Optional[str] = None

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"
    metadata: Dict = {}
    booking_id: Optional[str] = None
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

# Email service
async def send_booking_confirmation_email(booking: Booking):
    """Send booking confirmation email using SendGrid"""
    try:
        if not SENDGRID_API_KEY or SENDGRID_API_KEY == "your_sendgrid_api_key_here":
            logger.warning("SendGrid API key not configured")
            return False
            
        service_info = SERVICES.get(booking.service_id, {})
        
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
                        <p><strong>Service:</strong> {booking.service_name}</p>
                        <p><strong>Date:</strong> {booking.booking_date}</p>
                        <p><strong>Time:</strong> {booking.booking_time}</p>
                        <p><strong>Quantity:</strong> {booking.quantity}</p>
                        <p><strong>Total:</strong> ${booking.price * booking.quantity:.2f}</p>
                        {f'<p><strong>Special Requests:</strong> {booking.special_requests}</p>' if booking.special_requests else ''}
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
            subject=f"Booking Confirmed - Exclusive Gulf Float - {booking.booking_date}",
            html_content=html_content
        )
        
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code == 202
        
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
        return False

# Telegram notification service
async def send_telegram_notification(booking: Booking):
    """Send booking notification to Telegram"""
    try:
        if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
            logger.warning("Telegram bot token not configured")
            return False
            
        message = f"""🌊 NEW BOOKING - Exclusive Gulf Float 🌊

👤 Customer: {booking.customer_name}
📧 Email: {booking.customer_email}
📱 Phone: {booking.customer_phone}

🚤 Service: {booking.service_name}
📅 Date: {booking.booking_date}
⏰ Time: {booking.booking_time}
🔢 Quantity: {booking.quantity}
💰 Total: ${booking.price * booking.quantity:.2f}

{f'📝 Special Requests: {booking.special_requests}' if booking.special_requests else ''}

💳 Payment Status: {booking.payment_status}
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

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Welcome to Exclusive Gulf Float API"}

@api_router.get("/services")
async def get_services():
    """Get available services and pricing"""
    return {"services": SERVICES}

@api_router.post("/contact", response_model=ContactMessage)
async def submit_contact_form(contact: ContactCreate):
    """Submit contact form"""
    contact_dict = contact.dict()
    contact_obj = ContactMessage(**contact_dict)
    contact_data = prepare_for_mongo(contact_obj.dict())
    await db.contacts.insert_one(contact_data)
    return contact_obj

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate, background_tasks: BackgroundTasks):
    """Create a new booking"""
    # Validate service exists
    if booking.service_id not in SERVICES:
        raise HTTPException(status_code=400, detail="Invalid service selected")
    
    service = SERVICES[booking.service_id]
    
    # Create booking object
    booking_dict = booking.dict()
    booking_dict.update({
        "service_name": service["name"],
        "price": service["price"]
    })
    
    booking_obj = Booking(**booking_dict)
    booking_data = prepare_for_mongo(booking_obj.dict())
    
    # Save to database
    await db.bookings.insert_one(booking_data)
    
    # Send notifications in background
    background_tasks.add_task(send_booking_confirmation_email, booking_obj)
    background_tasks.add_task(send_telegram_notification, booking_obj)
    
    return booking_obj

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    """Get all bookings"""
    bookings = await db.bookings.find().to_list(length=None)
    return [Booking(**parse_from_mongo(booking)) for booking in bookings]

@api_router.post("/payments/checkout/session")
async def create_checkout_session(request: Request):
    """Create Stripe checkout session"""
    try:
        body = await request.json()
        booking_id = body.get("booking_id")
        origin_url = body.get("origin_url", str(request.base_url).rstrip('/'))
        
        if not booking_id:
            raise HTTPException(status_code=400, detail="Booking ID required")
            
        # Get booking details
        booking_data = await db.bookings.find_one({"id": booking_id})
        if not booking_data:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        booking = Booking(**parse_from_mongo(booking_data))
        
        # Calculate total amount
        total_amount = float(booking.price * booking.quantity)
        
        # Initialize Stripe checkout
        host_url = origin_url
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create checkout session request
        success_url = f"{origin_url}/booking-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/bookings"
        
        checkout_request = CheckoutSessionRequest(
            amount=total_amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "booking_id": booking.id,
                "customer_email": booking.customer_email,
                "service_id": booking.service_id
            }
        )
        
        # Create session
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            session_id=session.session_id,
            amount=total_amount,
            currency="usd",
            payment_status="pending",
            metadata=checkout_request.metadata,
            booking_id=booking.id,
            customer_email=booking.customer_email
        )
        
        transaction_data = prepare_for_mongo(transaction.dict())
        await db.payment_transactions.insert_one(transaction_data)
        
        # Update booking with session ID
        await db.bookings.update_one(
            {"id": booking.id},
            {"$set": {"payment_session_id": session.session_id}}
        )
        
        return {"url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        logger.error(f"Payment session creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment processing error: {str(e)}")

@api_router.get("/payments/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Get payment status"""
    try:
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update booking payment status if paid
        if status.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            if transaction and transaction.get("booking_id"):
                await db.bookings.update_one(
                    {"id": transaction["booking_id"]},
                    {"$set": {"payment_status": "paid"}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
        
    except Exception as e:
        logger.error(f"Failed to get payment status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
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
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update booking status
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
            if transaction and transaction.get("booking_id"):
                await db.bookings.update_one(
                    {"id": transaction["booking_id"]},
                    {"$set": {"payment_status": "paid"}}
                )
        
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
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()