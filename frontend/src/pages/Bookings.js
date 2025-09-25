import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { CalendarIcon, Clock, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Bookings = () => {
  const [services, setServices] = useState({});
  const [selectedService, setSelectedService] = useState('');
  const [bookingData, setBookingData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service_id: '',
    quantity: 1,
    booking_date: null,
    booking_time: '',
    special_requests: ''
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Service Selection, 2: Details, 3: Payment

  // Time slots (9 AM to 6 PM)
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API}/services`);
      const data = await response.json();
      setServices(data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    }
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    setBookingData(prev => ({ ...prev, service_id: serviceId }));
  };

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    if (!selectedService || !services[selectedService]) return 0;
    return services[selectedService].price * bookingData.quantity;
  };

  const handleSubmitBooking = async () => {
    setLoading(true);
    try {
      // Format the booking data
      const bookingPayload = {
        ...bookingData,
        booking_date: bookingData.booking_date.toISOString().split('T')[0],
        booking_time: bookingData.booking_time + ':00'
      };

      // Create booking
      const bookingResponse = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (!bookingResponse.ok) {
        throw new Error('Failed to create booking');
      }

      const booking = await bookingResponse.json();
      toast.success('Booking created successfully!');

      // Create payment session
      const paymentPayload = {
        booking_id: booking.id,
        origin_url: window.location.origin
      };

      const paymentResponse = await fetch(`${API}/payments/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload)
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment session');
      }

      const paymentData = await paymentResponse.json();
      
      // Redirect to Stripe checkout
      window.location.href = paymentData.url;

    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isBookingValid = () => {
    return bookingData.customer_name &&
           bookingData.customer_email &&
           bookingData.customer_phone &&
           bookingData.service_id &&
           bookingData.booking_date &&
           bookingData.booking_time;
  };

  if (step === 1) {
    return (
      <div className="main-content">
        <section className="section">
          <div className="container max-w-6xl">
            <div className="section-header">
              <h1 className="section-title" data-testid="booking-title">Select Your Experience</h1>
              <p className="section-subtitle" data-testid="booking-subtitle">
                Choose from our premium Gulf Float services and create unforgettable memories
              </p>
            </div>

            <div className="pricing-grid">
              {Object.entries(services).map(([serviceId, service]) => (
                <Card 
                  key={serviceId} 
                  className={`pricing-card cursor-pointer transition-all duration-300 ${
                    selectedService === serviceId ? 'ring-2 ring-teal-500 bg-teal-50' : ''
                  } ${serviceId === 'luxury_cabana_4hr' ? 'featured' : ''}`}
                  onClick={() => handleServiceSelect(serviceId)}
                  data-testid={`service-card-${serviceId}`}
                >
                  <CardHeader className="text-center">
                    <div className="pricing-icon mx-auto mb-4">
                      {serviceId.includes('kayak') ? '🛶' : 
                       serviceId.includes('canoe') ? '🚣' : 
                       serviceId.includes('paddle') ? '🏄' : '🏖️'}
                    </div>
                    <CardTitle className="pricing-title">{service.name}</CardTitle>
                    <div className="pricing-price">${service.price}</div>
                    <div className="pricing-duration">{service.duration}</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="pricing-features space-y-2">
                      {serviceId.includes('kayak') && (
                        <>
                          <li>Crystal-clear transparent kayak</li>
                          <li>Built-in LED lighting system</li>
                          <li>2-person capacity</li>
                          <li>Life jackets included</li>
                          <li>Perfect for night adventures</li>
                        </>
                      )}
                      {serviceId.includes('canoe') && (
                        <>
                          <li>Stable canoe for 2+ people</li>
                          <li>Perfect for families</li>
                          <li>Paddles included</li>
                          <li>Safety equipment provided</li>
                          <li>Great for beginners</li>
                        </>
                      )}
                      {serviceId.includes('paddle') && (
                        <>
                          <li>Premium paddle board</li>
                          <li>Individual experience</li>
                          <li>Paddle included</li>
                          <li>Safety leash provided</li>
                          <li>Perfect for fitness</li>
                        </>
                      )}
                      {serviceId.includes('cabana') && (
                        <>
                          <li>Luxury floating platform</li>
                          <li>Plush seating & shade</li>
                          <li>Private floating space</li>
                          <li>Refreshment storage</li>
                          <li>Ultimate relaxation</li>
                        </>
                      )}
                    </ul>
                    <Button 
                      className={`w-full mt-6 ${
                        selectedService === serviceId 
                          ? 'bg-teal-600 hover:bg-teal-700' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                      onClick={() => handleServiceSelect(serviceId)}
                      data-testid={`select-service-${serviceId}`}
                    >
                      {selectedService === serviceId ? 'Selected' : 'Select This Experience'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedService && (
              <div className="text-center mt-8">
                <Button 
                  size="lg" 
                  onClick={() => setStep(2)}
                  className="btn btn-primary"
                  data-testid="proceed-to-details-btn"
                >
                  Proceed to Booking Details
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="main-content">
        <section className="section">
          <div className="container max-w-4xl">
            <div className="section-header">
              <h1 className="section-title" data-testid="booking-details-title">Booking Details</h1>
              <p className="section-subtitle" data-testid="booking-details-subtitle">
                Complete your reservation for {services[selectedService]?.name}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="card" data-testid="booking-form-card">
                  <CardHeader>
                    <CardTitle>Reservation Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Customer Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer_name" data-testid="name-label">Full Name *</Label>
                        <Input
                          id="customer_name"
                          value={bookingData.customer_name}
                          onChange={(e) => handleInputChange('customer_name', e.target.value)}
                          placeholder="Enter your full name"
                          data-testid="name-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer_email" data-testid="email-label">Email Address *</Label>
                        <Input
                          id="customer_email"
                          type="email"
                          value={bookingData.customer_email}
                          onChange={(e) => handleInputChange('customer_email', e.target.value)}
                          placeholder="Enter your email"
                          data-testid="email-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer_phone" data-testid="phone-label">Phone Number *</Label>
                      <Input
                        id="customer_phone"
                        type="tel"
                        value={bookingData.customer_phone}
                        onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                        placeholder="Enter your phone number"
                        data-testid="phone-input"
                      />
                    </div>

                    {/* Date and Time Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label data-testid="date-label">Booking Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              data-testid="date-picker-trigger"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {bookingData.booking_date ? format(bookingData.booking_date, 'PPP') : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={bookingData.booking_date}
                              onSelect={(date) => handleInputChange('booking_date', date)}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              data-testid="date-picker-calendar"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label data-testid="time-label">Booking Time *</Label>
                        <Select value={bookingData.booking_time} onValueChange={(value) => handleInputChange('booking_time', value)}>
                          <SelectTrigger data-testid="time-select-trigger">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent data-testid="time-select-content">
                            {timeSlots.map(time => (
                              <SelectItem key={time} value={time} data-testid={`time-option-${time}`}>
                                {format(new Date(`2000-01-01T${time}:00`), 'h:mm a')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label data-testid="quantity-label">Quantity</Label>
                      <Select 
                        value={bookingData.quantity.toString()} 
                        onValueChange={(value) => handleInputChange('quantity', parseInt(value))}
                      >
                        <SelectTrigger data-testid="quantity-select-trigger">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent data-testid="quantity-select-content">
                          {[1,2,3,4,5,6].map(num => (
                            <SelectItem key={num} value={num.toString()} data-testid={`quantity-option-${num}`}>
                              {num} {num === 1 ? 'person' : 'people'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="special_requests" data-testid="requests-label">Special Requests (Optional)</Label>
                      <Textarea
                        id="special_requests"
                        value={bookingData.special_requests}
                        onChange={(e) => handleInputChange('special_requests', e.target.value)}
                        placeholder="Any special requests or dietary requirements?"
                        rows={3}
                        data-testid="requests-textarea"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Booking Summary */}
              <div className="lg:col-span-1">
                <Card className="card sticky top-24" data-testid="booking-summary-card">
                  <CardHeader>
                    <CardTitle>Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3" data-testid="summary-service">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <span>🏖️</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{services[selectedService]?.name}</p>
                        <p className="text-xs text-gray-600">{services[selectedService]?.duration}</p>
                      </div>
                    </div>

                    {bookingData.booking_date && (
                      <div className="flex items-center space-x-3" data-testid="summary-date">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                          <CalendarIcon className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{format(bookingData.booking_date, 'PPP')}</p>
                          {bookingData.booking_time && (
                            <p className="text-xs text-gray-600">
                              {format(new Date(`2000-01-01T${bookingData.booking_time}:00`), 'h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3" data-testid="summary-quantity">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{bookingData.quantity} {bookingData.quantity === 1 ? 'person' : 'people'}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4" data-testid="summary-total">
                        <span className="font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-teal-600">${calculateTotal().toFixed(2)}</span>
                      </div>

                      <Button 
                        className="w-full mb-4" 
                        onClick={handleSubmitBooking}
                        disabled={!isBookingValid() || loading}
                        data-testid="proceed-to-payment-btn"
                      >
                        {loading ? 'Processing...' : 'Proceed to Payment'}
                      </Button>

                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setStep(1)}
                        data-testid="back-to-services-btn"
                      >
                        Back to Service Selection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return null;
};

export default Bookings;