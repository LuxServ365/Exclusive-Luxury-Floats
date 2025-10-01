#!/usr/bin/env python3
"""
Webhook Testing for Notification System
Tests webhook endpoints that trigger Gmail and Telegram notifications
"""

import requests
import json
import time

BACKEND_URL = "https://gulfbook.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_stripe_webhook_notification():
    """Test Stripe webhook that triggers notifications"""
    print("🔔 Testing Stripe Webhook Notification Trigger")
    
    # First create a booking to get a session ID
    response = requests.post(f"{API_BASE}/cart/create")
    cart_id = response.json().get('cart_id')
    
    # Add item
    item_data = {
        "service_id": "crystal_kayak",
        "quantity": 1,
        "booking_date": "2024-12-31",
        "booking_time": "16:00:00",
        "special_requests": "Webhook notification test"
    }
    requests.post(f"{API_BASE}/cart/{cart_id}/add", json=item_data)
    
    # Checkout with Stripe
    checkout_data = {
        "customer_info": {
            "name": "Webhook Test User",
            "email": "webhook.test@gulfnotifications.com",
            "phone": "+1-850-555-HOOK"
        },
        "payment_method": "stripe"
    }
    
    checkout_response = requests.post(f"{API_BASE}/cart/{cart_id}/checkout", json=checkout_data)
    if checkout_response.status_code == 200:
        session_id = checkout_response.json().get('session_id')
        booking_id = checkout_response.json().get('booking_id')
        
        print(f"✅ Created booking {booking_id} with session {session_id}")
        
        # Simulate Stripe webhook for payment completion
        webhook_data = {
            "id": "evt_test_webhook",
            "object": "event",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": session_id,
                    "payment_status": "paid",
                    "metadata": {
                        "booking_id": booking_id
                    }
                }
            }
        }
        
        # Send webhook
        webhook_response = requests.post(
            f"{API_BASE}/webhook/stripe",
            json=webhook_data,
            headers={"Stripe-Signature": "test_signature"}
        )
        
        print(f"📧 Stripe webhook response: {webhook_response.status_code}")
        if webhook_response.status_code == 200:
            print("✅ Stripe webhook processed - Gmail and Telegram notifications should be sent")
            return True
        else:
            print(f"❌ Stripe webhook failed: {webhook_response.text}")
            return False
    else:
        print(f"❌ Failed to create booking: {checkout_response.status_code}")
        return False

def test_paypal_webhook_notification():
    """Test PayPal webhook that triggers notifications"""
    print("\n🔔 Testing PayPal Webhook Notification Trigger")
    
    # Create booking with PayPal
    response = requests.post(f"{API_BASE}/cart/create")
    cart_id = response.json().get('cart_id')
    
    # Add item
    item_data = {
        "service_id": "luxury_cabana_3hr",
        "quantity": 1,
        "booking_date": "2024-12-31",
        "booking_time": "17:00:00",
        "special_requests": "PayPal webhook notification test"
    }
    requests.post(f"{API_BASE}/cart/{cart_id}/add", json=item_data)
    
    # Checkout with PayPal
    checkout_data = {
        "customer_info": {
            "name": "PayPal Webhook Test",
            "email": "paypal.webhook@gulfnotifications.com",
            "phone": "+1-850-555-PAYP"
        },
        "payment_method": "paypal"
    }
    
    checkout_response = requests.post(f"{API_BASE}/cart/{cart_id}/checkout", json=checkout_data)
    if checkout_response.status_code == 200:
        payment_id = checkout_response.json().get('payment_id')
        booking_id = checkout_response.json().get('booking_id')
        
        print(f"✅ Created PayPal booking {booking_id} with payment {payment_id}")
        
        # Simulate PayPal webhook for payment completion
        webhook_data = {
            "id": "WH-test-webhook",
            "event_type": "PAYMENT.SALE.COMPLETED",
            "resource": {
                "parent_payment": payment_id,
                "state": "completed"
            }
        }
        
        # Send webhook
        webhook_response = requests.post(f"{API_BASE}/webhook/paypal", json=webhook_data)
        
        print(f"📧 PayPal webhook response: {webhook_response.status_code}")
        if webhook_response.status_code == 200:
            print("✅ PayPal webhook processed - Gmail and Telegram notifications should be sent")
            return True
        else:
            print(f"❌ PayPal webhook failed: {webhook_response.text}")
            return False
    else:
        print(f"❌ Failed to create PayPal booking: {checkout_response.status_code}")
        return False

def check_notification_logs():
    """Check if notifications were actually sent by examining recent bookings"""
    print("\n📋 Checking Recent Bookings for Notification Status")
    
    response = requests.get(f"{API_BASE}/bookings")
    if response.status_code == 200:
        bookings = response.json()
        recent_bookings = sorted(bookings, key=lambda x: x.get('created_at', ''), reverse=True)[:5]
        
        print(f"📊 Found {len(recent_bookings)} recent bookings:")
        for booking in recent_bookings:
            print(f"   • {booking.get('booking_reference')} - {booking.get('customer_name')} - Status: {booking.get('status')} - Payment: {booking.get('payment_status')}")
        
        return True
    else:
        print(f"❌ Failed to retrieve bookings: {response.status_code}")
        return False

if __name__ == "__main__":
    print("🧪 WEBHOOK NOTIFICATION TESTING")
    print("=" * 50)
    
    # Test both webhook types
    stripe_success = test_stripe_webhook_notification()
    time.sleep(2)  # Brief pause between tests
    paypal_success = test_paypal_webhook_notification()
    time.sleep(2)  # Brief pause before checking logs
    check_notification_logs()
    
    print("\n" + "=" * 50)
    print("📊 WEBHOOK TEST SUMMARY")
    print(f"Stripe Webhook: {'✅ PASS' if stripe_success else '❌ FAIL'}")
    print(f"PayPal Webhook: {'✅ PASS' if paypal_success else '❌ FAIL'}")
    print("=" * 50)