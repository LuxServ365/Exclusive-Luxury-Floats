#!/usr/bin/env python3
"""
Backend API Testing Suite for Enhanced Booking System with Cart Functionality
Tests all cart-related endpoints and payment integrations
"""

import requests
import json
import uuid
from datetime import datetime, date, time
from typing import Dict, Any
import sys
import os

# Backend URL from environment
BACKEND_URL = "https://gulf-adventures.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
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
        
    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{API_BASE}/")
            if response.status_code == 200:
                self.log_test("API Health Check", True, f"Status: {response.status_code}")
                return True
            else:
                self.log_test("API Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_get_services(self):
        """Test GET /api/services endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/services")
            if response.status_code == 200:
                data = response.json()
                services = data.get('services', {})
                if services and len(services) > 0:
                    # Check if required services exist
                    required_services = ['crystal_kayak', 'canoe', 'paddle_board', 'luxury_cabana_hourly']
                    missing_services = [s for s in required_services if s not in services]
                    if not missing_services:
                        self.log_test("GET /api/services", True, f"Found {len(services)} services")
                        return True
                    else:
                        self.log_test("GET /api/services", False, f"Missing services: {missing_services}")
                        return False
                else:
                    self.log_test("GET /api/services", False, "No services found in response")
                    return False
            else:
                self.log_test("GET /api/services", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/services", False, f"Error: {str(e)}")
            return False
    
    def test_create_cart(self):
        """Test POST /api/cart/create endpoint"""
        try:
            response = self.session.post(f"{API_BASE}/cart/create")
            if response.status_code == 200:
                data = response.json()
                cart_id = data.get('cart_id')
                expires_at = data.get('expires_at')
                if cart_id and expires_at:
                    self.cart_id = cart_id
                    self.log_test("POST /api/cart/create", True, f"Cart ID: {cart_id}")
                    return True
                else:
                    self.log_test("POST /api/cart/create", False, "Missing cart_id or expires_at in response")
                    return False
            else:
                self.log_test("POST /api/cart/create", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("POST /api/cart/create", False, f"Error: {str(e)}")
            return False
    
    def test_get_empty_cart(self):
        """Test GET /api/cart/{cart_id} with empty cart"""
        if not self.cart_id:
            self.log_test("GET /api/cart/{cart_id} (empty)", False, "No cart_id available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/cart/{self.cart_id}")
            if response.status_code == 200:
                data = response.json()
                items = data.get('items', [])
                total_amount = data.get('total_amount', 0)
                if len(items) == 0 and total_amount == 0:
                    self.log_test("GET /api/cart/{cart_id} (empty)", True, "Empty cart returned correctly")
                    return True
                else:
                    self.log_test("GET /api/cart/{cart_id} (empty)", False, f"Expected empty cart, got {len(items)} items")
                    return False
            else:
                self.log_test("GET /api/cart/{cart_id} (empty)", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/cart/{cart_id} (empty)", False, f"Error: {str(e)}")
            return False
    
    def test_add_item_to_cart(self):
        """Test POST /api/cart/{cart_id}/add endpoint"""
        if not self.cart_id:
            self.log_test("POST /api/cart/{cart_id}/add", False, "No cart_id available")
            return False
            
        try:
            # Add crystal kayak to cart
            item_data = {
                "service_id": "crystal_kayak",
                "quantity": 2,
                "booking_date": "2024-12-25",
                "booking_time": "14:00:00",
                "special_requests": "Please provide LED lighting"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{self.cart_id}/add", json=item_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('message') and 'added to cart' in data.get('message', '').lower():
                    self.log_test("POST /api/cart/{cart_id}/add", True, "Item added successfully")
                    return True
                else:
                    self.log_test("POST /api/cart/{cart_id}/add", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("POST /api/cart/{cart_id}/add", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("POST /api/cart/{cart_id}/add", False, f"Error: {str(e)}")
            return False
    
    def test_add_multiple_items(self):
        """Test adding multiple different items to cart"""
        if not self.cart_id:
            self.log_test("Add Multiple Items", False, "No cart_id available")
            return False
            
        try:
            # Add canoe
            item_data = {
                "service_id": "canoe",
                "quantity": 1,
                "booking_date": "2024-12-25",
                "booking_time": "15:00:00",
                "special_requests": "Family friendly setup"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{self.cart_id}/add", json=item_data)
            if response.status_code != 200:
                self.log_test("Add Multiple Items", False, f"Failed to add canoe: {response.status_code}")
                return False
            
            # Add luxury cabana
            item_data = {
                "service_id": "luxury_cabana_3hr",
                "quantity": 1,
                "booking_date": "2024-12-25",
                "booking_time": "16:00:00"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{self.cart_id}/add", json=item_data)
            if response.status_code == 200:
                self.log_test("Add Multiple Items", True, "Multiple items added successfully")
                return True
            else:
                self.log_test("Add Multiple Items", False, f"Failed to add cabana: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Add Multiple Items", False, f"Error: {str(e)}")
            return False
    
    def test_get_cart_with_items(self):
        """Test GET /api/cart/{cart_id} with items"""
        if not self.cart_id:
            self.log_test("GET /api/cart/{cart_id} (with items)", False, "No cart_id available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/cart/{self.cart_id}")
            if response.status_code == 200:
                data = response.json()
                items = data.get('items', [])
                total_amount = data.get('total_amount', 0)
                
                if len(items) >= 3:  # Should have crystal_kayak, canoe, and luxury_cabana_3hr
                    # Verify calculations
                    expected_total = (60.0 * 2) + (75.0 * 1) + (100.0 * 1)  # crystal_kayak + canoe + cabana
                    if abs(total_amount - expected_total) < 0.01:
                        self.log_test("GET /api/cart/{cart_id} (with items)", True, f"Cart has {len(items)} items, total: ${total_amount}")
                        return True
                    else:
                        self.log_test("GET /api/cart/{cart_id} (with items)", False, f"Total calculation error: expected ${expected_total}, got ${total_amount}")
                        return False
                else:
                    self.log_test("GET /api/cart/{cart_id} (with items)", False, f"Expected at least 3 items, got {len(items)}")
                    return False
            else:
                self.log_test("GET /api/cart/{cart_id} (with items)", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/cart/{cart_id} (with items)", False, f"Error: {str(e)}")
            return False
    
    def test_update_customer_info(self):
        """Test PUT /api/cart/{cart_id}/customer endpoint"""
        if not self.cart_id:
            self.log_test("PUT /api/cart/{cart_id}/customer", False, "No cart_id available")
            return False
            
        try:
            customer_data = {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@example.com",
                "phone": "+1-555-0123"
            }
            
            response = self.session.put(f"{API_BASE}/cart/{self.cart_id}/customer", json=customer_data)
            if response.status_code == 200:
                data = response.json()
                if 'updated' in data.get('message', '').lower():
                    self.log_test("PUT /api/cart/{cart_id}/customer", True, "Customer info updated")
                    return True
                else:
                    self.log_test("PUT /api/cart/{cart_id}/customer", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("PUT /api/cart/{cart_id}/customer", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("PUT /api/cart/{cart_id}/customer", False, f"Error: {str(e)}")
            return False
    
    def test_remove_item_from_cart(self):
        """Test DELETE /api/cart/{cart_id}/item/{item_index} endpoint"""
        if not self.cart_id:
            self.log_test("DELETE /api/cart/{cart_id}/item/{item_index}", False, "No cart_id available")
            return False
            
        try:
            # Remove the second item (index 1)
            response = self.session.delete(f"{API_BASE}/cart/{self.cart_id}/item/1")
            if response.status_code == 200:
                data = response.json()
                if 'removed' in data.get('message', '').lower():
                    self.log_test("DELETE /api/cart/{cart_id}/item/{item_index}", True, "Item removed successfully")
                    return True
                else:
                    self.log_test("DELETE /api/cart/{cart_id}/item/{item_index}", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("DELETE /api/cart/{cart_id}/item/{item_index}", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("DELETE /api/cart/{cart_id}/item/{item_index}", False, f"Error: {str(e)}")
            return False
    
    def test_stripe_checkout(self):
        """Test POST /api/cart/{cart_id}/checkout with Stripe"""
        if not self.cart_id:
            self.log_test("POST /api/cart/{cart_id}/checkout (Stripe)", False, "No cart_id available")
            return False
            
        try:
            checkout_data = {
                "customer_info": {
                    "name": "Sarah Johnson",
                    "email": "sarah.johnson@example.com",
                    "phone": "+1-555-0123"
                },
                "payment_method": "stripe",
                "success_url": f"{BACKEND_URL}/booking-success",
                "cancel_url": f"{BACKEND_URL}/cart/{self.cart_id}"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{self.cart_id}/checkout", json=checkout_data)
            if response.status_code == 200:
                data = response.json()
                booking_id = data.get('booking_id')
                checkout_url = data.get('checkout_url')
                session_id = data.get('session_id')
                
                if booking_id and checkout_url and session_id:
                    self.booking_id = booking_id
                    self.log_test("POST /api/cart/{cart_id}/checkout (Stripe)", True, f"Booking ID: {booking_id}")
                    return True
                else:
                    self.log_test("POST /api/cart/{cart_id}/checkout (Stripe)", False, f"Missing required fields in response: {data}")
                    return False
            else:
                self.log_test("POST /api/cart/{cart_id}/checkout (Stripe)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("POST /api/cart/{cart_id}/checkout (Stripe)", False, f"Error: {str(e)}")
            return False
    
    def test_paypal_checkout(self):
        """Test POST /api/cart/{cart_id}/checkout with PayPal"""
        # Create a new cart for PayPal test
        try:
            response = self.session.post(f"{API_BASE}/cart/create")
            if response.status_code != 200:
                self.log_test("POST /api/cart/{cart_id}/checkout (PayPal)", False, "Failed to create test cart")
                return False
                
            paypal_cart_id = response.json().get('cart_id')
            
            # Add an item
            item_data = {
                "service_id": "paddle_board",
                "quantity": 1,
                "booking_date": "2024-12-26",
                "booking_time": "10:00:00"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{paypal_cart_id}/add", json=item_data)
            if response.status_code != 200:
                self.log_test("POST /api/cart/{cart_id}/checkout (PayPal)", False, "Failed to add item to test cart")
                return False
            
            # Test PayPal checkout
            checkout_data = {
                "customer_info": {
                    "name": "Mike Wilson",
                    "email": "mike.wilson@example.com",
                    "phone": "+1-555-0456"
                },
                "payment_method": "paypal",
                "success_url": f"{BACKEND_URL}/booking-success",
                "cancel_url": f"{BACKEND_URL}/cart/{paypal_cart_id}"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{paypal_cart_id}/checkout", json=checkout_data)
            if response.status_code == 200:
                data = response.json()
                booking_id = data.get('booking_id')
                checkout_url = data.get('checkout_url')
                payment_id = data.get('payment_id')
                
                if booking_id and checkout_url and payment_id:
                    self.log_test("POST /api/cart/{cart_id}/checkout (PayPal)", True, f"PayPal Booking ID: {booking_id}")
                    return True
                else:
                    self.log_test("POST /api/cart/{cart_id}/checkout (PayPal)", False, f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("POST /api/cart/{cart_id}/checkout (PayPal)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("POST /api/cart/{cart_id}/checkout (PayPal)", False, f"Error: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test various error conditions"""
        success_count = 0
        total_tests = 4
        
        # Test invalid cart ID
        try:
            response = self.session.get(f"{API_BASE}/cart/invalid-cart-id")
            if response.status_code == 404:
                self.log_test("Error Handling - Invalid Cart ID", True, "Correctly returned 404")
                success_count += 1
            else:
                self.log_test("Error Handling - Invalid Cart ID", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling - Invalid Cart ID", False, f"Error: {str(e)}")
        
        # Test invalid service ID
        if self.cart_id:
            try:
                item_data = {
                    "service_id": "invalid_service",
                    "quantity": 1,
                    "booking_date": "2024-12-25",
                    "booking_time": "14:00:00"
                }
                response = self.session.post(f"{API_BASE}/cart/{self.cart_id}/add", json=item_data)
                if response.status_code == 400:
                    self.log_test("Error Handling - Invalid Service ID", True, "Correctly returned 400")
                    success_count += 1
                else:
                    self.log_test("Error Handling - Invalid Service ID", False, f"Expected 400, got {response.status_code}")
            except Exception as e:
                self.log_test("Error Handling - Invalid Service ID", False, f"Error: {str(e)}")
        
        # Test invalid item index
        if self.cart_id:
            try:
                response = self.session.delete(f"{API_BASE}/cart/{self.cart_id}/item/999")
                if response.status_code == 400:
                    self.log_test("Error Handling - Invalid Item Index", True, "Correctly returned 400")
                    success_count += 1
                else:
                    self.log_test("Error Handling - Invalid Item Index", False, f"Expected 400, got {response.status_code}")
            except Exception as e:
                self.log_test("Error Handling - Invalid Item Index", False, f"Error: {str(e)}")
        
        # Test empty cart checkout
        try:
            response = self.session.post(f"{API_BASE}/cart/create")
            if response.status_code == 200:
                empty_cart_id = response.json().get('cart_id')
                checkout_data = {
                    "customer_info": {
                        "name": "Test User",
                        "email": "test@example.com"
                    },
                    "payment_method": "stripe"
                }
                response = self.session.post(f"{API_BASE}/cart/{empty_cart_id}/checkout", json=checkout_data)
                if response.status_code == 400:
                    self.log_test("Error Handling - Empty Cart Checkout", True, "Correctly returned 400")
                    success_count += 1
                else:
                    self.log_test("Error Handling - Empty Cart Checkout", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling - Empty Cart Checkout", False, f"Error: {str(e)}")
        
        return success_count == total_tests
    
    def test_booking_retrieval(self):
        """Test booking retrieval endpoints"""
        if not self.booking_id:
            self.log_test("Booking Retrieval", False, "No booking_id available")
            return False
            
        try:
            # Test get specific booking
            response = self.session.get(f"{API_BASE}/bookings/{self.booking_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get('id') == self.booking_id:
                    self.log_test("GET /api/bookings/{booking_id}", True, f"Retrieved booking: {self.booking_id}")
                    
                    # Test get all bookings
                    response = self.session.get(f"{API_BASE}/bookings")
                    if response.status_code == 200:
                        bookings = response.json()
                        if isinstance(bookings, list) and len(bookings) > 0:
                            self.log_test("GET /api/bookings", True, f"Retrieved {len(bookings)} bookings")
                            return True
                        else:
                            self.log_test("GET /api/bookings", False, "No bookings returned")
                            return False
                    else:
                        self.log_test("GET /api/bookings", False, f"Status: {response.status_code}")
                        return False
                else:
                    self.log_test("GET /api/bookings/{booking_id}", False, "Booking ID mismatch")
                    return False
            else:
                self.log_test("GET /api/bookings/{booking_id}", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Booking Retrieval", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🧪 Starting Enhanced Booking System Backend Tests")
        print("=" * 60)
        
        # Core API tests
        if not self.test_api_health():
            print("❌ API is not accessible, stopping tests")
            return False
            
        self.test_get_services()
        
        # Cart functionality tests
        if self.test_create_cart():
            self.test_get_empty_cart()
            if self.test_add_item_to_cart():
                self.test_add_multiple_items()
                self.test_get_cart_with_items()
                self.test_update_customer_info()
                self.test_remove_item_from_cart()
                
                # Payment integration tests
                if self.test_stripe_checkout():
                    self.test_booking_retrieval()
                
                self.test_paypal_checkout()
        
        # Error handling tests
        self.test_error_handling()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)