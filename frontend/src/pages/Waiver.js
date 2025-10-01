import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, AlertTriangle, FileText, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Waiver = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalGuests, setTotalGuests] = useState(1);
  const [waiverData, setWaiverData] = useState({
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    medical_conditions: '',
    additional_notes: ''
  });
  const [guests, setGuests] = useState([]);
  const canvasRefs = useRef([]);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    const cartId = localStorage.getItem('cart_id');
    if (!cartId) {
      toast.error('No cart found. Please add items to cart first.');
      navigate('/bookings');
      return;
    }

    try {
      const response = await fetch(`${API}/cart/${cartId}`);
      if (response.ok) {
        const data = await response.json();
        setCart(data);
        
        // Calculate total guests from cart items
        const total = data.items.reduce((sum, item) => sum + item.quantity, 0);
        setTotalGuests(total);
        
        // Initialize guest data
        const guestList = Array.from({ length: total }, (_, index) => ({
          id: index + 1,
          name: '',
          date: new Date().toISOString().split('T')[0],
          isMinor: false,
          guardianName: '',
          guardianSignature: null,
          participantSignature: null
        }));
        setGuests(guestList);
        
        // Initialize canvas refs
        canvasRefs.current = Array.from({ length: total * 2 }, () => React.createRef());
      } else {
        throw new Error('Failed to fetch cart data');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart data');
      navigate('/cart');
    }
  };

  const setupCanvas = (canvas, guestIndex, type) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let isDrawing = false;
    
    const startDrawing = (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    
    const draw = (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    
    const stopDrawing = () => {
      if (!isDrawing) return;
      isDrawing = false;
      
      // Save signature data
      const signatureData = canvas.toDataURL();
      setGuests(prev => prev.map(guest => 
        guest.id === guestIndex + 1
          ? { ...guest, [`${type}Signature`]: signatureData }
          : guest
      ));
    };
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      canvas.dispatchEvent(mouseEvent);
    });
  };

  const clearSignature = (guestIndex, type) => {
    const canvasIndex = type === 'participant' ? guestIndex * 2 : (guestIndex * 2) + 1;
    const canvas = canvasRefs.current[canvasIndex]?.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      setGuests(prev => prev.map(guest => 
        guest.id === guestIndex + 1
          ? { ...guest, [`${type}Signature`]: null }
          : guest
      ));
    }
  };

  const updateGuestInfo = (guestIndex, field, value) => {
    setGuests(prev => prev.map(guest => 
      guest.id === guestIndex + 1
        ? { ...guest, [field]: value }
        : guest
    ));
  };

  const validateForm = () => {
    // Check waiver data
    if (!waiverData.emergency_contact_name || !waiverData.emergency_contact_phone) {
      toast.error('Please fill in emergency contact information');
      return false;
    }

    // Check each guest
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      
      if (!guest.name) {
        toast.error(`Please enter name for Guest ${i + 1}`);
        return false;
      }
      
      if (!guest.participantSignature) {
        toast.error(`Please sign participant signature for ${guest.name}`);
        return false;
      }
      
      if (guest.isMinor) {
        if (!guest.guardianName) {
          toast.error(`Please enter guardian name for ${guest.name} (minor)`);
          return false;
        }
        if (!guest.guardianSignature) {
          toast.error(`Please sign guardian signature for ${guest.name} (minor)`);
          return false;
        }
      }
    }
    
    return true;
  };

  const submitWaiver = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const cartId = localStorage.getItem('cart_id');
      const waiverPayload = {
        cart_id: cartId,
        waiver_data: waiverData,
        guests: guests,
        signed_at: new Date().toISOString(),
        total_guests: totalGuests
      };
      
      const response = await fetch(`${API}/waiver/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(waiverPayload)
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success('Waiver signed successfully!');
        
        // Store waiver ID for payment reference
        localStorage.setItem('waiver_id', result.waiver_id);
        
        // Navigate to payment with cart data
        navigate('/cart', { 
          state: { 
            fromWaiver: true,
            waiverComplete: true
          }
        });
      } else {
        throw new Error('Failed to submit waiver');
      }
    } catch (error) {
      console.error('Error submitting waiver:', error);
      toast.error('Failed to submit waiver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <section className="section">
        <div className="container max-w-4xl">
          <div className="section-header text-center">
            <div className="flex justify-center mb-4">
              <FileText className="h-16 w-16 text-teal-600" />
            </div>
            <h1 className="section-title">Electronic Waiver</h1>
            <p className="section-subtitle">
              Please complete this waiver for all guests before proceeding to payment
            </p>
          </div>

          {/* Cart Summary */}
          <Card className="card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Booking Summary ({totalGuests} guest{totalGuests !== 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cart.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-600 ml-2">({item.quantity} guest{item.quantity !== 1 ? 's' : ''})</span>
                    </div>
                    <span className="font-semibold">${item.subtotal}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-teal-600">${cart.total_amount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waiver Content */}
          <Card className="card mb-8">
            <CardHeader>
              <CardTitle>Waiver of Liability, Assumption of Risk, and Indemnity Agreement</CardTitle>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">
                      PLEASE READ THIS DOCUMENT CAREFULLY. IT IS A LEGALLY BINDING AGREEMENT.
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 text-sm">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base mb-2">1. Assumption of Risk</h3>
                    <p>The undersigned acknowledges and agrees that participation in all activities offered by Exclusive Water Sports & Lounge carries inherent risks of injury, illness, property damage, and even death. These risks include, but are not limited to:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>Environmental Hazards:</strong> Drowning, changing ocean conditions, extreme weather, excessive heat exposure, sunstroke, dehydration, and slick surfaces.</li>
                      <li><strong>Marine & Wildlife Encounters:</strong> Bites, stings, or attacks from ocean wildlife.</li>
                      <li><strong>Equipment & Facility Use:</strong> Equipment failure, collisions, slips, trips, falls, and injuries from use or misuse of rental equipment.</li>
                      <li><strong>Flotation Devices:</strong> Use of provided flotation devices is at your own risk. No guarantees regarding effectiveness or safety.</li>
                      <li><strong>Nighttime Activities:</strong> Increased risks including reduced visibility and difficulty in emergency response.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">2. Waiver and Release of Liability</h3>
                    <p>The undersigned waives, releases, and discharges Exclusive Water Sports & Lounge from any and all claims, demands, or actions arising out of participation, <strong>EVEN IF CAUSED BY NEGLIGENCE</strong>.</p>
                    <p className="mt-2"><strong>NO LIFEGUARDS ARE PRESENT</strong> at any time during operations.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">3. Participant Obligations</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Participants must be <strong>physically fit and capable</strong> of participating safely.</li>
                      <li>Must follow all posted rules and safety guidelines.</li>
                      <li><strong>Drug and Alcohol Policy:</strong> Participation under the influence is strictly prohibited.</li>
                      <li>Participants are liable for any damage caused to company property.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">4. Emergency Medical Authorization</h3>
                    <p>In case of emergency, the company is authorized to administer first aid and obtain medical care. Participants are responsible for all associated costs.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">5. Cancellation Policy</h3>
                    <p>If activities are canceled by the company due to unsafe conditions, guests may reschedule or request a full refund.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Information */}
          <Card className="card mb-8">
            <CardHeader>
              <CardTitle>Emergency Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_name">Emergency Contact Name *</Label>
                  <Input
                    id="emergency_name"
                    value={waiverData.emergency_contact_name}
                    onChange={(e) => setWaiverData(prev => ({
                      ...prev,
                      emergency_contact_name: e.target.value
                    }))}
                    placeholder="Full name of emergency contact"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_phone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    value={waiverData.emergency_contact_phone}
                    onChange={(e) => setWaiverData(prev => ({
                      ...prev,
                      emergency_contact_phone: e.target.value
                    }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="emergency_relationship">Relationship to Participant(s)</Label>
                <Input
                  id="emergency_relationship"
                  value={waiverData.emergency_contact_relationship}
                  onChange={(e) => setWaiverData(prev => ({
                    ...prev,
                    emergency_contact_relationship: e.target.value
                  }))}
                  placeholder="e.g., Spouse, Parent, Friend"
                />
              </div>
              <div>
                <Label htmlFor="medical_conditions">Medical Conditions or Allergies</Label>
                <Textarea
                  id="medical_conditions"
                  value={waiverData.medical_conditions}
                  onChange={(e) => setWaiverData(prev => ({
                    ...prev,
                    medical_conditions: e.target.value
                  }))}
                  placeholder="List any medical conditions, allergies, or medications that staff should be aware of..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={waiverData.additional_notes}
                  onChange={(e) => setWaiverData(prev => ({
                    ...prev,
                    additional_notes: e.target.value
                  }))}
                  placeholder="Any other information we should know..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Guest Signatures */}
          <div className="space-y-6">
            {guests.map((guest, index) => (
              <Card key={guest.id} className="card">
                <CardHeader>
                  <CardTitle>Guest {guest.id} Information & Signatures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`guest_name_${index}`}>Full Name *</Label>
                      <Input
                        id={`guest_name_${index}`}
                        value={guest.name}
                        onChange={(e) => updateGuestInfo(index, 'name', e.target.value)}
                        placeholder="Enter full legal name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`guest_date_${index}`}>Date *</Label>
                      <Input
                        id={`guest_date_${index}`}
                        type="date"
                        value={guest.date}
                        onChange={(e) => updateGuestInfo(index, 'date', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`minor_${index}`}
                      checked={guest.isMinor}
                      onChange={(e) => updateGuestInfo(index, 'isMinor', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`minor_${index}`}>This participant is under 18 years old</Label>
                  </div>

                  {guest.isMinor && (
                    <div>
                      <Label htmlFor={`guardian_name_${index}`}>Parent/Guardian Name *</Label>
                      <Input
                        id={`guardian_name_${index}`}
                        value={guest.guardianName}
                        onChange={(e) => updateGuestInfo(index, 'guardianName', e.target.value)}
                        placeholder="Full name of parent or legal guardian"
                      />
                    </div>
                  )}

                  {/* Participant Signature */}
                  <div>
                    <Label>Participant Signature *</Label>
                    <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
                      <canvas
                        ref={(ref) => {
                          canvasRefs.current[index * 2] = { current: ref };
                          if (ref) setupCanvas(ref, index, 'participant');
                        }}
                        className="w-full h-24 border border-gray-200 rounded cursor-crosshair"
                        style={{ touchAction: 'none' }}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Sign above</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => clearSignature(index, 'participant')}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Guardian Signature */}
                  {guest.isMinor && (
                    <div>
                      <Label>Parent/Guardian Signature *</Label>
                      <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
                        <canvas
                          ref={(ref) => {
                            canvasRefs.current[(index * 2) + 1] = { current: ref };
                            if (ref) setupCanvas(ref, index, 'guardian');
                          }}
                          className="w-full h-24 border border-gray-200 rounded cursor-crosshair"
                          style={{ touchAction: 'none' }}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">Parent/Guardian sign above</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => clearSignature(index, 'guardian')}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Agreement Confirmation */}
          <Card className="card">
            <CardContent className="pt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold text-green-800">
                      By signing above, all participants acknowledge that they have:
                    </p>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Carefully read and understood this waiver agreement</li>
                      <li>• Voluntarily assumed all risks associated with the activities</li>
                      <li>• Released Exclusive Water Sports & Lounge from all liability</li>
                      <li>• Agreed to follow all safety rules and instructions</li>
                      <li>• Provided accurate emergency contact and medical information</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={submitWaiver}
              disabled={loading}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-8 py-3 text-lg font-semibold"
              size="lg"
            >
              {loading ? 'Processing...' : 'Complete Waiver & Proceed to Payment'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Waiver;