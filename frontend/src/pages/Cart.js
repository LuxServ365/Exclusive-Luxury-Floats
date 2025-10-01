import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, DollarSign } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Cart = () => {
  const [cartId, setCartId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tripProtection, setTripProtection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
  const navigate = useNavigate();
  const location = useLocation();
  const [waiverCompleted, setWaiverCompleted] = useState(false);

  // Fee constants
  const TRIP_PROTECTION_FEE = 5.99;
  const BAY_COUNTY_TAX_RATE = 0.07; // 7% Bay County, FL tax
  const CREDIT_CARD_FEE_RATE = 0.03; // 3% credit card processing fee

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Check if coming from waiver
    if (location.state?.fromWaiver && location.state?.waiverComplete) {
      setWaiverCompleted(true);
      // Check if waiver ID exists
      const waiverExists = localStorage.getItem('waiver_id');
      if (waiverExists) {
        setWaiverCompleted(true);
      }
    } else {
      // Check if waiver was already completed
      const waiverExists = localStorage.getItem('waiver_id');
      if (waiverExists) {
        setWaiverCompleted(true);
      }
    }
    
    // Get cart ID from localStorage or create new cart
    const storedCartId = localStorage.getItem('cart_id');
    if (storedCartId) {
      setCartId(storedCartId);
      loadCart(storedCartId);
    } else {
      createNewCart();
    }
  }, [location]);

  const createNewCart = async () => {
    try {
      const response = await fetch(`${API}/cart/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setCartId(data.cart_id);
        localStorage.setItem('cart_id', data.cart_id);
      }
    } catch (error) {
      console.error('Error creating cart:', error);
      toast.error('Failed to create shopping cart');
    }
  };

  const loadCart = async (id) => {
    try {
      const response = await fetch(`${API}/cart/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items);
        setSubtotal(data.total_amount);
        setCustomerInfo(data.customer_info || { name: '', email: '', phone: '' });
      } else if (response.status === 404 || response.status === 410) {
        // Cart not found or expired, create new one
        localStorage.removeItem('cart_id');
        createNewCart();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart');
    }
  };

  // Calculate totals with fees and taxes
  const calculateTotals = () => {
    let itemsSubtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    let tripProtectionFee = tripProtection ? TRIP_PROTECTION_FEE : 0;
    let taxableAmount = itemsSubtotal + tripProtectionFee;
    let tax = taxableAmount * BAY_COUNTY_TAX_RATE;
    let subtotalWithTax = taxableAmount + tax;
    let creditCardFee = (selectedPaymentMethod === 'stripe' || selectedPaymentMethod === 'paypal') ? 
                        subtotalWithTax * CREDIT_CARD_FEE_RATE : 0;
    let finalTotal = subtotalWithTax + creditCardFee;

    return {
      itemsSubtotal,
      tripProtectionFee,
      tax,
      creditCardFee,
      finalTotal
    };
  };

  const totals = calculateTotals();

  const updateItemQuantity = async (itemIndex, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(itemIndex);
      return;
    }

    // Update locally first for better UX
    const updatedItems = [...cartItems];
    updatedItems[itemIndex].quantity = newQuantity;
    updatedItems[itemIndex].subtotal = updatedItems[itemIndex].price * newQuantity;
    setCartItems(updatedItems);
  };

  const removeItem = async (itemIndex) => {
    try {
      const response = await fetch(`${API}/cart/${cartId}/item/${itemIndex}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedItems = cartItems.filter((_, index) => index !== itemIndex);
        setCartItems(updatedItems);
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const updateCustomerInfo = async (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
    
    // Debounced API call to update customer info
    clearTimeout(window.customerInfoTimeout);
    window.customerInfoTimeout = setTimeout(async () => {
      try {
        await fetch(`${API}/cart/${cartId}/customer`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...customerInfo, [field]: value })
        });
      } catch (error) {
        console.error('Error updating customer info:', error);
      }
    }, 500);
  };

  const handleCheckout = async () => {
    // Check if waiver is completed first
    if (!waiverCompleted) {
      // Save customer info before going to waiver
      if (customerInfo.name && customerInfo.email) {
        await updateCustomerInfo();
      }
      toast.info('Please complete the waiver before proceeding to payment');
      navigate('/waiver');
      return;
    }

    if (!customerInfo.name || !customerInfo.email) {
      toast.error('Please provide your name and email');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const checkoutResponse = await fetch(`${API}/cart/${cartId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_info: customerInfo,
          payment_method: selectedPaymentMethod,
          success_url: `${window.location.origin}/booking-success`,
          cancel_url: `${window.location.origin}/cart`,
          trip_protection: tripProtection,
          additional_fees: {
            trip_protection_fee: tripProtection ? TRIP_PROTECTION_FEE : 0,
            tax_rate: BAY_COUNTY_TAX_RATE,
            credit_card_fee_rate: (selectedPaymentMethod === 'stripe' || selectedPaymentMethod === 'paypal') ? CREDIT_CARD_FEE_RATE : 0
          },
          final_total: totals.finalTotal
        })
      });

      if (checkoutResponse.ok) {
        const checkoutData = await checkoutResponse.json();
        
        if (checkoutData.checkout_url) {
          // Redirect to payment processor (Stripe/PayPal)
          window.location.href = checkoutData.checkout_url;
        } else if (checkoutData.payment_instructions) {
          // Redirect to manual payment instructions (Venmo/CashApp/Zelle)
          localStorage.removeItem('cart_id');
          navigate(`/payment-instructions?booking_id=${checkoutData.booking_id}`);
        } else {
          // Handle other scenarios
          toast.success('Booking created successfully!');
          localStorage.removeItem('cart_id');
          navigate('/bookings');
        }
      } else {
        const errorData = await checkoutResponse.json();
        toast.error(errorData.detail || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const continueShopping = () => {
    navigate('/bookings');
  };

  if (!cartId) {
    return (
      <div className="main-content">
        <section className="section">
          <div className="container max-w-4xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-4">Loading your cart...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="main-content">
      <section className="section">
        <div className="container max-w-6xl">
          <div className="section-header">
            <h1 className="section-title flex items-center gap-3">
              <ShoppingCart className="h-8 w-8" />
              Shopping Cart
            </h1>
            <p className="section-subtitle">
              Review your selected services and complete your booking
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="h-24 w-24 mx-auto text-gray-400 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h3>
              <p className="text-gray-500 mb-8">Add some amazing Gulf Float experiences to get started!</p>
              <Button 
                onClick={continueShopping}
                size="lg"
                className="btn btn-primary"
              >
                Browse Services
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold mb-6">Your Items ({cartItems.length})</h2>
                
                {cartItems.map((item, index) => (
                  <Card key={index} className="card">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                          <div className="text-sm text-gray-600 mt-2 space-y-1">
                            <p>📅 Date: {new Date(item.booking_date).toLocaleDateString()}</p>
                            <p>⏰ Time: {item.booking_time}</p>
                            {item.special_requests && (
                              <p>📝 Special Requests: {item.special_requests}</p>
                            )}
                          </div>
                          <div className="mt-4">
                            <span className="text-2xl font-bold text-teal-600">${item.price.toFixed(2)}</span>
                            <span className="text-gray-600 text-sm ml-1">each</span>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(index, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="text-lg font-bold">
                            ${item.subtotal.toFixed(2)}
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    onClick={continueShopping}
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>

              {/* Checkout Panel */}
              <div className="lg:col-span-1">
                <Card className="card sticky top-24">
                  <CardHeader>
                    <CardTitle>Checkout</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Customer Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Customer Information</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customer_name">Full Name *</Label>
                        <Input
                          id="customer_name"
                          value={customerInfo.name}
                          onChange={(e) => updateCustomerInfo('name', e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customer_email">Email Address *</Label>
                        <Input
                          id="customer_email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => updateCustomerInfo('email', e.target.value)}
                          placeholder="Enter your email"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customer_phone">Phone Number</Label>
                        <Input
                          id="customer_phone"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => updateCustomerInfo('phone', e.target.value)}
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    {/* Trip Protection Option */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Trip Protection</h3>
                      
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="trip_protection"
                            checked={tripProtection}
                            onChange={(e) => setTripProtection(e.target.checked)}
                            className="mt-1 w-4 h-4 text-teal-600 border-2 border-gray-300 rounded focus:ring-teal-500"
                          />
                          <div className="flex-1">
                            <label htmlFor="trip_protection" className="font-medium text-gray-900 cursor-pointer">
                              Add Trip Protection - $5.99
                            </label>
                            <p className="text-sm text-gray-600 mt-1">
                              Upgrade your booking to get a fast, full refund if you can't attend due to covered reasons.
                            </p>
                          </div>
                        </div>
                        
                        {tripProtection && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                            <h4 className="font-semibold text-green-800 mb-2">You're covered for:</h4>
                            <ul className="text-green-700 space-y-1">
                              <li>• Accident, Illness & Pre-Existing conditions</li>
                              <li>• Transport disruptions</li>
                              <li>• Family or home emergency</li>
                              <li>• And many more covered reasons!</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                      
                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Payment Method</h3>
                      
                      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Credit Card (Stripe)
                            </div>
                          </SelectItem>
                          <SelectItem value="paypal">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              PayPal
                            </div>
                          </SelectItem>
                          <SelectItem value="venmo">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Venmo - @ExclusiveFloat850
                            </div>
                          </SelectItem>
                          <SelectItem value="cashapp">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Cash App - $ExclusiveFloat
                            </div>
                          </SelectItem>
                          <SelectItem value="zelle">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Zelle - exclusivefloat850@gmail.com
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Order Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Services Subtotal:</span>
                          <span>${totals.itemsSubtotal.toFixed(2)}</span>
                        </div>
                        
                        {tripProtection && (
                          <div className="flex justify-between text-sm">
                            <span>Trip Protection:</span>
                            <span>${totals.tripProtectionFee.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-sm">
                          <span>Bay County Tax (7%):</span>
                          <span>${totals.tax.toFixed(2)}</span>
                        </div>
                        
                        {(selectedPaymentMethod === 'stripe' || selectedPaymentMethod === 'paypal') && (
                          <div className="flex justify-between text-sm">
                            <span>Credit Card Processing (3%):</span>
                            <span>${totals.creditCardFee.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-teal-600">${totals.finalTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full btn-primary" 
                      size="lg"
                      onClick={handleCheckout}
                      disabled={loading || cartItems.length === 0}
                    >
                      {loading ? 'Processing...' : 
                       !waiverCompleted ? `Complete Waiver - $${totals.finalTotal.toFixed(2)}` : 
                       `Proceed to Payment - $${totals.finalTotal.toFixed(2)}`
                      }
                    </Button>

                    {!waiverCompleted && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800">
                          📋 All guests must complete the electronic waiver before payment
                        </p>
                      </div>
                    )}

                    {waiverCompleted && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          ✅ Waiver completed - Ready for payment
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 text-center">
                      Your booking will be confirmed after successful payment.
                      You will receive a confirmation email with all details.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Cart;