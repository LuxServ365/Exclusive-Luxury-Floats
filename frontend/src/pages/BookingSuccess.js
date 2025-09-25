import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [paymentStatus, setPaymentStatus] = useState('checking');
  const [statusDetails, setStatusDetails] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    const maxAttempts = 5;
    const pollInterval = 2000; // 2 seconds

    if (attempts >= maxAttempts) {
      setPaymentStatus('timeout');
      return;
    }

    try {
      const response = await fetch(`${API}/payments/checkout/status/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      setStatusDetails(data);
      
      if (data.payment_status === 'paid') {
        setPaymentStatus('success');
        return;
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
        return;
      }

      // If payment is still pending, continue polling
      setPaymentStatus('processing');
      setTimeout(() => {
        setAttempts(prev => prev + 1);
        checkPaymentStatus();
      }, pollInterval);

    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('error');
    }
  };

  if (!sessionId) {
    return (
      <div className="main-content">
        <section className="section">
          <div className="container max-w-2xl text-center">
            <Card className="card">
              <CardContent className="p-8">
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-4">Invalid Session</h1>
                <p className="text-gray-600 mb-6">
                  We couldn't find your booking session. Please try booking again.
                </p>
                <Link to="/bookings">
                  <Button className="btn btn-primary">Return to Bookings</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="main-content">
      <section className="section">
        <div className="container max-w-2xl">
          <Card className="card text-center" data-testid="booking-success-card">
            <CardContent className="p-8">
              {paymentStatus === 'checking' && (
                <>
                  <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                  <h1 className="text-2xl font-bold mb-4" data-testid="status-title">Checking Payment Status...</h1>
                  <p className="text-gray-600" data-testid="status-message">
                    Please wait while we confirm your payment.
                  </p>
                </>
              )}

              {paymentStatus === 'processing' && (
                <>
                  <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
                  <h1 className="text-2xl font-bold mb-4" data-testid="status-title">Payment Processing...</h1>
                  <p className="text-gray-600" data-testid="status-message">
                    Your payment is being processed. This may take a few moments.
                  </p>
                </>
              )}

              {paymentStatus === 'success' && (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-4 text-green-700" data-testid="success-title">
                    Booking Confirmed!
                  </h1>
                  <p className="text-gray-600 mb-6" data-testid="success-message">
                    Thank you for choosing Exclusive Gulf Float! Your booking has been confirmed 
                    and you'll receive a confirmation email shortly.
                  </p>

                  {statusDetails && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left" data-testid="booking-details">
                      <h3 className="font-semibold mb-2">Booking Details:</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Amount: ${(statusDetails.amount_total / 100).toFixed(2)}</p>
                        <p>Currency: {statusDetails.currency.toUpperCase()}</p>
                        <p>Status: {statusDetails.payment_status}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6" data-testid="next-steps">
                    <h3 className="font-semibold text-teal-800 mb-2">What's Next?</h3>
                    <ul className="text-sm text-teal-700 text-left space-y-1">
                      <li>• You'll receive a confirmation email with all details</li>
                      <li>• Arrive 15 minutes early for check-in</li>
                      <li>• Bring sunscreen and comfortable swimwear</li>
                      <li>• Life jackets and safety equipment will be provided</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/" className="flex-1">
                      <Button variant="outline" className="w-full" data-testid="return-home-btn">
                        Return Home
                      </Button>
                    </Link>
                    <Link to="/gallery" className="flex-1">
                      <Button className="w-full btn btn-primary" data-testid="view-gallery-btn">
                        View Gallery
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {paymentStatus === 'expired' && (
                <>
                  <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-4" data-testid="expired-title">Session Expired</h1>
                  <p className="text-gray-600 mb-6" data-testid="expired-message">
                    Your payment session has expired. Please try booking again.
                  </p>
                  <Link to="/bookings">
                    <Button className="btn btn-primary" data-testid="rebook-btn">Try Again</Button>
                  </Link>
                </>
              )}

              {(paymentStatus === 'error' || paymentStatus === 'timeout') && (
                <>
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-4" data-testid="error-title">
                    {paymentStatus === 'timeout' ? 'Status Check Timed Out' : 'Error Occurred'}
                  </h1>
                  <p className="text-gray-600 mb-6" data-testid="error-message">
                    {paymentStatus === 'timeout' 
                      ? "We couldn't verify your payment status. Please check your email for confirmation or contact us."
                      : "There was an error checking your payment status. Please contact us for assistance."
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/contact" className="flex-1">
                      <Button variant="outline" className="w-full" data-testid="contact-us-btn">
                        Contact Us
                      </Button>
                    </Link>
                    <Link to="/bookings" className="flex-1">
                      <Button className="w-full btn btn-primary" data-testid="try-again-btn">
                        Try Again
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="text-center mt-8" data-testid="contact-info">
            <p className="text-gray-600 mb-2">Need assistance?</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm">
              <a 
                href="tel:(850)555-GULF" 
                className="text-teal-600 hover:text-teal-700 font-semibold"
                data-testid="contact-phone"
              >
                📞 (850) 555-GULF
              </a>
              <a 
                href="mailto:bookings@exclusivegulffloat.com" 
                className="text-teal-600 hover:text-teal-700 font-semibold"
                data-testid="contact-email"
              >
                ✉️ bookings@exclusivegulffloat.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookingSuccess;