#!/usr/bin/env python3
"""
Waiver System Testing Script
Tests the complete waiver system integration as requested
"""

import requests
import json
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://gulfbook.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_waiver_system():
    """Test complete waiver system integration"""
    print("📋 TESTING COMPLETE WAIVER SYSTEM INTEGRATION")
    print("=" * 60)
    
    session = requests.Session()
    
    try:
        # Step 1: Create a test cart with multiple services
        print("Step 1: Creating test cart...")
        response = session.post(f"{API_BASE}/cart/create")
        if response.status_code != 200:
            print(f"❌ Failed to create cart: {response.status_code}")
            return False
            
        cart_id = response.json().get('cart_id')
        print(f"✅ Cart created: {cart_id}")
        
        # Add multiple services to simulate real booking
        services_to_add = [
            {
                "service_id": "crystal_kayak",
                "quantity": 2,
                "booking_date": "2024-10-01",
                "booking_time": "14:00:00",
                "special_requests": "LED lighting for evening adventure"
            },
            {
                "service_id": "canoe",
                "quantity": 1,
                "booking_date": "2024-10-01",
                "booking_time": "15:00:00",
                "special_requests": "Family friendly setup"
            }
        ]
        
        print("Step 2: Adding services to cart...")
        for service in services_to_add:
            response = session.post(f"{API_BASE}/cart/{cart_id}/add", json=service)
            if response.status_code != 200:
                print(f"❌ Failed to add {service['service_id']}: {response.status_code}")
                return False
        
        print("✅ Services added successfully")
        
        # Step 3: Submit comprehensive waiver with sample data
        print("Step 3: Submitting waiver...")
        waiver_data = {
            "cart_id": cart_id,
            "waiver_data": {
                "emergency_contact_name": "John Emergency",
                "emergency_contact_phone": "(555) 123-4567",
                "emergency_contact_relationship": "Father",
                "medical_conditions": "Allergic to shellfish",
                "additional_notes": "Please call if late"
            },
            "guests": [
                {
                    "id": 1,
                    "name": "Adult Guest",
                    "date": "2024-10-01",
                    "isMinor": False,
                    "participantSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                },
                {
                    "id": 2,
                    "name": "Minor Guest",
                    "date": "2024-10-01",
                    "isMinor": True,
                    "guardianName": "Parent Guardian",
                    "participantSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                    "guardianSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                }
            ],
            "signed_at": "2024-10-01T18:00:00Z",
            "total_guests": 2
        }
        
        # Test waiver submission
        response = session.post(f"{API_BASE}/waiver/submit", json=waiver_data)
        if response.status_code == 200:
            data = response.json()
            waiver_id = data.get('waiver_id')
            mongo_id = data.get('mongo_id')
            
            if waiver_id and mongo_id:
                print(f"✅ Waiver submitted successfully: {waiver_id}")
                
                # Step 4: Test waiver retrieval by ID
                print("Step 4: Testing waiver retrieval by ID...")
                response = session.get(f"{API_BASE}/waiver/{waiver_id}")
                if response.status_code == 200:
                    retrieved_waiver = response.json()
                    
                    # Verify waiver data structure
                    if (retrieved_waiver.get('id') == waiver_id and
                        retrieved_waiver.get('cart_id') == cart_id and
                        retrieved_waiver.get('total_guests') == 2 and
                        len(retrieved_waiver.get('guests', [])) == 2):
                        
                        print("✅ Waiver retrieved successfully")
                        
                        # Step 5: Test listing all waivers
                        print("Step 5: Testing waiver listing...")
                        response = session.get(f"{API_BASE}/waivers")
                        if response.status_code == 200:
                            all_waivers = response.json()
                            
                            if isinstance(all_waivers, list) and len(all_waivers) > 0:
                                # Find our waiver in the list
                                our_waiver = next((w for w in all_waivers if w.get('id') == waiver_id), None)
                                
                                if our_waiver:
                                    print(f"✅ Found {len(all_waivers)} waivers, including ours")
                                    
                                    # Step 6: Verify data structure
                                    print("Step 6: Verifying data structure...")
                                    required_fields = ['id', 'cart_id', 'waiver_data', 'guests', 'signed_at', 'total_guests']
                                    missing_fields = [field for field in required_fields if field not in retrieved_waiver]
                                    
                                    if not missing_fields:
                                        print("✅ All required fields present for Google Sheets integration")
                                        
                                        # Step 7: Test edge cases
                                        print("Step 7: Testing edge cases...")
                                        
                                        # Test invalid waiver ID
                                        response = session.get(f"{API_BASE}/waiver/invalid-waiver-id")
                                        if response.status_code == 404:
                                            print("✅ Invalid waiver ID correctly returns 404")
                                            
                                            print("\n🎉 WAIVER SYSTEM INTEGRATION TEST COMPLETE!")
                                            print("✅ All waiver endpoints working correctly")
                                            print("✅ Data structure valid for Google Sheets integration")
                                            print("✅ Edge cases handled properly")
                                            return True
                                        else:
                                            print(f"❌ Invalid waiver ID test failed: {response.status_code}")
                                            return False
                                    else:
                                        print(f"❌ Missing required fields: {missing_fields}")
                                        return False
                                else:
                                    print("❌ Our waiver not found in list")
                                    return False
                            else:
                                print("❌ No waivers returned or invalid format")
                                return False
                        else:
                            print(f"❌ Failed to list waivers: {response.status_code}")
                            return False
                    else:
                        print("❌ Waiver data structure invalid")
                        return False
                else:
                    print(f"❌ Failed to retrieve waiver: {response.status_code}")
                    return False
            else:
                print("❌ Missing waiver_id or mongo_id in response")
                return False
        else:
            print(f"❌ Failed to submit waiver: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during waiver system test: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_waiver_system()
    if success:
        print("\n✅ WAIVER SYSTEM TEST PASSED")
    else:
        print("\n❌ WAIVER SYSTEM TEST FAILED")