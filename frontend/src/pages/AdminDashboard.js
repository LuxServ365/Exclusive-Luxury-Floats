import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, DollarSign, User, Phone, Mail, MessageCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API}/bookings`);
      if (response.ok) {
        const data = await response.json();
        // Sort by newest first
        const sortedBookings = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setBookings(sortedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  if (loading) {
    return (
      <div className="main-content">
        <section className="section">
          <div className="container max-w-6xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-4">Loading bookings...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="main-content">
      <section className="section">
        <div className="container max-w-7xl">
          <div className="section-header">
            <h1 className="section-title">Admin Dashboard</h1>
            <p className="section-subtitle">Manage your Gulf Float bookings and customer requests</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-3xl font-bold text-teal-600">{bookings.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-teal-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${bookings
                        .filter(b => b.payment_status === 'completed')
                        .reduce((sum, b) => sum + b.total_amount, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confirmed</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {bookings.filter(b => b.status === 'confirmed').length}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {bookings.filter(b => b.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-6">
            {['all', 'pending', 'confirmed', 'completed'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                onClick={() => setFilter(status)}
                className={filter === status ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white/20">
                    {bookings.filter(b => b.status === status).length}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No bookings found for the selected filter.</p>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      {/* Main Booking Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {booking.booking_reference}
                          </h3>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <Badge className={getPaymentStatusColor(booking.payment_status)}>
                            {booking.payment_status}
                          </Badge>
                        </div>

                        {/* Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{booking.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{booking.customer_email}</span>
                          </div>
                          {booking.customer_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span>{booking.customer_phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{booking.payment_method.toUpperCase()}</span>
                          </div>
                        </div>

                        {/* Booked Items */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-700">Booked Services:</h4>
                          {booking.items.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <div className="text-sm text-gray-600 mt-1">
                                    <p>📅 {new Date(item.booking_date).toLocaleDateString()}</p>
                                    <p>⏰ {item.booking_time}</p>
                                    <p>👥 Quantity: {item.quantity}</p>
                                    {item.special_requests && (
                                      <p className="mt-1">
                                        <MessageCircle className="h-3 w-3 inline mr-1" />
                                        {item.special_requests}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${item.price}/each</p>
                                  <p className="text-sm text-gray-600">
                                    Total: ${(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total and Actions */}
                      <div className="lg:w-48 text-right">
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-2xl font-bold text-teal-600">
                            ${booking.total_amount.toFixed(2)}
                          </p>
                        </div>

                        <div className="text-sm text-gray-500 mb-4">
                          <p>Created: {new Date(booking.created_at).toLocaleDateString()}</p>
                        </div>

                        <div className="space-y-2">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => window.open(`mailto:${booking.customer_email}`, '_blank')}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email Customer
                          </Button>
                          {booking.customer_phone && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => window.open(`tel:${booking.customer_phone}`, '_blank')}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call Customer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Payment Info Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>💰 Payment Processing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">Stripe Payments</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Credit card payments are processed through Stripe and deposited to your linked bank account.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => window.open('https://dashboard.stripe.com', '_blank')}>
                    View Stripe Dashboard
                  </Button>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">PayPal Payments</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    PayPal payments are deposited directly to your PayPal account balance.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => window.open('https://www.paypal.com/signin', '_blank')}>
                    View PayPal Account
                  </Button>
                </div>
              </div>

              {/* Admin Tools Links */}
              <div className="border-t pt-4 mt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => window.location.href = '/admin/calendar'}>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Booking Calendar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/admin/waivers'}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Signed Waivers
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;