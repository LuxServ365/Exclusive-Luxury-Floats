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
import { CalendarIcon, Clock, Users, DollarSign, ShoppingCart, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Bookings = () => {
  const [services, setServices] = useState({});
  const [selectedServices, setSelectedServices] = useState({}); // Changed to object for multiple services
  const [quantities, setQuantities] = useState({}); // Track quantities for each service
  const [commonBookingData, setCommonBookingData] = useState({
    booking_date: null,
    booking_time: '',
    special_requests: ''
  });
  const [loading, setLoading] = useState(false);
  const [cartId, setCartId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const navigate = useNavigate();

  // Time slots (7 AM to 8 PM, every 30 minutes)
  const timeSlots = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', 
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00'
  ];

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    fetchServices();
    initializeCart();
  }, []);

  // Calculate total amount when selections change
  useEffect(() => {
    calculateTotal();
  }, [selectedServices, quantities, services]);

  const calculateTotal = () => {
    let total = 0;
    Object.keys(selectedServices).forEach(serviceId => {
      if (selectedServices[serviceId] && services[serviceId]) {
        const quantity = quantities[serviceId] || 1;
        total += services[serviceId].price * quantity;
      }
    });
    setTotalAmount(total);
  };

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

  const initializeCart = async () => {
    // Get existing cart or create new one
    let existingCartId = localStorage.getItem('cart_id');
    
    if (!existingCartId) {
      try {
        const response = await fetch(`${API}/cart/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          existingCartId = data.cart_id;
          localStorage.setItem('cart_id', existingCartId);
        }
      } catch (error) {
        console.error('Error creating cart:', error);
      }
    }
    
    setCartId(existingCartId);
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
    
    // Initialize quantity if service is being selected
    if (!selectedServices[serviceId] && !quantities[serviceId]) {
      setQuantities(prev => ({
        ...prev,
        [serviceId]: 1
      }));
    }
  };

  const handleQuantityChange = (serviceId, quantity) => {
    setQuantities(prev => ({
      ...prev,
      [serviceId]: Math.max(1, quantity)
    }));
  };

  const handleCommonDataChange = (field, value) => {
    setCommonBookingData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddToCart = async () => {
    if (!cartId) {
      toast.error('Cart not initialized. Please refresh the page.');
      return;
    }

    if (!isBookingValid()) {
      toast.error('Please select services and fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      // Add each selected service to cart
      const selectedServiceIds = Object.keys(selectedServices).filter(id => selectedServices[id]);
      
      for (const serviceId of selectedServiceIds) {
        const quantity = quantities[serviceId] || 1;
        
        const response = await fetch(`${API}/cart/${cartId}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: serviceId,
            quantity: quantity,
            booking_date: commonBookingData.booking_date.toISOString().split('T')[0],
            booking_time: commonBookingData.booking_time + ':00',
            special_requests: commonBookingData.special_requests
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(`Failed to add ${services[serviceId]?.name}: ${errorData.detail}`);
          return;
        }
      }
      
      toast.success(`Added ${selectedServiceIds.length} service(s) to cart!`);
      
      // Reset selections but keep common data
      setSelectedServices({});
      setQuantities({});
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add services to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToCart = () => {
    navigate('/cart');
  };

  const isBookingValid = () => {
    return bookingData.service_id &&
           bookingData.booking_date &&
           bookingData.booking_time;
  };

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

          {/* Services Grid */}
          <div className="pricing-grid mb-12">
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
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="pricing-features space-y-2">
                    {service.features && service.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-teal-600 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
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

          {/* Booking Form */}
          {selectedService && (
            <div className="max-w-4xl mx-auto">
              <Card className="card" data-testid="booking-form-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Plus className="h-6 w-6" />
                    Add to Cart - {services[selectedService]?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date Selection */}
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

                    {/* Time Selection */}
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

                    {/* Quantity Selection */}
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
                              {num} {num === 1 ? 'item' : 'items'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price Display */}
                    <div className="space-y-2">
                      <Label>Total Price</Label>
                      <div className="text-2xl font-bold text-teal-600">
                        ${calculatePrice().toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <Label htmlFor="special_requests" data-testid="requests-label">Special Requests (Optional)</Label>
                    <Textarea
                      id="special_requests"
                      value={bookingData.special_requests}
                      onChange={(e) => handleInputChange('special_requests', e.target.value)}
                      placeholder="Any special requests or requirements?"
                      rows={3}
                      data-testid="requests-textarea"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      className="flex-1 btn-primary flex items-center gap-2" 
                      onClick={handleAddToCart}
                      disabled={!isBookingValid() || loading}
                      data-testid="add-to-cart-btn"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {loading ? 'Adding to Cart...' : `Add to Cart - $${calculatePrice().toFixed(2)}`}
                    </Button>

                    <Button 
                      variant="outline" 
                      onClick={goToCart}
                      className="flex-1 flex items-center gap-2"
                      data-testid="view-cart-btn"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      View Cart & Checkout
                    </Button>
                  </div>

                  <div className="text-sm text-gray-500 text-center">
                    You can add multiple items to your cart before checkout. 
                    Mix and match different services and time slots!
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedService && (
            <div className="text-center mt-8">
              <p className="text-gray-600">Select a service above to get started with your booking</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Bookings;