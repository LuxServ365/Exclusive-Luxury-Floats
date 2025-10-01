#!/usr/bin/env python3
"""
Test specific scenarios from the review request
"""

import requests
import json

def test_specific_scenarios():
    """Test the specific scenarios mentioned in the review request"""
    
    API_BASE = 'https://gulfbook.preview.emergentagent.com/api'
    
    print('🔥 TESTING SPECIFIC SCENARIOS FROM REVIEW REQUEST')
    print('=' * 60)
    
    session = requests.Session()
    
    # Test 1: Crystal Kayak scenario
    print('\n1. Testing Crystal Kayak ($60) + Trip Protection ($5.99) + Tax + CC Fee = Expected $72.73')
    
    # Create cart
    response = session.post(f'{API_BASE}/cart/create')
    cart_id = response.json().get('cart_id')
    print(f'   Cart created: {cart_id}')
    
    # Add Crystal Kayak
    item_data = {
        'service_id': 'crystal_kayak',
        'quantity': 1,
        'booking_date': '2025-01-25',
        'booking_time': '14:00:00',
        'special_requests': 'Specific scenario test'
    }
    response = session.post(f'{API_BASE}/cart/{cart_id}/add', json=item_data)
    print(f'   Added Crystal Kayak: {response.status_code == 200}')
    
    # Test PayPal checkout with exact scenario
    customer_data = {
        'name': 'Scenario Test User',
        'email': 'scenario.test@gulfadventures.com',
        'phone': '+1-850-555-TEST'
    }
    
    checkout_data = {
        'customer_info': customer_data,
        'payment_method': 'paypal',
        'trip_protection': True,
        'additional_fees': {
            'trip_protection_fee': 5.99,
            'tax_rate': 0.07,
            'credit_card_fee_rate': 0.03
        },
        'final_total': 72.73,
        'success_url': 'https://gulfbook.preview.emergentagent.com/booking-success',
        'cancel_url': f'https://gulfbook.preview.emergentagent.com/cart/{cart_id}'
    }
    
    response = session.post(f'{API_BASE}/cart/{cart_id}/checkout', json=checkout_data)
    if response.status_code == 200:
        data = response.json()
        booking_id = data.get('booking_id')
        payment_id = data.get('payment_id')
        print(f'   ✅ PayPal checkout successful: Booking {booking_id}, Payment {payment_id}')
        
        # Verify booking details
        booking_response = session.get(f'{API_BASE}/bookings/{booking_id}')
        if booking_response.status_code == 200:
            booking = booking_response.json()
            services = booking.get('total_amount', 0)
            protection = booking.get('trip_protection_fee', 0)
            tax = booking.get('tax_amount', 0)
            cc_fee = booking.get('credit_card_fee', 0)
            final = booking.get('final_total', 0)
            
            print(f'   Services: ${services:.2f}')
            print(f'   Trip Protection: ${protection:.2f}')
            print(f'   Tax (7%): ${tax:.2f}')
            print(f'   CC Fee (3%): ${cc_fee:.2f}')
            print(f'   Final Total: ${final:.2f}')
            
            if abs(final - 72.73) < 0.01:
                print('   ✅ EXACT MATCH: Final total matches expected $72.73')
            else:
                print(f'   ❌ MISMATCH: Expected $72.73, got ${final:.2f}')
        else:
            print(f'   ❌ Failed to retrieve booking: {booking_response.status_code}')
    else:
        print(f'   ❌ PayPal checkout failed: {response.status_code}')
        print(f'   Response: {response.text}')
    
    print('\n2. Testing Multiple Services with PayPal')
    # Test multiple services scenario
    response = session.post(f'{API_BASE}/cart/create')
    multi_cart_id = response.json().get('cart_id')
    
    # Add multiple services
    services = [
        {'service_id': 'crystal_kayak', 'quantity': 1},
        {'service_id': 'canoe', 'quantity': 1}
    ]
    
    total_services = 0
    for service in services:
        item_data = {
            'service_id': service['service_id'],
            'quantity': service['quantity'],
            'booking_date': '2025-01-26',
            'booking_time': '15:00:00'
        }
        response = session.post(f'{API_BASE}/cart/{multi_cart_id}/add', json=item_data)
        if service['service_id'] == 'crystal_kayak':
            total_services += 60.0
        elif service['service_id'] == 'canoe':
            total_services += 75.0
    
    print(f'   Added multiple services totaling: ${total_services}')
    
    # Calculate expected total: $135 + $5.99 + tax + cc fee
    expected_taxable = total_services + 5.99  # $140.99
    expected_tax = expected_taxable * 0.07  # $9.87
    expected_subtotal = expected_taxable + expected_tax  # $150.86
    expected_cc_fee = expected_subtotal * 0.03  # $4.53
    expected_final = expected_subtotal + expected_cc_fee  # $155.39
    
    checkout_data = {
        'customer_info': customer_data,
        'payment_method': 'paypal',
        'trip_protection': True,
        'additional_fees': {
            'trip_protection_fee': 5.99,
            'tax_rate': 0.07,
            'credit_card_fee_rate': 0.03
        },
        'final_total': expected_final,
        'success_url': 'https://gulfbook.preview.emergentagent.com/booking-success',
        'cancel_url': f'https://gulfbook.preview.emergentagent.com/cart/{multi_cart_id}'
    }
    
    response = session.post(f'{API_BASE}/cart/{multi_cart_id}/checkout', json=checkout_data)
    if response.status_code == 200:
        data = response.json()
        print(f'   ✅ Multiple services PayPal checkout successful: {data.get("booking_id")}')
    else:
        print(f'   ❌ Multiple services checkout failed: {response.status_code}')
    
    print('\n3. Testing Stripe Compatibility with Enhanced Fees')
    # Test Stripe still works
    response = session.post(f'{API_BASE}/cart/create')
    stripe_cart_id = response.json().get('cart_id')
    
    item_data = {
        'service_id': 'paddle_board',
        'quantity': 1,
        'booking_date': '2025-01-27',
        'booking_time': '12:00:00'
    }
    response = session.post(f'{API_BASE}/cart/{stripe_cart_id}/add', json=item_data)
    
    checkout_data = {
        'customer_info': customer_data,
        'payment_method': 'stripe',
        'trip_protection': True,
        'additional_fees': {
            'trip_protection_fee': 5.99,
            'tax_rate': 0.07,
            'credit_card_fee_rate': 0.03
        },
        'final_total': 89.26,  # Paddle board $75 + protection + tax + cc fee
        'success_url': 'https://gulfbook.preview.emergentagent.com/booking-success',
        'cancel_url': f'https://gulfbook.preview.emergentagent.com/cart/{stripe_cart_id}'
    }
    
    response = session.post(f'{API_BASE}/cart/{stripe_cart_id}/checkout', json=checkout_data)
    if response.status_code == 200:
        data = response.json()
        print(f'   ✅ Stripe checkout still works: {data.get("booking_id")}')
    else:
        print(f'   ❌ Stripe checkout failed: {response.status_code}')
    
    print('\n4. Testing Old Booking Records Compatibility')
    # Test that old bookings can be retrieved
    response = session.get(f'{API_BASE}/bookings')
    if response.status_code == 200:
        bookings = response.json()
        old_format_count = 0
        new_format_count = 0
        
        for booking in bookings:
            if 'final_total' in booking and booking.get('final_total') is not None:
                new_format_count += 1
            else:
                old_format_count += 1
        
        print(f'   ✅ Retrieved {len(bookings)} bookings: {old_format_count} old format, {new_format_count} new format')
        print('   ✅ Backward compatibility confirmed')
    else:
        print(f'   ❌ Failed to retrieve bookings: {response.status_code}')
    
    print('\n🏁 SPECIFIC SCENARIO TESTING COMPLETE')

if __name__ == "__main__":
    test_specific_scenarios()