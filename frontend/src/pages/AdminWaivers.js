import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FileText, Users, Calendar, Search, Eye, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminWaivers = () => {
  const [waivers, setWaivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWaiver, setSelectedWaiver] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredWaivers, setFilteredWaivers] = useState([]);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    fetchWaivers();
  }, []);

  useEffect(() => {
    // Filter waivers based on search term
    const filtered = waivers.filter(waiver => 
      waiver.waiver_data.emergency_contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      waiver.guests.some(guest => guest.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      waiver.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      waiver.cart_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredWaivers(filtered);
  }, [waivers, searchTerm]);

  const fetchWaivers = async () => {
    try {
      const response = await fetch(`${API}/waivers`);
      if (response.ok) {
        const data = await response.json();
        setWaivers(data);
      } else {
        console.error('Failed to fetch waivers');
      }
    } catch (error) {
      console.error('Error fetching waivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy - HH:mm');
    } catch {
      return dateString;
    }
  };

  const exportWaivers = () => {
    const csvContent = [
      ['Waiver ID', 'Cart ID', 'Signed Date', 'Total Guests', 'Guest Names', 'Emergency Contact', 'Emergency Phone', 'Medical Conditions', 'Additional Notes'],
      ...filteredWaivers.map(waiver => [
        waiver.id,
        waiver.cart_id,
        formatDate(waiver.signed_at),
        waiver.total_guests,
        waiver.guests.map(g => g.name).join('; '),
        waiver.waiver_data.emergency_contact_name,
        waiver.waiver_data.emergency_contact_phone,
        waiver.waiver_data.medical_conditions || 'None',
        waiver.waiver_data.additional_notes || 'None'
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waivers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <section className="section">
        <div className="container max-w-7xl">
          <div className="section-header text-center">
            <div className="flex justify-center mb-4">
              <FileText className="h-16 w-16 text-teal-600" />
            </div>
            <h1 className="section-title">Signed Waivers</h1>
            <p className="section-subtitle">
              Manage and view all electronic waivers signed by guests
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Waivers</p>
                    <p className="text-3xl font-bold text-teal-600">{waivers.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-teal-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Guests</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {waivers.reduce((sum, waiver) => sum + waiver.total_guests, 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-teal-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {waivers.filter(waiver => {
                        const waiverDate = new Date(waiver.signed_at);
                        const now = new Date();
                        return waiverDate.getMonth() === now.getMonth() && 
                               waiverDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-teal-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Controls */}
          <Card className="card mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, waiver ID, or cart ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={exportWaivers}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={fetchWaivers}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waivers List */}
          <div className="space-y-4">
            {filteredWaivers.length === 0 ? (
              <Card className="card">
                <CardContent className="pt-6 text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No waivers found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'Waivers will appear here as guests complete them'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredWaivers.map((waiver) => (
                <Card key={waiver.id} className="card hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="font-semibold text-lg">
                                Waiver #{waiver.id.slice(-8)}
                              </span>
                              <span className="text-sm text-gray-500">
                                Cart: {waiver.cart_id.slice(-8)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Signed:</span>
                                <p className="text-gray-600">{formatDate(waiver.signed_at)}</p>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-700">Total Guests:</span>
                                <p className="text-gray-600">{waiver.total_guests}</p>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-700">Emergency Contact:</span>
                                <p className="text-gray-600">
                                  {waiver.waiver_data.emergency_contact_name}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {waiver.waiver_data.emergency_contact_phone}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <span className="font-medium text-gray-700">Guests:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {waiver.guests.map((guest, index) => (
                                  <span 
                                    key={index}
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      guest.isMinor 
                                        ? 'bg-amber-100 text-amber-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {guest.name} {guest.isMinor && '(Minor)'}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {waiver.waiver_data.medical_conditions && (
                              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                                  <div>
                                    <span className="font-medium text-amber-800">Medical Conditions:</span>
                                    <p className="text-amber-700 text-sm mt-1">
                                      {waiver.waiver_data.medical_conditions}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWaiver(waiver)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Waiver Detail Modal */}
          {selectedWaiver && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Waiver Details</h2>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedWaiver(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Waiver Info */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Waiver Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Waiver ID:</span>
                        <p className="text-gray-600">{selectedWaiver.id}</p>
                      </div>
                      <div>
                        <span className="font-medium">Cart ID:</span>
                        <p className="text-gray-600">{selectedWaiver.cart_id}</p>
                      </div>
                      <div>
                        <span className="font-medium">Signed At:</span>
                        <p className="text-gray-600">{formatDate(selectedWaiver.signed_at)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Total Guests:</span>
                        <p className="text-gray-600">{selectedWaiver.total_guests}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p className="text-gray-600">{selectedWaiver.waiver_data.emergency_contact_name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span>
                        <p className="text-gray-600">{selectedWaiver.waiver_data.emergency_contact_phone}</p>
                      </div>
                      {selectedWaiver.waiver_data.emergency_contact_relationship && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Relationship:</span>
                          <p className="text-gray-600">{selectedWaiver.waiver_data.emergency_contact_relationship}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medical Information */}
                  {selectedWaiver.waiver_data.medical_conditions && (
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Medical Information</h3>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{selectedWaiver.waiver_data.medical_conditions}</p>
                      </div>
                    </div>
                  )}

                  {/* Guest Signatures */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Guest Signatures</h3>
                    <div className="space-y-4">
                      {selectedWaiver.guests.map((guest, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{guest.name}</h4>
                              <p className="text-sm text-gray-600">
                                {guest.isMinor ? 'Minor' : 'Adult'} • Signed: {guest.date}
                              </p>
                              {guest.isMinor && guest.guardianName && (
                                <p className="text-sm text-gray-600">
                                  Guardian: {guest.guardianName}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {guest.participantSignature && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  {guest.isMinor ? 'Minor' : 'Participant'} Signature:
                                </span>
                                <div className="mt-1 border border-gray-200 rounded p-2 bg-white">
                                  <img 
                                    src={guest.participantSignature} 
                                    alt="Participant signature"
                                    className="max-h-16"
                                  />
                                </div>
                              </div>
                            )}
                            
                            {guest.isMinor && guest.guardianSignature && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Guardian Signature:</span>
                                <div className="mt-1 border border-gray-200 rounded p-2 bg-white">
                                  <img 
                                    src={guest.guardianSignature} 
                                    alt="Guardian signature"
                                    className="max-h-16"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  {selectedWaiver.waiver_data.additional_notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Additional Notes</h3>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{selectedWaiver.waiver_data.additional_notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminWaivers;