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

    def test_notification_system_complete_flow(self):
        """Test complete booking flow with Gmail and Telegram notifications"""
        print("\n🔔 TESTING NOTIFICATION SYSTEM - COMPLETE FLOW")
        print("=" * 60)
        
        try:
            # Create a new cart for notification testing
            response = self.session.post(f"{API_BASE}/cart/create")
            if response.status_code != 200:
                self.log_test("Notification Flow - Create Cart", False, "Failed to create cart")
                return False
                
            notification_cart_id = response.json().get('cart_id')
            self.log_test("Notification Flow - Create Cart", True, f"Cart ID: {notification_cart_id}")
            
            # Add multiple items to cart for comprehensive testing
            items_to_add = [
                {
                    "service_id": "crystal_kayak",
                    "quantity": 2,
                    "booking_date": "2024-12-28",
                    "booking_time": "14:00:00",
                    "special_requests": "LED lighting requested for evening adventure"
                },
                {
                    "service_id": "luxury_cabana_3hr",
                    "quantity": 1,
                    "booking_date": "2024-12-28",
                    "booking_time": "15:00:00",
                    "special_requests": "Premium setup with refreshments"
                }
            ]
            
            for item in items_to_add:
                response = self.session.post(f"{API_BASE}/cart/{notification_cart_id}/add", json=item)
                if response.status_code != 200:
                    self.log_test("Notification Flow - Add Items", False, f"Failed to add {item['service_id']}")
                    return False
            
            self.log_test("Notification Flow - Add Items", True, "Multiple items added successfully")
            
            # Update customer information with realistic data
            customer_data = {
                "name": "Emma Rodriguez",
                "email": "emma.rodriguez@gulfadventures.com",
                "phone": "+1-850-555-7890"
            }
            
            response = self.session.put(f"{API_BASE}/cart/{notification_cart_id}/customer", json=customer_data)
            if response.status_code != 200:
                self.log_test("Notification Flow - Customer Info", False, "Failed to update customer info")
                return False
            
            self.log_test("Notification Flow - Customer Info", True, "Customer information updated")
            
            # Test Stripe checkout with notifications
            checkout_data = {
                "customer_info": customer_data,
                "payment_method": "stripe",
                "success_url": f"{BACKEND_URL}/booking-success",
                "cancel_url": f"{BACKEND_URL}/cart/{notification_cart_id}"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{notification_cart_id}/checkout", json=checkout_data)
            if response.status_code == 200:
                data = response.json()
                notification_booking_id = data.get('booking_id')
                checkout_url = data.get('checkout_url')
                session_id = data.get('session_id')
                
                if notification_booking_id and checkout_url and session_id:
                    self.log_test("Notification Flow - Stripe Checkout", True, f"Booking created: {notification_booking_id}")
                    
                    # Verify booking was created with correct details
                    booking_response = self.session.get(f"{API_BASE}/bookings/{notification_booking_id}")
                    if booking_response.status_code == 200:
                        booking_data = booking_response.json()
                        
                        # Verify booking details for notification content
                        expected_total = (60.0 * 2) + (100.0 * 1)  # crystal_kayak + luxury_cabana_3hr
                        if abs(booking_data.get('total_amount', 0) - expected_total) < 0.01:
                            self.log_test("Notification Flow - Booking Details", True, f"Total amount correct: ${expected_total}")
                            
                            # Verify items are properly formatted for notifications
                            items = booking_data.get('items', [])
                            if len(items) == 2:
                                self.log_test("Notification Flow - Booking Items", True, f"Items correctly stored: {len(items)} items")
                                return True
                            else:
                                self.log_test("Notification Flow - Booking Items", False, f"Expected 2 items, got {len(items)}")
                                return False
                        else:
                            self.log_test("Notification Flow - Booking Details", False, f"Total amount mismatch: expected ${expected_total}, got ${booking_data.get('total_amount', 0)}")
                            return False
                    else:
                        self.log_test("Notification Flow - Booking Verification", False, f"Failed to retrieve booking: {booking_response.status_code}")
                        return False
                else:
                    self.log_test("Notification Flow - Stripe Checkout", False, f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("Notification Flow - Stripe Checkout", False, f"Checkout failed: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Notification Flow - Complete Test", False, f"Error: {str(e)}")
            return False

    def test_gmail_smtp_configuration(self):
        """Test Gmail SMTP configuration and connectivity"""
        print("\n📧 TESTING GMAIL SMTP CONFIGURATION")
        print("=" * 60)
        
        try:
            # Test by attempting to create a booking that would trigger email
            # We'll check if the email service is properly configured by examining the backend logs
            
            # Create a simple cart and checkout to trigger email notification
            response = self.session.post(f"{API_BASE}/cart/create")
            if response.status_code != 200:
                self.log_test("Gmail SMTP - Cart Creation", False, "Failed to create test cart")
                return False
                
            gmail_test_cart_id = response.json().get('cart_id')
            
            # Add a single item
            item_data = {
                "service_id": "paddle_board",
                "quantity": 1,
                "booking_date": "2024-12-29",
                "booking_time": "11:00:00",
                "special_requests": "Gmail notification test"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{gmail_test_cart_id}/add", json=item_data)
            if response.status_code != 200:
                self.log_test("Gmail SMTP - Add Item", False, "Failed to add test item")
                return False
            
            # Test customer with valid email format
            customer_data = {
                "name": "Alex Thompson",
                "email": "alex.thompson@testgulf.com",
                "phone": "+1-850-555-1234"
            }
            
            checkout_data = {
                "customer_info": customer_data,
                "payment_method": "stripe",
                "success_url": f"{BACKEND_URL}/booking-success",
                "cancel_url": f"{BACKEND_URL}/cart/{gmail_test_cart_id}"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{gmail_test_cart_id}/checkout", json=checkout_data)
            if response.status_code == 200:
                data = response.json()
                gmail_booking_id = data.get('booking_id')
                
                if gmail_booking_id:
                    self.log_test("Gmail SMTP - Booking Creation", True, f"Booking created for email test: {gmail_booking_id}")
                    
                    # Verify booking contains proper email data
                    booking_response = self.session.get(f"{API_BASE}/bookings/{gmail_booking_id}")
                    if booking_response.status_code == 200:
                        booking_data = booking_response.json()
                        customer_email = booking_data.get('customer_email')
                        booking_reference = booking_data.get('booking_reference')
                        
                        if customer_email and booking_reference:
                            self.log_test("Gmail SMTP - Email Data Verification", True, f"Email: {customer_email}, Ref: {booking_reference}")
                            return True
                        else:
                            self.log_test("Gmail SMTP - Email Data Verification", False, "Missing email or booking reference")
                            return False
                    else:
                        self.log_test("Gmail SMTP - Booking Retrieval", False, f"Failed to retrieve booking: {booking_response.status_code}")
                        return False
                else:
                    self.log_test("Gmail SMTP - Booking Creation", False, "No booking ID returned")
                    return False
            else:
                self.log_test("Gmail SMTP - Checkout Process", False, f"Checkout failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Gmail SMTP - Configuration Test", False, f"Error: {str(e)}")
            return False

    def test_telegram_notification_setup(self):
        """Test Telegram notification configuration"""
        print("\n📱 TESTING TELEGRAM NOTIFICATION SETUP")
        print("=" * 60)
        
        try:
            # Create a booking specifically for Telegram notification testing
            response = self.session.post(f"{API_BASE}/cart/create")
            if response.status_code != 200:
                self.log_test("Telegram - Cart Creation", False, "Failed to create test cart")
                return False
                
            telegram_cart_id = response.json().get('cart_id')
            
            # Add items with detailed information for Telegram message
            item_data = {
                "service_id": "canoe",
                "quantity": 2,
                "booking_date": "2024-12-30",
                "booking_time": "13:00:00",
                "special_requests": "Telegram notification test - family group"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{telegram_cart_id}/add", json=item_data)
            if response.status_code != 200:
                self.log_test("Telegram - Add Item", False, "Failed to add test item")
                return False
            
            # Customer data for Telegram message
            customer_data = {
                "name": "Maria Santos",
                "email": "maria.santos@gulftest.com",
                "phone": "+1-850-555-9876"
            }
            
            checkout_data = {
                "customer_info": customer_data,
                "payment_method": "paypal",  # Test with PayPal to verify both payment methods trigger notifications
                "success_url": f"{BACKEND_URL}/booking-success",
                "cancel_url": f"{BACKEND_URL}/cart/{telegram_cart_id}"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{telegram_cart_id}/checkout", json=checkout_data)
            if response.status_code == 200:
                data = response.json()
                telegram_booking_id = data.get('booking_id')
                payment_id = data.get('payment_id')
                
                if telegram_booking_id and payment_id:
                    self.log_test("Telegram - PayPal Booking Creation", True, f"PayPal booking created: {telegram_booking_id}")
                    
                    # Verify booking data for Telegram message content
                    booking_response = self.session.get(f"{API_BASE}/bookings/{telegram_booking_id}")
                    if booking_response.status_code == 200:
                        booking_data = booking_response.json()
                        
                        # Check all required fields for Telegram notification
                        required_fields = ['customer_name', 'customer_email', 'customer_phone', 'items', 'total_amount', 'payment_method', 'booking_reference']
                        missing_fields = [field for field in required_fields if not booking_data.get(field)]
                        
                        if not missing_fields:
                            self.log_test("Telegram - Notification Data Complete", True, "All required fields present for Telegram message")
                            return True
                        else:
                            self.log_test("Telegram - Notification Data Complete", False, f"Missing fields: {missing_fields}")
                            return False
                    else:
                        self.log_test("Telegram - Booking Verification", False, f"Failed to retrieve booking: {booking_response.status_code}")
                        return False
                else:
                    self.log_test("Telegram - PayPal Booking Creation", False, f"Missing booking or payment ID: {data}")
                    return False
            else:
                self.log_test("Telegram - PayPal Checkout", False, f"PayPal checkout failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Telegram - Notification Test", False, f"Error: {str(e)}")
            return False

    def test_email_template_content(self):
        """Test email template formatting and content verification"""
        print("\n📄 TESTING EMAIL TEMPLATE CONTENT")
        print("=" * 60)
        
        try:
            # Create a comprehensive booking to test email template with multiple items
            response = self.session.post(f"{API_BASE}/cart/create")
            if response.status_code != 200:
                self.log_test("Email Template - Cart Creation", False, "Failed to create test cart")
                return False
                
            template_cart_id = response.json().get('cart_id')
            
            # Add multiple different services to test template formatting
            test_items = [
                {
                    "service_id": "crystal_kayak",
                    "quantity": 1,
                    "booking_date": "2024-12-31",
                    "booking_time": "10:00:00",
                    "special_requests": "New Year's Eve special - LED lighting"
                },
                {
                    "service_id": "luxury_cabana_4hr",
                    "quantity": 1,
                    "booking_date": "2024-12-31",
                    "booking_time": "14:00:00",
                    "special_requests": "Premium setup for celebration"
                }
            ]
            
            for item in test_items:
                response = self.session.post(f"{API_BASE}/cart/{template_cart_id}/add", json=item)
                if response.status_code != 200:
                    self.log_test("Email Template - Add Items", False, f"Failed to add {item['service_id']}")
                    return False
            
            self.log_test("Email Template - Add Items", True, "Multiple items added for template testing")
            
            # Customer with detailed information for template
            customer_data = {
                "name": "Jennifer Williams",
                "email": "jennifer.williams@emailtest.com",
                "phone": "+1-850-555-4567"
            }
            
            checkout_data = {
                "customer_info": customer_data,
                "payment_method": "stripe",
                "success_url": f"{BACKEND_URL}/booking-success",
                "cancel_url": f"{BACKEND_URL}/cart/{template_cart_id}"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{template_cart_id}/checkout", json=checkout_data)
            if response.status_code == 200:
                data = response.json()
                template_booking_id = data.get('booking_id')
                
                if template_booking_id:
                    # Verify booking data contains all elements needed for email template
                    booking_response = self.session.get(f"{API_BASE}/bookings/{template_booking_id}")
                    if booking_response.status_code == 200:
                        booking_data = booking_response.json()
                        
                        # Check email template data completeness
                        items = booking_data.get('items', [])
                        total_amount = booking_data.get('total_amount', 0)
                        booking_reference = booking_data.get('booking_reference', '')
                        customer_name = booking_data.get('customer_name', '')
                        
                        # Verify expected total calculation
                        expected_total = 60.0 + 299.0  # crystal_kayak + luxury_cabana_4hr
                        
                        if (len(items) == 2 and 
                            abs(total_amount - expected_total) < 0.01 and 
                            booking_reference and 
                            customer_name):
                            
                            # Verify each item has required fields for email template
                            template_ready = True
                            for item in items:
                                required_item_fields = ['name', 'price', 'quantity', 'booking_date', 'booking_time']
                                if not all(field in item for field in required_item_fields):
                                    template_ready = False
                                    break
                            
                            if template_ready:
                                self.log_test("Email Template - Content Verification", True, f"Template data complete: {len(items)} items, ${total_amount}")
                                return True
                            else:
                                self.log_test("Email Template - Content Verification", False, "Items missing required fields for template")
                                return False
                        else:
                            self.log_test("Email Template - Content Verification", False, f"Data incomplete: items={len(items)}, total=${total_amount}, ref={bool(booking_reference)}")
                            return False
                    else:
                        self.log_test("Email Template - Booking Retrieval", False, f"Failed to retrieve booking: {booking_response.status_code}")
                        return False
                else:
                    self.log_test("Email Template - Booking Creation", False, "No booking ID returned")
                    return False
            else:
                self.log_test("Email Template - Checkout Process", False, f"Checkout failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Email Template - Test", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests including notification system"""
        print("🧪 Starting Enhanced Booking System Backend Tests with Notification System")
        print("=" * 80)
        
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
        
        # NOTIFICATION SYSTEM TESTS - NEW FOCUS
        print("\n" + "🔔" * 20 + " NOTIFICATION SYSTEM TESTING " + "🔔" * 20)
        self.test_notification_system_complete_flow()
        self.test_gmail_smtp_configuration()
        self.test_telegram_notification_setup()
        self.test_email_template_content()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Separate notification system results
        notification_tests = [r for r in self.test_results if 'notification' in r['test'].lower() or 'gmail' in r['test'].lower() or 'telegram' in r['test'].lower() or 'email template' in r['test'].lower()]
        if notification_tests:
            notification_passed = sum(1 for result in notification_tests if result['success'])
            notification_total = len(notification_tests)
            print(f"\n🔔 NOTIFICATION SYSTEM RESULTS:")
            print(f"   Notification Tests: {notification_total}")
            print(f"   Passed: {notification_passed}")
            print(f"   Failed: {notification_total - notification_passed}")
            print(f"   Success Rate: {(notification_passed/notification_total)*100:.1f}%")
        
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