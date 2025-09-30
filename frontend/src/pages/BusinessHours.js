import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Clock, MapPin, Phone, Mail, Calendar } from 'lucide-react';

const BusinessHours = () => {
  const hours = [
    { day: 'Monday', time: '7:00 AM - 8:00 PM' },
    { day: 'Tuesday', time: '7:00 AM - 8:00 PM' },
    { day: 'Wednesday', time: '7:00 AM - 8:00 PM' },
    { day: 'Thursday', time: '7:00 AM - 8:00 PM' },
    { day: 'Friday', time: '7:00 AM - 9:00 PM' },
    { day: 'Saturday', time: '6:00 AM - 9:00 PM' },
    { day: 'Sunday', time: '6:00 AM - 8:00 PM' }
  ];

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="main-content">
      <section className="section">
        <div className="container max-w-4xl">
          <div className="section-header text-center">
            <h1 className="section-title">Business Information</h1>
            <p className="section-subtitle">Operating hours and booking availability</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Operating Hours */}
            <Card className="card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-teal-600" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hours.map((schedule, index) => (
                    <div 
                      key={index}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        schedule.day === currentDay 
                          ? 'bg-teal-50 border border-teal-200' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <span className={`font-medium ${
                        schedule.day === currentDay ? 'text-teal-700' : 'text-gray-700'
                      }`}>
                        {schedule.day}
                        {schedule.day === currentDay && (
                          <span className="ml-2 text-xs bg-teal-600 text-white px-2 py-1 rounded">
                            TODAY
                          </span>
                        )}
                      </span>
                      <span className={`${
                        schedule.day === currentDay ? 'text-teal-600 font-semibold' : 'text-gray-600'
                      }`}>
                        {schedule.time}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Booking Availability</h4>
                  <p className="text-sm text-blue-700">
                    Customers can book services every 30 minutes during operating hours. 
                    Extended evening hours available on weekends for special sunset experiences.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Location */}
            <Card className="card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-teal-600" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="font-medium">(850) 555-GULF</p>
                      <p className="text-sm text-gray-600">Business Phone</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="font-medium">exclusivefloat850@gmail.com</p>
                      <p className="text-sm text-gray-600">Business Email</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="font-medium">Panama City Beach, FL</p>
                      <p className="text-sm text-gray-600">Emerald Coast Waters</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Peak Times</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sunrise Tours:</span>
                      <span className="font-medium">6:00 AM - 8:00 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Morning Peak:</span>
                      <span className="font-medium">9:00 AM - 12:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Afternoon:</span>
                      <span className="font-medium">1:00 PM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sunset Tours:</span>
                      <span className="font-medium">6:00 PM - 8:00 PM</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Special Hours</h4>
                  <p className="text-sm text-green-700">
                    • Extended weekend hours for sunset experiences<br/>
                    • Early morning starts available for sunrise tours<br/>
                    • LED night tours available until 9:00 PM on Fridays & Saturdays
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card className="card">
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => window.location.href = '/admin'}>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Bookings Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = '/bookings'}>
                    <Clock className="h-4 w-4 mr-2" />
                    Test Booking System
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

export default BusinessHours;