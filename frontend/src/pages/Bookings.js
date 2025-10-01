import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { CalendarIcon, Clock, Users, DollarSign, ShoppingCart, Plus, Minus } from 'lucide-react';
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
    const hasSelectedServices = Object.values(selectedServices).some(selected => selected);
    return hasSelectedServices && 
           commonBookingData.booking_date && 
           commonBookingData.booking_time;
  };

  const getSelectedServicesCount = () => {
    return Object.values(selectedServices).filter(selected => selected).length;
  };

  return (
    <div className="main-content">
      <section className="section">
        <div className="container max-w-6xl">
          <div className="section-header">
            <h1 className="section-title" data-testid="booking-title">Select Your Experience</h1>
            <p className="section-subtitle" data-testid="booking-subtitle">
              Choose multiple services and create your perfect Gulf Float adventure
            </p>
            {getSelectedServicesCount() > 0 && (
              <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-teal-700 font-semibold">
                  {getSelectedServicesCount()} service(s) selected • Total: ${totalAmount.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Services Grid */}
          <div className="pricing-grid mb-12">
            {Object.entries(services).map(([serviceId, service]) => (
              <Card 
                key={serviceId} 
                className={`pricing-card transition-all duration-300 ${
                  selectedServices[serviceId] ? 'ring-2 ring-teal-500 bg-teal-50' : ''
                } ${serviceId === 'luxury_cabana_4hr' ? 'featured' : ''}`}
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
                  <ul className="pricing-features space-y-2 mb-4">
                    {service.features && service.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-teal-600 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {/* Service Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServices[serviceId] || false}
                          onChange={() => handleServiceToggle(serviceId)}
                          className="w-5 h-5 text-teal-600 border-2 border-gray-300 rounded focus:ring-teal-500"
                          data-testid={`select-service-${serviceId}`}
                        />
                        <span className="font-medium">
                          {selectedServices[serviceId] ? 'Selected' : 'Select This Service'}
                        </span>
                      </label>
                    </div>
                    
                    {/* Quantity Controls */}
                    {selectedServices[serviceId] && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Quantity:</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(serviceId, (quantities[serviceId] || 1) - 1)}
                              disabled={(quantities[serviceId] || 1) <= 1}
                              data-testid={`decrease-${serviceId}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-semibold text-lg">
                              {quantities[serviceId] || 1}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(serviceId, (quantities[serviceId] || 1) + 1)}
                              data-testid={`increase-${serviceId}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-lg font-bold text-teal-600">
                            Subtotal: ${((quantities[serviceId] || 1) * service.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Booking Form */}
          {getSelectedServicesCount() > 0 && (
            <div className="max-w-4xl mx-auto">
              <Card className="card" data-testid="booking-form-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Plus className="h-6 w-6" />
                    Add {getSelectedServicesCount()} Service(s) to Cart - Total: ${totalAmount.toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selected Services Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-3">Selected Services:</h3>
                    <div className="space-y-2">
                      {Object.keys(selectedServices)
                        .filter(serviceId => selectedServices[serviceId])
                        .map(serviceId => (
                          <div key={serviceId} className="flex justify-between items-center">
                            <span className="text-sm">{services[serviceId]?.name}</span>
                            <span className="text-sm font-semibold">
                              {quantities[serviceId] || 1} × ${services[serviceId]?.price} = 
                              ${((quantities[serviceId] || 1) * services[serviceId]?.price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-teal-600">${totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

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
                            {commonBookingData.booking_date ? format(commonBookingData.booking_date, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={commonBookingData.booking_date}
                            onSelect={(date) => handleCommonDataChange('booking_date', date)}
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
                      <select 
                        value={commonBookingData.booking_time} 
                        onChange={(e) => handleCommonDataChange('booking_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        data-testid="time-select-trigger"
                      >
                        <option value="" disabled>Select time</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time} data-testid={`time-option-${time}`}>
                            {format(new Date(`2000-01-01T${time}:00`), 'h:mm a')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <Label htmlFor="special_requests" data-testid="requests-label">Special Requests (Optional)</Label>
                    <Textarea
                      id="special_requests"
                      value={commonBookingData.special_requests}
                      onChange={(e) => handleCommonDataChange('special_requests', e.target.value)}
                      placeholder="Any special requests or requirements for your Gulf Float experience?"
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
                      {loading ? 'Adding to Cart...' : `Add ${getSelectedServicesCount()} Service(s) to Cart - $${totalAmount.toFixed(2)}`}
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
                    All selected services will share the same date and time. 
                    You can add different time slots by creating separate bookings.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {getSelectedServicesCount() === 0 && (
            <div className="text-center mt-8">
              <p className="text-gray-600">Select one or more services above to get started with your booking</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Bookings;