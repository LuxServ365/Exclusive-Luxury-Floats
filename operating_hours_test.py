#!/usr/bin/env python3
"""
Operating Hours Update Backend Testing
Tests specific endpoints mentioned in review request after frontend operating hours update
"""

import requests
import json
from datetime import datetime, date, time
import sys

# Backend URL from environment
BACKEND_URL = "https://gulfbook.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class OperatingHoursBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.cart_id = None
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
        
    def test_services_endpoint(self):
        """Test /api/services endpoint - should return all services correctly"""
        print("\n🔍 TESTING SERVICES ENDPOINT")
        print("=" * 50)
        
        try:
            response = self.session.get(f"{API_BASE}/services")
            if response.status_code == 200:
                data = response.json()
                services = data.get('services', {})
                
                # Check if all expected services are present
                expected_services = [
                    'crystal_kayak', 'canoe', 'paddle_board', 
                    'luxury_cabana_hourly', 'luxury_cabana_3hr', 'luxury_cabana_4hr'
                ]
                
                missing_services = [s for s in expected_services if s not in services]
                
                if not missing_services:
                    # Verify service details are complete
                    service_details_complete = True
                    for service_id, service_data in services.items():
                        required_fields = ['id', 'name', 'price', 'duration', 'description']
                        if not all(field in service_data for field in required_fields):
                            service_details_complete = False
                            break
                    
                    if service_details_complete:
                        self.log_test("Services Endpoint - Complete Data", True, 
                                    f"All {len(services)} services returned with complete data")
                        return True
                    else:
                        self.log_test("Services Endpoint - Complete Data", False, 
                                    "Some services missing required fields")
                        return False
                else:
                    self.log_test("Services Endpoint - All Services", False, 
                                f"Missing services: {missing_services}")
                    return False
            else:
                self.log_test("Services Endpoint - HTTP Status", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Services Endpoint - Connection", False, f"Error: {str(e)}")
            return False
    
    def test_cart_functionality(self):
        """Test cart functionality - create cart, add items, check totals"""
        print("\n🛒 TESTING CART FUNCTIONALITY")
        print("=" * 50)
        
        # Test 1: Create cart
        try:
            response = self.session.post(f"{API_BASE}/cart/create")
            if response.status_code == 200:
                data = response.json()
                self.cart_id = data.get('cart_id')
                if self.cart_id:
                    self.log_test("Cart Creation", True, f"Cart ID: {self.cart_id}")
                else:
                    self.log_test("Cart Creation", False, "No cart_id in response")
                    return False
            else:
                self.log_test("Cart Creation", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Cart Creation", False, f"Error: {str(e)}")
            return False
        
        # Test 2: Add items to cart (testing with operating hours time slots)
        try:
            # Add item with 9 AM time slot (start of operating hours)
            item_data_1 = {
                "service_id": "crystal_kayak",
                "quantity": 2,
                "booking_date": "2024-12-25",
                "booking_time": "09:00:00",  # 9 AM - start of operating hours
                "special_requests": "Early morning adventure"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{self.cart_id}/add", json=item_data_1)
            if response.status_code == 200:
                self.log_test("Add Item - 9 AM Slot", True, "Crystal Kayak added for 9 AM")
            else:
                self.log_test("Add Item - 9 AM Slot", False, f"Status: {response.status_code}")
                return False
            
            # Add item with 11 PM time slot (end of operating hours)
            item_data_2 = {
                "service_id": "canoe",
                "quantity": 1,
                "booking_date": "2024-12-25",
                "booking_time": "23:00:00",  # 11 PM - end of operating hours
                "special_requests": "Late evening experience"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{self.cart_id}/add", json=item_data_2)
            if response.status_code == 200:
                self.log_test("Add Item - 11 PM Slot", True, "Canoe added for 11 PM")
            else:
                self.log_test("Add Item - 11 PM Slot", False, f"Status: {response.status_code}")
                return False
            
            # Add item with mid-day time slot
            item_data_3 = {
                "service_id": "luxury_cabana_3hr",
                "quantity": 1,
                "booking_date": "2024-12-25",
                "booking_time": "15:00:00",  # 3 PM - mid operating hours
                "special_requests": "Afternoon relaxation"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{self.cart_id}/add", json=item_data_3)
            if response.status_code == 200:
                self.log_test("Add Item - 3 PM Slot", True, "Luxury Cabana added for 3 PM")
            else:
                self.log_test("Add Item - 3 PM Slot", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Add Items to Cart", False, f"Error: {str(e)}")
            return False
        
        # Test 3: Check cart totals
        try:
            response = self.session.get(f"{API_BASE}/cart/{self.cart_id}")
            if response.status_code == 200:
                data = response.json()
                items = data.get('items', [])
                total_amount = data.get('total_amount', 0)
                
                # Expected total: Crystal Kayak (2x$60) + Canoe (1x$75) + Luxury Cabana 3hr (1x$100) = $295
                expected_total = (60.0 * 2) + (75.0 * 1) + (100.0 * 1)
                
                if len(items) == 3 and abs(total_amount - expected_total) < 0.01:
                    self.log_test("Cart Totals Calculation", True, 
                                f"Correct total: ${total_amount} for {len(items)} items")
                    
                    # Verify time slots are preserved
                    time_slots_correct = True
                    expected_times = ["09:00:00", "23:00:00", "15:00:00"]
                    actual_times = [item.get('booking_time') for item in items]
                    
                    for expected_time in expected_times:
                        if expected_time not in actual_times:
                            time_slots_correct = False
                            break
                    
                    if time_slots_correct:
                        self.log_test("Time Slots Preservation", True, 
                                    "All operating hours time slots preserved correctly")
                        return True
                    else:
                        self.log_test("Time Slots Preservation", False, 
                                    f"Time slots mismatch. Expected: {expected_times}, Got: {actual_times}")
                        return False
                else:
                    self.log_test("Cart Totals Calculation", False, 
                                f"Expected ${expected_total} for 3 items, got ${total_amount} for {len(items)} items")
                    return False
            else:
                self.log_test("Get Cart Contents", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Check Cart Totals", False, f"Error: {str(e)}")
            return False
    
    def test_booking_system_integration(self):
        """Test booking system integration - verify time slots work with backend"""
        print("\n📅 TESTING BOOKING SYSTEM INTEGRATION")
        print("=" * 50)
        
        if not self.cart_id:
            self.log_test("Booking Integration", False, "No cart available for testing")
            return False
        
        try:
            # Update customer information
            customer_data = {
                "name": "Operating Hours Test Customer",
                "email": "hours.test@gulfbook.com",
                "phone": "+1-850-555-HOUR"
            }
            
            response = self.session.put(f"{API_BASE}/cart/{self.cart_id}/customer", json=customer_data)
            if response.status_code == 200:
                self.log_test("Customer Info Update", True, "Customer information updated")
            else:
                self.log_test("Customer Info Update", False, f"Status: {response.status_code}")
                return False
            
            # Test booking creation with operating hours time slots
            expected_total = (60.0 * 2) + (75.0 * 1) + (100.0 * 1)  # $295
            
            checkout_data = {
                "customer_info": customer_data,
                "payment_method": "stripe",
                "final_total": expected_total,
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
                    self.log_test("Booking Creation", True, f"Booking ID: {booking_id}")
                    
                    # Verify booking contains correct time slots
                    booking_response = self.session.get(f"{API_BASE}/bookings/{booking_id}")
                    if booking_response.status_code == 200:
                        booking_data = booking_response.json()
                        items = booking_data.get('items', [])
                        
                        # Check that all operating hours time slots are preserved in booking
                        time_slots_in_booking = [item.get('booking_time') for item in items]
                        expected_time_slots = ["09:00:00", "23:00:00", "15:00:00"]
                        
                        all_slots_present = all(slot in time_slots_in_booking for slot in expected_time_slots)
                        
                        if all_slots_present:
                            self.log_test("Booking Time Slots Integration", True, 
                                        f"All operating hours slots preserved: {time_slots_in_booking}")
                            
                            # Test that booking total matches cart total
                            booking_total = booking_data.get('total_amount', 0)
                            if abs(booking_total - expected_total) < 0.01:
                                self.log_test("Booking Total Integration", True, 
                                            f"Booking total matches cart: ${booking_total}")
                                return True
                            else:
                                self.log_test("Booking Total Integration", False, 
                                            f"Total mismatch: expected ${expected_total}, got ${booking_total}")
                                return False
                        else:
                            self.log_test("Booking Time Slots Integration", False, 
                                        f"Missing time slots in booking: expected {expected_time_slots}, got {time_slots_in_booking}")
                            return False
                    else:
                        self.log_test("Booking Retrieval", False, 
                                    f"Failed to retrieve booking: {booking_response.status_code}")
                        return False
                else:
                    self.log_test("Booking Creation", False, 
                                f"Missing required fields: booking_id={bool(booking_id)}, checkout_url={bool(checkout_url)}, session_id={bool(session_id)}")
                    return False
            else:
                self.log_test("Booking Checkout", False, 
                            f"Checkout failed: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Booking System Integration", False, f"Error: {str(e)}")
            return False
    
    def test_operating_hours_edge_cases(self):
        """Test edge cases related to operating hours"""
        print("\n⏰ TESTING OPERATING HOURS EDGE CASES")
        print("=" * 50)
        
        try:
            # Create a new cart for edge case testing
            response = self.session.post(f"{API_BASE}/cart/create")
            if response.status_code != 200:
                self.log_test("Edge Case Cart Creation", False, "Failed to create test cart")
                return False
            
            edge_cart_id = response.json().get('cart_id')
            
            # Test with exact start time (9:00 AM)
            item_data_start = {
                "service_id": "paddle_board",
                "quantity": 1,
                "booking_date": "2024-12-26",
                "booking_time": "09:00:00",  # Exact start of operating hours
                "special_requests": "Exact start time test"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{edge_cart_id}/add", json=item_data_start)
            if response.status_code == 200:
                self.log_test("Edge Case - Exact Start Time (9 AM)", True, "9:00 AM slot accepted")
            else:
                self.log_test("Edge Case - Exact Start Time (9 AM)", False, f"Status: {response.status_code}")
                return False
            
            # Test with exact end time (11:00 PM)
            item_data_end = {
                "service_id": "crystal_kayak",
                "quantity": 1,
                "booking_date": "2024-12-26",
                "booking_time": "23:00:00",  # Exact end of operating hours
                "special_requests": "Exact end time test"
            }
            
            response = self.session.post(f"{API_BASE}/cart/{edge_cart_id}/add", json=item_data_end)
            if response.status_code == 200:
                self.log_test("Edge Case - Exact End Time (11 PM)", True, "11:00 PM slot accepted")
            else:
                self.log_test("Edge Case - Exact End Time (11 PM)", False, f"Status: {response.status_code}")
                return False
            
            # Test with hourly intervals within operating hours
            hourly_slots = ["10:00:00", "14:00:00", "18:00:00", "22:00:00"]
            hourly_success = True
            
            for slot in hourly_slots:
                item_data_hourly = {
                    "service_id": "canoe",
                    "quantity": 1,
                    "booking_date": "2024-12-27",
                    "booking_time": slot,
                    "special_requests": f"Hourly slot test - {slot}"
                }
                
                response = self.session.post(f"{API_BASE}/cart/{edge_cart_id}/add", json=item_data_hourly)
                if response.status_code != 200:
                    hourly_success = False
                    break
            
            if hourly_success:
                self.log_test("Edge Case - Hourly Intervals", True, 
                            f"All hourly slots accepted: {hourly_slots}")
                return True
            else:
                self.log_test("Edge Case - Hourly Intervals", False, 
                            f"Some hourly slots failed: {hourly_slots}")
                return False
                
        except Exception as e:
            self.log_test("Operating Hours Edge Cases", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all operating hours related backend tests"""
        print("🔍 OPERATING HOURS BACKEND TESTING")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print("Testing backend APIs after frontend operating hours update")
        print("=" * 60)
        
        tests = [
            ("Services Endpoint", self.test_services_endpoint),
            ("Cart Functionality", self.test_cart_functionality),
            ("Booking System Integration", self.test_booking_system_integration),
            ("Operating Hours Edge Cases", self.test_operating_hours_edge_cases)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            print(f"\n📋 Running: {test_name}")
            print("-" * 50)
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name}")
                print(f"   Details: Unexpected error: {str(e)}")
                failed += 1
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 OPERATING HOURS BACKEND TESTING COMPLETE")
        print("=" * 60)
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📊 SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%")
        
        if failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = OperatingHoursBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)