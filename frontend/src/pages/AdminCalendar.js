import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { RefreshCw, Calendar as CalendarIcon, Users, DollarSign } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminCalendar = () => {
  const [bookings, setBookings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchBookings();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API}/bookings`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
        processBookingsForCalendar(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const processBookingsForCalendar = (bookingsData) => {
    const events = [];
    
    bookingsData.forEach(booking => {
      // Only process confirmed bookings
      if (booking.payment_status === 'completed' || booking.status === 'confirmed') {
        booking.items.forEach(item => {
          const bookingDate = new Date(item.booking_date + 'T' + item.booking_time);
          const endDate = new Date(bookingDate);
          
          // Determine duration based on service
          let durationHours = 1; // Default 1 hour
          if (item.name.includes('3 hours') || item.name.includes('3-hour')) {
            durationHours = 3;
          } else if (item.name.includes('4 hours') || item.name.includes('4-hour')) {
            durationHours = 4;
          } else if (item.service_id?.includes('cabana_3hr')) {
            durationHours = 3;
          } else if (item.service_id?.includes('cabana_4hr')) {
            durationHours = 4;
          }
          
          endDate.setHours(endDate.getHours() + durationHours);
          
          // Determine if it's a cabana service
          const isCabana = item.service_id?.includes('cabana') || 
                           item.name?.toLowerCase().includes('cabana') ||
                           item.name?.toLowerCase().includes('floating');
          
          const event = {
            id: `${booking.id}-${item.service_id}`,
            title: `${item.name} (x${item.quantity})`,
            start: bookingDate,
            end: endDate,
            resource: {
              booking: booking,
              item: item,
              isCabana: isCabana,
              customerName: booking.customer_name,
              customerEmail: booking.customer_email,
              customerPhone: booking.customer_phone,
              bookingReference: booking.booking_reference,
              paymentMethod: booking.payment_method,
              totalAmount: booking.final_total || booking.total_amount || 0,
              specialRequests: item.special_requests
            }
          };
          
          events.push(event);
        });
      }
    });
    
    setCalendarEvents(events);
  };

  const eventStyleGetter = (event) => {
    const isCabana = event.resource.isCabana;
    
    return {
      style: {
        backgroundColor: isCabana ? '#10b981' : '#3b82f6', // Green for cabanas, Blue for others
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        fontWeight: '600',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchBookings();
  };

  const getTodayBookings = () => {
    const today = moment().format('YYYY-MM-DD');
    return calendarEvents.filter(event => 
      moment(event.start).format('YYYY-MM-DD') === today
    );
  };

  const getUpcomingBookings = () => {
    const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
    return calendarEvents.filter(event => 
      moment(event.start).format('YYYY-MM-DD') === tomorrow
    );
  };

  const getTotalRevenue = () => {
    return bookings
      .filter(b => b.payment_status === 'completed')
      .reduce((sum, b) => sum + (b.final_total || b.total_amount || 0), 0);
  };

  return (
    <div className="main-content">
      <section className="section">
        <div className="container max-w-7xl">
          <div className="section-header">
            <h1 className="section-title flex items-center gap-3">
              <CalendarIcon className="h-8 w-8" />
              Booking Calendar
            </h1>
            <p className="section-subtitle">
              Real-time view of all confirmed bookings with color-coded services
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                    <p className="text-2xl font-bold text-teal-600">{getTodayBookings().length}</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-teal-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tomorrow</p>
                    <p className="text-2xl font-bold text-blue-600">{getUpcomingBookings().length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-purple-600">{calendarEvents.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">${getTotalRevenue().toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Controls */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <div className="text-sm text-gray-600">
                Last updated: {moment(lastRefresh).format('h:mm A')}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Cabana Rentals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Watercraft Rentals</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-3">
              <Card className="card">
                <CardContent className="p-6">
                  <div style={{ height: '600px' }}>
                    <Calendar
                      localizer={localizer}
                      events={calendarEvents}
                      startAccessor="start"
                      endAccessor="end"
                      titleAccessor="title"
                      eventPropGetter={eventStyleGetter}
                      onSelectEvent={handleSelectEvent}
                      view={view}
                      onView={setView}
                      date={date}
                      onNavigate={setDate}
                      popup={true}
                      popupOffset={30}
                      views={['month', 'week', 'day', 'agenda']}
                      step={30}
                      timeslots={2}
                      defaultView="month"
                      className="admin-calendar"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Details Sidebar */}
            <div className="lg:col-span-1">
              <Card className="card sticky top-24">
                <CardHeader>
                  <CardTitle>
                    {selectedEvent ? 'Booking Details' : 'Select a Booking'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEvent ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className={selectedEvent.resource.isCabana ? 'bg-green-500' : 'bg-blue-500'}>
                          {selectedEvent.resource.isCabana ? 'Cabana' : 'Watercraft'}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-gray-700">Service</h4>
                          <p className="text-sm">{selectedEvent.title}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-700">Customer</h4>
                          <p className="text-sm font-medium">{selectedEvent.resource.customerName}</p>
                          <p className="text-xs text-gray-600">{selectedEvent.resource.customerEmail}</p>
                          {selectedEvent.resource.customerPhone && (
                            <p className="text-xs text-gray-600">{selectedEvent.resource.customerPhone}</p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-700">Time</h4>
                          <p className="text-sm">
                            {moment(selectedEvent.start).format('MMM D, YYYY')}
                          </p>
                          <p className="text-sm">
                            {moment(selectedEvent.start).format('h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-700">Booking Details</h4>
                          <p className="text-xs text-gray-600 mb-1">
                            Ref: {selectedEvent.resource.bookingReference}
                          </p>
                          <p className="text-xs text-gray-600 mb-1">
                            Payment: {selectedEvent.resource.paymentMethod.toUpperCase()}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            Total: ${selectedEvent.resource.totalAmount.toFixed(2)}
                          </p>
                        </div>

                        {selectedEvent.resource.specialRequests && (
                          <div>
                            <h4 className="font-semibold text-gray-700">Special Requests</h4>
                            <p className="text-sm text-gray-600">{selectedEvent.resource.specialRequests}</p>
                          </div>
                        )}

                        <div className="pt-4 border-t">
                          <Button
                            size="sm"
                            className="w-full mb-2"
                            onClick={() => window.open(`mailto:${selectedEvent.resource.customerEmail}`, '_blank')}
                          >
                            Email Customer
                          </Button>
                          {selectedEvent.resource.customerPhone && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => window.open(`tel:${selectedEvent.resource.customerPhone}`, '_blank')}
                            >
                              Call Customer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">Click on a booking in the calendar to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card className="card">
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    onClick={() => window.location.href = '/admin'}
                    variant="outline"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View All Bookings
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/bookings'}
                    variant="outline"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Create New Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Custom Calendar Styles */}
      <style jsx>{`
        .admin-calendar .rbc-event {
          border: none !important;
          border-radius: 8px !important;
        }
        
        .admin-calendar .rbc-selected {
          background-color: rgba(0, 0, 0, 0.1) !important;
        }
        
        .admin-calendar .rbc-today {
          background-color: rgba(16, 185, 129, 0.1) !important;
        }
        
        .admin-calendar .rbc-header {
          font-weight: 600;
          color: #374151;
          padding: 12px 8px;
        }
        
        .admin-calendar .rbc-month-view {
          border-radius: 8px;
        }
        
        .admin-calendar .rbc-event.rbc-selected {
          background-color: rgba(0, 0, 0, 0.8) !important;
        }
      `}</style>
    </div>
  );
};

export default AdminCalendar;