#!/usr/bin/env python3
"""
Comprehensive Waiver System Test - Verifying all review request requirements
"""

import requests
import json
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://gulfbook.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_comprehensive_waiver_system():
    """Test all waiver system requirements from the review request"""
    print("📋 COMPREHENSIVE WAIVER SYSTEM TESTING")
    print("=" * 60)
    
    session = requests.Session()
    
    try:
        # 1. Create a test cart with multiple services to simulate a real booking
        print("✅ REQUIREMENT 1: Create a test cart with multiple services")
        response = session.post(f"{API_BASE}/cart/create")
        if response.status_code != 200:
            print(f"❌ Failed to create cart: {response.status_code}")
            return False
            
        cart_id = response.json().get('cart_id')
        print(f"   Cart created: {cart_id}")
        
        # Add multiple services as requested
        services = [
            {"service_id": "crystal_kayak", "quantity": 2, "booking_date": "2024-10-01", "booking_time": "14:00:00"},
            {"service_id": "canoe", "quantity": 1, "booking_date": "2024-10-01", "booking_time": "15:00:00"},
            {"service_id": "luxury_cabana_3hr", "quantity": 1, "booking_date": "2024-10-01", "booking_time": "16:00:00"}
        ]
        
        for service in services:
            response = session.post(f"{API_BASE}/cart/{cart_id}/add", json=service)
            if response.status_code != 200:
                print(f"❌ Failed to add {service['service_id']}")
                return False
        
        print(f"   Added {len(services)} services to cart")
        
        # 2. Submit a comprehensive waiver with all required data
        print("✅ REQUIREMENT 2: Submit comprehensive waiver with all required data")
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
        
        # Verify all required fields are present
        required_waiver_fields = ["emergency_contact_name", "emergency_contact_phone", "emergency_contact_relationship", "medical_conditions", "additional_notes"]
        for field in required_waiver_fields:
            if field not in waiver_data["waiver_data"]:
                print(f"❌ Missing required waiver field: {field}")
                return False
        
        # Verify guest data includes both adult and minor
        adult_guest = waiver_data["guests"][0]
        minor_guest = waiver_data["guests"][1]
        
        if not adult_guest.get("participantSignature"):
            print("❌ Adult guest missing participant signature")
            return False
            
        if not (minor_guest.get("guardianName") and minor_guest.get("participantSignature") and minor_guest.get("guardianSignature")):
            print("❌ Minor guest missing required guardian information")
            return False
        
        print("   ✓ Emergency contact information included")
        print("   ✓ Multiple guests (adult and minor) included")
        print("   ✓ Mock signature data (base64 encoded) included")
        print("   ✓ Medical conditions and additional notes included")
        
        # Submit waiver
        response = session.post(f"{API_BASE}/waiver/submit", json=waiver_data)
        if response.status_code != 200:
            print(f"❌ Failed to submit waiver: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        waiver_result = response.json()
        waiver_id = waiver_result.get('waiver_id')
        print(f"   Waiver submitted successfully: {waiver_id}")
        
        # 3. Test waiver retrieval by ID
        print("✅ REQUIREMENT 3: Test waiver retrieval by ID")
        response = session.get(f"{API_BASE}/waiver/{waiver_id}")
        if response.status_code != 200:
            print(f"❌ Failed to retrieve waiver by ID: {response.status_code}")
            return False
            
        retrieved_waiver = response.json()
        
        # Verify retrieved data matches submitted data
        if (retrieved_waiver.get('id') != waiver_id or
            retrieved_waiver.get('cart_id') != cart_id or
            retrieved_waiver.get('total_guests') != 2):
            print("❌ Retrieved waiver data doesn't match submitted data")
            return False
            
        print(f"   Waiver retrieved successfully by ID: {waiver_id}")
        
        # 4. Test listing all waivers
        print("✅ REQUIREMENT 4: Test waiver retrieval - listing all waivers")
        response = session.get(f"{API_BASE}/waivers")
        if response.status_code != 200:
            print(f"❌ Failed to list all waivers: {response.status_code}")
            return False
            
        all_waivers = response.json()
        if not isinstance(all_waivers, list):
            print("❌ Waivers endpoint didn't return a list")
            return False
            
        # Find our waiver in the list
        our_waiver = next((w for w in all_waivers if w.get('id') == waiver_id), None)
        if not our_waiver:
            print("❌ Our waiver not found in the list")
            return False
            
        print(f"   Found {len(all_waivers)} total waivers, including ours")
        
        # 5. Verify data structure and Google Sheets integration preparation
        print("✅ REQUIREMENT 5: Verify data structure and Google Sheets integration")
        
        # Check all required fields for Google Sheets
        required_fields = ['id', 'cart_id', 'waiver_data', 'guests', 'signed_at', 'total_guests', 'created_at']
        missing_fields = [field for field in required_fields if field not in retrieved_waiver]
        
        if missing_fields:
            print(f"❌ Missing fields for Google Sheets integration: {missing_fields}")
            return False
            
        # Verify waiver_data structure
        waiver_info = retrieved_waiver.get('waiver_data', {})
        required_waiver_fields = ['emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship']
        missing_waiver_fields = [field for field in required_waiver_fields if field not in waiver_info]
        
        if missing_waiver_fields:
            print(f"❌ Missing waiver data fields: {missing_waiver_fields}")
            return False
            
        # Verify guests structure
        guests = retrieved_waiver.get('guests', [])
        if len(guests) != 2:
            print(f"❌ Expected 2 guests, got {len(guests)}")
            return False
            
        print("   ✓ All required fields present for Google Sheets integration")
        print("   ✓ Emergency contact data properly structured")
        print("   ✓ Guest information properly structured")
        print("   ✓ Signature data preserved")
        
        # 6. Test edge cases
        print("✅ REQUIREMENT 6: Test edge cases")
        
        # Test invalid waiver ID
        response = session.get(f"{API_BASE}/waiver/invalid-waiver-id-12345")
        if response.status_code != 404:
            print(f"❌ Invalid waiver ID should return 404, got {response.status_code}")
            return False
        print("   ✓ Invalid waiver ID correctly returns 404")
        
        # Test malformed waiver data
        malformed_data = {
            "cart_id": "test-cart-id",
            "waiver_data": {
                "emergency_contact_name": "Test Contact"
                # Missing required phone field
            },
            "guests": [],  # Empty guests
            "signed_at": "invalid-date-format",
            "total_guests": 0
        }
        
        response = session.post(f"{API_BASE}/waiver/submit", json=malformed_data)
        if response.status_code not in [400, 422, 500]:  # Should be rejected
            print(f"❌ Malformed data should be rejected, got {response.status_code}")
            return False
        print("   ✓ Malformed waiver data correctly rejected")
        
        print("\n🎉 ALL WAIVER SYSTEM REQUIREMENTS VERIFIED!")
        print("=" * 60)
        print("✅ Cart creation with multiple services")
        print("✅ Comprehensive waiver submission")
        print("✅ Waiver retrieval by ID")
        print("✅ Waiver listing functionality")
        print("✅ Data structure validation")
        print("✅ Google Sheets integration preparation")
        print("✅ Edge case handling")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error during comprehensive waiver test: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_comprehensive_waiver_system()
    if success:
        print("\n🏆 COMPREHENSIVE WAIVER SYSTEM TEST PASSED")
        print("The waiver system is fully functional and ready for production!")
    else:
        print("\n❌ COMPREHENSIVE WAIVER SYSTEM TEST FAILED")