import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, AlertTriangle, FileText, Users } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

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
  const signatureRefs = useRef([]);

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
                  <p className="font-semibold text-center">
                    PLEASE READ THIS DOCUMENT CAREFULLY. IT IS A LEGALLY BINDING AGREEMENT THAT WILL AFFECT YOUR LEGAL RIGHTS.
                  </p>
                  
                  <p>
                    In consideration of being permitted to participate in the activities provided by <strong>Exclusive Water Sports & Lounge</strong> (hereinafter referred to as "The Company"), located and operating in <strong>Panama City, Florida,</strong> and <strong>Panama City Beach, Bay County, Florida</strong>, the undersigned participant (and/or Participant's legal guardian, if the Participant is under 18 years of age) hereby agrees to the following terms:
                  </p>

                  <div>
                    <h3 className="font-bold text-base mb-2">1. Assumption of Risk</h3>
                    <p>
                      The undersigned acknowledges and agrees that participation in all activities offered by The Company, including but not limited to <strong>water sports, rentals (e.g., jet skis, kayaks, paddleboards, boats), swimming, sunbathing, use of lounge areas, and general beach activities</strong>, carries inherent risks of injury, illness, property damage, and even death. These risks include, but are not limited to:
                    </p>
                    
                    <div className="mt-3 space-y-2">
                      <p><strong>Environmental Hazards:</strong> Drowning, changing ocean conditions (currents, waves, tides), extreme weather (lightning, sudden storms), <strong>excessive heat exposure</strong>, sunstroke, dehydration, and slick or uneven surfaces.</p>
                      
                      <p><strong>Marine & Wildlife Encounters:</strong> Bites, stings, or attacks from <strong>ocean wildlife</strong> (e.g., jellyfish, stingrays, sharks, fish, or insects).</p>
                      
                      <p><strong>Equipment & Facility Use:</strong> Equipment failure, collision with other vessels or objects, slips, trips, falls, and injuries resulting from the use or misuse of rental equipment or facilities.</p>
                      
                      <p><strong>Third-Party Actions:</strong> Negligence or <strong>misconduct</strong> of other participants, guests, or third parties.</p>
                      
                      <p><strong>Flotation Devices:</strong> The Company may make flotation devices available for use during activities. The Undersigned acknowledges that the <strong>use of any provided flotation device is at their own risk</strong>, and The Company makes no guarantees regarding their effectiveness or safety. Furthermore, for guests who <strong>choose to refrain from using provided flotation devices, The Company holds no liability</strong> for any resulting injury, illness, or death.</p>
                      
                      <p><strong>Nighttime Activities:</strong> Participation in any <strong>nighttime tours or activities presents increased risks</strong>, including but not limited to reduced visibility, colder temperatures, and difficulty in emergency response. The Undersigned acknowledges these heightened risks and participates in such activities <strong>entirely at their own risk.</strong></p>
                    </div>
                    
                    <p className="mt-3">
                      The Undersigned voluntarily accepts and assumes all risks, whether known or unknown, foreseen or unforeseen, associated with participation in The Company's activities and use of its facilities.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">2. Waiver and Release of Liability</h3>
                    <p>
                      The Undersigned, for themselves and their heirs, executors, administrators, personal representatives, and assigns, hereby <strong>waives, releases, discharges, and forever relinquishes</strong> The Company, its owners, agents, officers, directors, employees, volunteers, affiliates, and insurers (collectively, the "Released Parties") from any and all claims, demands, actions, or causes of action of any kind arising out of or relating to participation in The Company's activities, <strong>EVEN IF CAUSED IN WHOLE OR IN PART BY THE NEGLIGENCE, FAULT, OR CARELESSNESS OF THE RELEASED PARTIES.</strong>
                    </p>
                    
                    <p className="mt-3">This waiver and release of liability includes, but is not limited to, claims for:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>Personal injury, illness, or death.</strong></li>
                      <li><strong>Property damage or loss.</strong></li>
                      <li><strong>Loss or theft of personal items.</strong> <strong>The Company is expressly not responsible for any lost, stolen, or damaged items</strong> brought onto or used at its premises or during its activities.</li>
                      <li>Claims resulting from negligence or misconduct of the Released Parties.</li>
                    </ul>
                    
                    <p className="mt-3">
                      The Undersigned understands and agrees that <strong>NO LIFEGUARDS ARE PRESENT</strong> at any time during The Company's operations or activities, and <strong>Exclusive Water Sports & Lounge is NOT LIABLE</strong> for any incidents, injuries, or fatalities related to water activities, including swimming or the use of flotation devices.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">3. Indemnification</h3>
                    <p>
                      The Undersigned hereby agrees to <strong>indemnify, defend, and hold harmless</strong> the Released Parties from and against any and all losses, liabilities, damages, costs, or expenses (including reasonable attorneys' fees) that any of the Released Parties may incur as a result of any claim, suit, or proceeding brought by the Undersigned, their family, or any third party alleging injury, death, or property damage arising out of the Undersigned's participation in The Company's activities.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">4. Participant Obligations, Representations & Warranties</h3>
                    <p>The Undersigned further agrees and represents that:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>They will inspect the equipment and premises before use and report any deficiencies immediately. Continued use constitutes acceptance of the equipment and premises <strong>"as is."</strong></li>
                      <li>They are <strong>physically fit and capable</strong> of participating in the chosen activities, and have <strong>no medical conditions</strong> that would prevent safe participation or increase the risk of injury.</li>
                      <li>They will strictly follow <strong>all posted rules, verbal instructions, and safety guidelines</strong> given by The Company staff.</li>
                      <li>They are responsible for their own conduct and the conduct of any minor under their supervision.</li>
                      <li>The Undersigned acknowledges that <strong>if damage is caused to The Company's property, equipment, or facilities by their actions, negligence, or misuse, Exclusive Water Sports & Lounge reserves the right to charge the guest accordingly for repair or replacement at fair market value.</strong></li>
                      <li><strong>Drug and Alcohol Policy:</strong> The Undersigned confirms they are <strong>not under the influence of alcohol, illegal drugs, or any impairing medication</strong>. Participation under the influence of such substances is strictly prohibited and will result in immediate termination of activities without refund, and The Company retains no liability for any incidents resulting from such impairment.</li>
                      <li><strong>Voluntary Participation:</strong> The Undersigned confirms that their participation is <strong>entirely voluntary</strong> and they are executing this waiver freely and without inducement.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">5. Emergency Medical Authorization</h3>
                    <p>
                      In the event of an emergency, and if the Undersigned is unable to communicate, the Undersigned hereby authorizes The Company and its staff to administer or obtain first aid and emergency medical care, including transportation to a medical facility. The Undersigned (or their legal guardian) understands and agrees that they shall be <strong>solely responsible for any and all costs associated with such medical care</strong>, transportation, and related services.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">6. Photo and Video Release</h3>
                    <p>
                      The Undersigned hereby grants Exclusive Water Sports & Lounge permission to photograph and/or video record their participation in activities and consents to the use of these images and recordings for promotional, marketing, or archival purposes without further compensation or notification.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">7. Cancellation Policy</h3>
                    <p>
                      In the event of a cancellation of confirmed tours or activities by Exclusive Water Sports & Lounge due to unforeseen circumstances, including but not limited to severe weather conditions, equipment malfunction, or other events deemed unsafe by The Company, guests will be offered the opportunity to <strong>reschedule their confirmed tour or activity</strong>. If rescheduling is not possible or desired, <strong>guests may request a full refund</strong> for the portion of the activity canceled, provided the cancellation was initiated by The Company.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base mb-2">8. Governing Law and Severability</h3>
                    <p>
                      This Agreement shall be governed by and construed under the laws of the <strong>State of Florida</strong>, and any legal action relating to this Agreement shall be brought in Bay County, Florida. If any provision of this Agreement is held to be invalid or unenforceable, the remainder of the Agreement shall continue in full legal force and effect. The Undersigned confirms they have read and understood this Agreement in English or have had it fully explained to them in their native language.
                    </p>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <p className="font-semibold text-center">
                      <strong>BY SIGNING THIS DOCUMENT, I ACKNOWLEDGE THAT I HAVE CAREFULLY READ THIS WAIVER OF LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT. I UNDERSTAND AND AGREE TO ITS TERMS, AND I AM SIGNING IT FREELY AND VOLUNTARILY WITHOUT ANY INDUCEMENT.</strong>
                    </p>
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