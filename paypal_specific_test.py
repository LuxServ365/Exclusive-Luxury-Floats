#!/usr/bin/env python3
"""
PayPal Integration Specific Testing Suite
Tests PayPal configuration, authentication, and payment flow as requested
"""

import requests
import json
import uuid
from datetime import datetime, date, time
import sys
import os
import paypalrestsdk

# Backend URL from environment
BACKEND_URL = "https://gulfbook.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class PayPalTester:
    def __init__(self):
        self.session = requests.Session()
        self.cart_id = None
        self.booking_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def test_paypal_sdk_configuration(self):
        """Test PayPal SDK configuration with provided credentials"""
        try:
            # Test PayPal SDK configuration by making a simple API call
            # This will verify the credentials are valid
            
            # Configure PayPal SDK (same as in server.py)
            paypalrestsdk.configure({
                "mode": "sandbox",  # sandbox mode
                "client_id": "AY3aTHg4SOz9jCEfB7CaShZ_iT_FWkcHAsrKCz4XuRxx1DrV1zkWQJSGHkwOGnhYMjTvVCXAnj5A0-Ca",
                "client_secret": "EFL52lEvc00oBJCO0zoT7KhwyqBxomNW_xxUlh60h4jbgnCa_aaaHgg4x-BplrnzKMAlKrx0bXMWIBHY"
            })
            
            # Test authentication by creating a simple payment object (without executing)
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": "http://example.com/success",
                    "cancel_url": "http://example.com/cancel"
                },
                "transactions": [{
                    "amount": {
                        "total": "10.00",
                        "currency": "USD"
                    },
                    "description": "Test payment for credential validation"
                }]
            })
            
            # Try to create the payment - this will test authentication
            if payment.create():
                self.log_test("PayPal SDK Configuration", True, f"PayPal SDK configured successfully, Payment ID: {payment.id}")
                return True
            else:
                self.log_test("PayPal SDK Configuration", False, f"PayPal authentication failed: {payment.error}")
                return False
                
        except Exception as e:
            self.log_test("PayPal SDK Configuration", False, f"PayPal SDK error: {str(e)}")
            return False
    
    def test_paypal_api_authentication(self):
        """Test PayPal API authentication directly"""
        try:
            # Test by getting an access token
            import base64
            
            client_id = "AY3aTHg4SOz9jCEfB7CaShZ_iT_FWkcHAsrKCz4XuRxx1DrV1zkWQJSGHkwOGnhYMjTvVCXAnj5A0-Ca"
            client_secret = "EFL52lEvc00oBJCO0zoT7KhwyqBxomNW_xxUlh60h4jbgnCa_aaaHgg4x-BplrnzKMAlKrx0bXMWIBHY"
            
            # Encode credentials
            credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
            
            # Request access token
            headers = {
                'Accept': 'application/json',
                'Accept-Language': 'en_US',
                'Authorization': f'Basic {credentials}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            data = 'grant_type=client_credentials'
            
            response = requests.post(
                'https://api.sandbox.paypal.com/v1/oauth2/token',
                headers=headers,
                data=data
            )
            
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get('access_token')
                if access_token:
                    self.log_test("PayPal API Authentication", True, f"Successfully obtained access token: {access_token[:20]}...")
                    return True
                else:
                    self.log_test("PayPal API Authentication", False, "No access token in response")
                    return False
            else:
                self.log_test("PayPal API Authentication", False, f"Authentication failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("PayPal API Authentication", False, f"Authentication error: {str(e)}")
            return False
    
    def test_create_cart_for_paypal(self):
        """Create a test cart with items for PayPal testing"""
        try:
            # Create cart
            response = self.session.post(f"{API_BASE}/cart/create")
            if response.status_code != 200:
                self.log_test("Create Cart for PayPal", False, f"Failed to create cart: {response.status_code}")
                return False
                
            self.cart_id = response.json().get('cart_id')
            
            # Add multiple items to test PayPal with various services
            items = [
                {
                    "service_id": "crystal_kayak",
                    "quantity": 2,
                    "booking_date": "2024-12-28",
                    "booking_time": "14:00:00",
                    "special_requests": "LED lighting preferred"
                },
                {
                    "service_id": "luxury_cabana_3hr",
                    "quantity": 1,
                    "booking_date": "2024-12-28",
                    "booking_time": "15:00:00",
                    "special_requests": "Quiet location"
                }
            ]
            
            for item in items:
                response = self.session.post(f"{API_BASE}/cart/{self.cart_id}/add", json=item)
                if response.status_code != 200:
                    self.log_test("Create Cart for PayPal", False, f"Failed to add item: {response.status_code}")
                    return False
            
            # Verify cart contents
            response = self.session.get(f"{API_BASE}/cart/{self.cart_id}")
            if response.status_code == 200:
                cart_data = response.json()
                total_amount = cart_data.get('total_amount', 0)
                items_count = len(cart_data.get('items', []))
                
                if items_count == 2 and total_amount > 0:
                    self.log_test("Create Cart for PayPal", True, f"Cart created with {items_count} items, total: ${total_amount}")
                    return True
                else:
                    self.log_test("Create Cart for PayPal", False, f"Cart validation failed: {items_count} items, ${total_amount}")
                    return False
            else:
                self.log_test("Create Cart for PayPal", False, f"Failed to verify cart: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Create Cart for PayPal", False, f"Error: {str(e)}")
            return False
    
    def test_paypal_checkout_flow(self):
        """Test PayPal checkout flow creation"""
        if not self.cart_id:
            self.log_test("PayPal Checkout Flow", False, "No cart_id available")
            return False
            
        try:
            checkout_data = {
                "customer_info": {
                    "name": "Emma Rodriguez",
                    "email": "emma.rodriguez@example.com",
                    "phone": "+1-555-0789"
                },
                "payment_method": "paypal",
                "success_url": f"{BACKEND_URL}/booking-success",
                "cancel_url": f"{BACKEND_URL}/cart/{self.cart_id}"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{self.cart_id}/checkout", json=checkout_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify all required PayPal response fields
                required_fields = ['booking_id', 'booking_reference', 'payment_method', 'checkout_url', 'payment_id', 'total_amount']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.booking_id = data.get('booking_id')
                    checkout_url = data.get('checkout_url')
                    payment_id = data.get('payment_id')
                    
                    # Verify PayPal-specific fields
                    if data.get('payment_method') == 'paypal' and 'paypal.com' in checkout_url:
                        self.log_test("PayPal Checkout Flow", True, 
                                    f"PayPal checkout created - Booking: {self.booking_id}, Payment ID: {payment_id}")
                        return True
                    else:
                        self.log_test("PayPal Checkout Flow", False, 
                                    f"Invalid PayPal response - method: {data.get('payment_method')}, URL: {checkout_url}")
                        return False
                else:
                    self.log_test("PayPal Checkout Flow", False, f"Missing required fields: {missing_fields}")
                    return False
            else:
                self.log_test("PayPal Checkout Flow", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("PayPal Checkout Flow", False, f"Error: {str(e)}")
            return False
    
    def test_paypal_vs_stripe_availability(self):
        """Test that both Stripe and PayPal payment methods are available"""
        try:
            # Create two carts to test both payment methods
            stripe_cart_response = self.session.post(f"{API_BASE}/cart/create")
            paypal_cart_response = self.session.post(f"{API_BASE}/cart/create")
            
            if stripe_cart_response.status_code != 200 or paypal_cart_response.status_code != 200:
                self.log_test("PayPal vs Stripe Availability", False, "Failed to create test carts")
                return False
            
            stripe_cart_id = stripe_cart_response.json().get('cart_id')
            paypal_cart_id = paypal_cart_response.json().get('cart_id')
            
            # Add same item to both carts
            item_data = {
                "service_id": "paddle_board",
                "quantity": 1,
                "booking_date": "2024-12-29",
                "booking_time": "11:00:00"
            }
            
            for cart_id in [stripe_cart_id, paypal_cart_id]:
                response = self.session.post(f"{API_BASE}/cart/{cart_id}/add", json=item_data)
                if response.status_code != 200:
                    self.log_test("PayPal vs Stripe Availability", False, f"Failed to add item to cart {cart_id}")
                    return False
            
            # Test Stripe checkout
            stripe_checkout = {
                "customer_info": {
                    "name": "Test Stripe User",
                    "email": "stripe@example.com"
                },
                "payment_method": "stripe"
            }
            
            stripe_response = self.session.post(f"{API_BASE}/cart/{stripe_cart_id}/checkout", json=stripe_checkout)
            
            # Test PayPal checkout
            paypal_checkout = {
                "customer_info": {
                    "name": "Test PayPal User",
                    "email": "paypal@example.com"
                },
                "payment_method": "paypal"
            }
            
            paypal_response = self.session.post(f"{API_BASE}/cart/{paypal_cart_id}/checkout", json=paypal_checkout)
            
            # Verify both work
            stripe_success = stripe_response.status_code == 200 and 'stripe.com' in stripe_response.json().get('checkout_url', '')
            paypal_success = paypal_response.status_code == 200 and 'paypal.com' in paypal_response.json().get('checkout_url', '')
            
            if stripe_success and paypal_success:
                self.log_test("PayPal vs Stripe Availability", True, "Both Stripe and PayPal payment methods working correctly")
                return True
            else:
                details = f"Stripe: {'✅' if stripe_success else '❌'}, PayPal: {'✅' if paypal_success else '❌'}"
                self.log_test("PayPal vs Stripe Availability", False, f"Payment method availability issue - {details}")
                return False
                
        except Exception as e:
            self.log_test("PayPal vs Stripe Availability", False, f"Error: {str(e)}")
            return False
    
    def test_paypal_transaction_recording(self):
        """Test PayPal payment transaction recording in database"""
        if not self.booking_id:
            self.log_test("PayPal Transaction Recording", False, "No booking_id available")
            return False
            
        try:
            # Get the booking to verify it was recorded correctly
            response = self.session.get(f"{API_BASE}/bookings/{self.booking_id}")
            
            if response.status_code == 200:
                booking_data = response.json()
                
                # Verify PayPal-specific fields
                payment_method = booking_data.get('payment_method')
                payment_session_id = booking_data.get('payment_session_id')
                booking_reference = booking_data.get('booking_reference')
                
                if payment_method == 'paypal' and payment_session_id and booking_reference:
                    self.log_test("PayPal Transaction Recording", True, 
                                f"PayPal booking recorded - Ref: {booking_reference}, Session: {payment_session_id}")
                    return True
                else:
                    self.log_test("PayPal Transaction Recording", False, 
                                f"Invalid booking data - Method: {payment_method}, Session: {payment_session_id}")
                    return False
            else:
                self.log_test("PayPal Transaction Recording", False, f"Failed to retrieve booking: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("PayPal Transaction Recording", False, f"Error: {str(e)}")
            return False
    
    def run_paypal_tests(self):
        """Run all PayPal-specific tests"""
        print("🔵 Starting PayPal Integration Specific Tests")
        print("=" * 60)
        
        # Test 1: PayPal Configuration
        self.test_paypal_sdk_configuration()
        
        # Test 2: PayPal API Authentication
        self.test_paypal_api_authentication()
        
        # Test 3: Create test cart with items
        if self.test_create_cart_for_paypal():
            # Test 4: PayPal checkout flow
            if self.test_paypal_checkout_flow():
                # Test 5: PayPal transaction recording
                self.test_paypal_transaction_recording()
        
        # Test 6: Compare PayPal vs Stripe availability
        self.test_paypal_vs_stripe_availability()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 PAYPAL TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total PayPal Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED PAYPAL TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        else:
            print("\n🎉 ALL PAYPAL TESTS PASSED!")
            print("✅ PayPal SDK is properly configured")
            print("✅ PayPal API authentication working")
            print("✅ PayPal checkout flow creation successful")
            print("✅ PayPal payment session creation working")
            print("✅ PayPal payment URLs and approval flow setup correct")
            print("✅ PayPal payment creation response verified")
            print("✅ PayPal payment transaction recording in database working")
            print("✅ PayPal booking creation with PayPal payment method successful")
            print("✅ Both Stripe and PayPal payment methods available")
        
        return passed == total

if __name__ == "__main__":
    tester = PayPalTester()
    success = tester.run_paypal_tests()
    sys.exit(0 if success else 1)