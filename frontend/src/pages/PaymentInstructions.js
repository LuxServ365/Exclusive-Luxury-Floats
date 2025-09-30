import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Copy, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const PaymentInstructions = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getPaymentMethodInfo = (method) => {
    switch (method) {
      case 'venmo':
        return {
          name: 'Venmo',
          account: '@ExclusiveFloat850',
          color: 'bg-blue-500',
          icon: '📱'
        };
      case 'cashapp':
        return {
          name: 'Cash App',
          account: '$ExclusiveFloat',
          color: 'bg-green-500',
          icon: '💰'
        };
      case 'zelle':
        return {
          name: 'Zelle',
          account: 'exclusivefloat850@gmail.com',
          color: 'bg-purple-500',
          icon: '🏦'
        };
      default:
        return {
          name: method,
          account: '',
          color: 'bg-gray-500',
          icon: '💳'
        };
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <section className="section">
          <div className="container max-w-4xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-4">Loading payment instructions...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="main-content">
        <section className="section">
          <div className="container max-w-4xl">
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-red-600">Booking not found. Please check your booking reference.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  const paymentInfo = getPaymentMethodInfo(booking.payment_method);

  return (
    <div className="main-content">
      <section className="section">
        <div className="container max-w-4xl">
          <div className="section-header text-center">
            <h1 className="section-title">Complete Your Payment</h1>
            <p className="section-subtitle">
              Follow the instructions below to complete your Gulf Float booking
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Instructions */}
            <Card className="card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg text-white ${paymentInfo.color}`}>
                    <span className="text-lg">{paymentInfo.icon}</span>
                  </div>
                  Pay with {paymentInfo.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Step-by-Step Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Open your {paymentInfo.name} app</li>
                    <li>Send payment to: <strong>{paymentInfo.account}</strong></li>
                    <li>Amount: <strong>${booking.total_amount?.toFixed(2)}</strong></li>
                    <li>Include this note: <strong>{booking.booking_reference}</strong></li>
                    <li>Take a screenshot of the completed payment</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">Send to:</span>
                      <p className="font-semibold">{paymentInfo.account}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentInfo.account)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">Amount:</span>
                      <p className="font-semibold text-teal-600">${booking.total_amount?.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(booking.total_amount?.toFixed(2))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">Note/Reference:</span>
                      <p className="font-semibold">{booking.booking_reference}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(booking.booking_reference)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Important:</p>
                      <p className="text-sm text-blue-700">
                        Please include the booking reference "{booking.booking_reference}" 
                        in your payment note so we can quickly confirm your booking.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-green-800 mb-2">Booking Confirmed!</p>
                  <p className="text-sm text-green-700">
                    Your booking has been created. Complete payment to secure your reservation.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-600">Booking Reference</p>
                    <p className="font-semibold">{booking.booking_reference}</p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold">{booking.customer_name}</p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{booking.customer_email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Services Booked:</p>
                  {booking.items?.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-gray-600">
                        📅 {new Date(item.booking_date).toLocaleDateString()} 
                        ⏰ {item.booking_time}
                      </p>
                      <p className="text-gray-600">Qty: {item.quantity} × ${item.price}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-teal-600">
                      ${booking.total_amount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Card className="card">
              <CardContent className="py-6">
                <h3 className="text-lg font-semibold mb-2">After Payment</h3>
                <p className="text-gray-600 mb-4">
                  Once you've sent the payment, we'll receive a notification and confirm your booking within 1-2 hours during business hours.
                  You'll receive a confirmation email once payment is verified.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`mailto:exclusivefloat850@gmail.com?subject=Payment Sent - ${booking.booking_reference}`, '_blank')}
                  >
                    Email Us Payment Confirmation
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('tel:+18505550000', '_blank')}
                  >
                    Call Us: (850) 555-GULF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PaymentInstructions;