#!/usr/bin/env python3
"""
Quick test of enhanced fee calculations
"""

import requests
import json

# Test the enhanced fee calculation with a simple example
API_BASE = 'https://gulfbook.preview.emergentagent.com/api'

# Create cart
response = requests.post(f'{API_BASE}/cart/create')
cart_id = response.json()['cart_id']
print(f'Created cart: {cart_id}')

# Add kayak
item_data = {
    'service_id': 'crystal_kayak',
    'quantity': 1,
    'booking_date': '2025-01-20',
    'booking_time': '14:00:00'
}
response = requests.post(f'{API_BASE}/cart/{cart_id}/add', json=item_data)
print(f'Added kayak: {response.status_code}')

# Test enhanced checkout with fees
customer_data = {
    'name': 'Test User',
    'email': 'test@example.com',
    'phone': '+1-850-555-1234'
}

checkout_data = {
    'customer_info': customer_data,
    'payment_method': 'stripe',
    'trip_protection': True,
    'additional_fees': {
        'trip_protection_fee': 5.99,
        'tax_rate': 0.07,
        'credit_card_fee_rate': 0.03
    },
    'final_total': 72.73
}

response = requests.post(f'{API_BASE}/cart/{cart_id}/checkout', json=checkout_data)
print(f'Checkout response: {response.status_code}')

if response.status_code == 200:
    booking_id = response.json()['booking_id']
    print(f'Booking created: {booking_id}')
    
    # Get booking details to verify fee calculations
    booking_response = requests.get(f'{API_BASE}/bookings/{booking_id}')
    if booking_response.status_code == 200:
        booking = booking_response.json()
        print(f'Services subtotal: ${booking.get("total_amount", 0)}')
        print(f'Trip protection: ${booking.get("trip_protection_fee", 0)}')
        print(f'Tax amount: ${booking.get("tax_amount", 0):.2f}')
        print(f'Credit card fee: ${booking.get("credit_card_fee", 0):.2f}')
        print(f'Final total: ${booking.get("final_total", 0):.2f}')
        
        # Verify calculation
        expected_services = 60.0
        expected_protection = 5.99
        expected_taxable = expected_services + expected_protection
        expected_tax = expected_taxable * 0.07
        expected_subtotal_with_tax = expected_taxable + expected_tax
        expected_cc_fee = expected_subtotal_with_tax * 0.03
        expected_final = expected_subtotal_with_tax + expected_cc_fee
        
        print(f'Expected final total: ${expected_final:.2f}')
        print(f'Calculation correct: {abs(booking.get("final_total", 0) - expected_final) < 0.01}')
    else:
        print(f'Failed to get booking: {booking_response.status_code}')
else:
    print(f'Checkout failed: {response.text}')