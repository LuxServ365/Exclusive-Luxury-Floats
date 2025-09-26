import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', phone: '', message: '' });

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <section className="section">
        <div className="container max-w-6xl">
          <div className="section-header">
            <h1 className="section-title" data-testid="contact-title">Contact Us</h1>
            <p className="section-subtitle" data-testid="contact-subtitle">
              Get in touch with our team for bookings, questions, or custom experiences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="card" data-testid="contact-form-card">
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" data-testid="name-label">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your name"
                        required
                        data-testid="name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" data-testid="email-label">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email"
                        required
                        data-testid="email-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" data-testid="phone-label">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      data-testid="phone-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" data-testid="message-label">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us about your inquiry or special requests"
                      rows={5}
                      required
                      data-testid="message-textarea"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    data-testid="submit-btn"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="card" data-testid="contact-info-card">
                <CardHeader>
                  <CardTitle>Get In Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4" data-testid="phone-info">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-600">📞</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-teal-700">Call Us</h3>
                      <p className="text-gray-600">(850) 555-GULF</p>
                      <p className="text-sm text-gray-500">Available 7 days a week</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4" data-testid="email-info">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-600">✉️</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-teal-700">Email Us</h3>
                      <p className="text-gray-600">exclusivefloat850@gmail.com</p>
                      <p className="text-sm text-gray-500">We reply within 2 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4" data-testid="location-info">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-600">📍</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-teal-700">Visit Us</h3>
                      <p className="text-gray-600">Panama City, Florida</p>
                      <p className="text-sm text-gray-500">Gulf Coast Marina District</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card" data-testid="hours-card">
                <CardHeader>
                  <CardTitle>Operating Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Monday - Friday</span>
                      <span className="font-semibold">10:00 AM - 10:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Saturday - Sunday</span>
                      <span className="font-semibold">10:00 AM - 10:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Holidays</span>
                      <span className="font-semibold">10:00 AM - 10:00 PM</span>
                    </div>
                    <div className="mt-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
                      <p className="text-sm text-teal-700 font-medium">
                        ⭐ Special Note: Sunrise tours available upon request
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;