#!/usr/bin/env python3
"""
Waiver System Testing - Test the requirements from the review request
"""

import requests
import json

# Test the specific requirements from the review request
BACKEND_URL = 'https://gulfbook.preview.emergentagent.com'
API_BASE = f'{BACKEND_URL}/api'

def test_waiver_requirements():
    print('🔍 TESTING WAIVER SYSTEM REQUIREMENTS')
    print('=' * 50)

    # 1. Test Services Endpoint - should return 6 services
    print('\n1. Testing GET /api/services (should return 6 services)')
    try:
        response = requests.get(f'{API_BASE}/services')
        if response.status_code == 200:
            data = response.json()
            services = data.get('services', {})
            print(f'   ✅ Status: {response.status_code}')
            print(f'   ✅ Services found: {len(services)}')
            for service_id, service in services.items():
                print(f'      - {service_id}: {service.get("name", "Unknown")} (${service.get("price", 0)})')
            
            if len(services) == 6:
                print('   ✅ PASS: Exactly 6 services returned as expected')
            else:
                print(f'   ❌ FAIL: Expected 6 services, got {len(services)}')
        else:
            print(f'   ❌ FAIL: Status {response.status_code}')
    except Exception as e:
        print(f'   ❌ ERROR: {str(e)}')

    # 2. Test Cart System
    print('\n2. Testing Cart System')
    try:
        # Create cart
        response = requests.post(f'{API_BASE}/cart/create')
        if response.status_code == 200:
            cart_data = response.json()
            cart_id = cart_data.get('cart_id')
            print(f'   ✅ Cart created: {cart_id}')
            
            # Add item to cart
            item_data = {
                'service_id': 'crystal_kayak',
                'quantity': 2,
                'booking_date': '2024-12-25',
                'booking_time': '14:00:00',
                'special_requests': 'Test for waiver integration'
            }
            
            response = requests.post(f'{API_BASE}/cart/{cart_id}/add', json=item_data)
            if response.status_code == 200:
                print('   ✅ Item added to cart successfully')
                
                # Get cart contents
                response = requests.get(f'{API_BASE}/cart/{cart_id}')
                if response.status_code == 200:
                    cart_contents = response.json()
                    items = cart_contents.get('items', [])
                    total = cart_contents.get('total_amount', 0)
                    print(f'   ✅ Cart retrieved: {len(items)} items, total: ${total}')
                    print('   ✅ PASS: Cart system working correctly')
                    return cart_id  # Return for potential waiver testing
                else:
                    print(f'   ❌ FAIL: Could not retrieve cart: {response.status_code}')
            else:
                print(f'   ❌ FAIL: Could not add item to cart: {response.status_code}')
        else:
            print(f'   ❌ FAIL: Could not create cart: {response.status_code}')
    except Exception as e:
        print(f'   ❌ ERROR: {str(e)}')

    # 3. Test Waiver Endpoints (these should not exist yet)
    print('\n3. Testing Waiver Endpoints (Expected to NOT exist)')
    waiver_endpoints = [
        ('POST', '/waiver/submit', 'Submit electronic waiver'),
        ('GET', '/waiver/test-id', 'Get specific waiver by ID'),
        ('GET', '/waivers', 'Get all waivers for admin view')
    ]

    for method, endpoint, description in waiver_endpoints:
        try:
            if method == 'POST':
                # Mock waiver data structure as mentioned in review request
                mock_waiver_data = {
                    "cart_id": "test-cart-id",
                    "waiver_data": {
                        "emergency_contact": {
                            "name": "John Doe",
                            "phone": "+1-555-0123",
                            "relationship": "Spouse"
                        },
                        "medical_conditions": "None"
                    },
                    "guests": [
                        {
                            "name": "Sarah Johnson",
                            "date_of_birth": "1990-05-15",
                            "is_minor": False,
                            "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                        }
                    ],
                    "signed_at": "2024-12-20T10:30:00Z",
                    "total_guests": 1
                }
                response = requests.post(f'{API_BASE}{endpoint}', json=mock_waiver_data)
            else:
                response = requests.get(f'{API_BASE}{endpoint}')
            
            print(f'   {method} {endpoint}: Status {response.status_code}')
            if response.status_code == 404:
                print(f'      ✅ EXPECTED: Endpoint not implemented yet')
            elif response.status_code in [200, 201]:
                print(f'      ✅ IMPLEMENTED: {description}')
                if method == 'GET' and endpoint == '/waivers':
                    # If waivers endpoint exists, check response
                    try:
                        waivers = response.json()
                        print(f'      📋 Waivers found: {len(waivers) if isinstance(waivers, list) else "Unknown format"}')
                    except:
                        print(f'      ⚠️  Could not parse waiver response')
            else:
                print(f'      ⚠️  UNEXPECTED: Status {response.status_code}')
        except Exception as e:
            print(f'   ❌ ERROR testing {endpoint}: {str(e)}')

    print('\n' + '=' * 50)
    print('WAIVER SYSTEM TESTING COMPLETE')

if __name__ == "__main__":
    test_waiver_requirements()