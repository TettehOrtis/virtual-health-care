import { useEffect, useState } from 'react';
import { Building2, Plus, Search, MapPin, Phone, Users, Bed, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface HospitalItem {
  id: string;
  name: string;
  location: string;
  services?: string | null;
  licenseNo: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  stats: {
    doctors: number;
    documents: number;
    reports: number;
  };
}

export default function HospitalManagement() {
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newHospital, setNewHospital] = useState({
    name: '',
    location: '',
    services: '',
    licenseNo: '',
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/admin/hospitals', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Failed to load hospitals');
      const data = await res.json();
      setHospitals(data.hospitals);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHospital = async () => {
    if (!newHospital.name || !newHospital.location || !newHospital.licenseNo) {
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('Sending hospital data:', newHospital);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/admin/hospitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(newHospital)
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      if (res.ok) {
        const responseData = await res.json();
        console.log('Success response:', responseData);
        toast.success('Hospital added successfully');
        setNewHospital({ name: '', location: '', services: '', licenseNo: '' });
        setShowAddForm(false);
        fetchHospitals();
      } else {
        const error = await res.json();
        console.log('Error response:', error);
        toast.error(error.message || 'Failed to add hospital');
      }
    } catch (err) {
      console.error('Error in handleAddHospital:', err);
      toast.error('Failed to add hospital');
    }
  };

  const handleStatusUpdate = async (hospitalId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`/api/admin/hospitals/${hospitalId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Hospital status updated to ${newStatus}`);
        setHospitals(prev => prev.map(hospital =>
          hospital.id === hospitalId
            ? { ...hospital, status: newStatus as any }
            : hospital
        ));
      } else {
        toast.error('Failed to update hospital status');
      }
    } catch (err) {
      console.error('Failed to update hospital status:', err);
      toast.error('Failed to update hospital status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-gray-100 text-gray-800"><AlertTriangle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredHospitals = hospitals.filter((h) =>
    [h.name, h.location, h.licenseNo].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Hospital Management</h2>
            <p className="text-gray-600">Manage partner hospitals and their resources</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Hospital
          </Button>
        </div>

        {/* Add Hospital Form */}
        {showAddForm && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Add New Hospital</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700">Hospital Name *</Label>
                  <Input
                    id="name"
                    value={newHospital.name}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter hospital name"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-gray-700">Location *</Label>
                  <Input
                    id="location"
                    value={newHospital.location}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, location: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <Label htmlFor="licenseNo" className="text-gray-700">License Number *</Label>
                  <Input
                    id="licenseNo"
                    value={newHospital.licenseNo}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, licenseNo: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter license number"
                  />
                </div>
                <div>
                  <Label htmlFor="services" className="text-gray-700">Services</Label>
                  <Input
                    id="services"
                    value={newHospital.services}
                    onChange={(e) => setNewHospital(prev => ({ ...prev, services: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="e.g., Emergency, Surgery, Cardiology"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddHospital} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add Hospital
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewHospital({ name: '', location: '', services: '', licenseNo: '' });
                  }}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search hospitals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border border-gray-300 text-gray-900"
            />
          </div>
        </div>

        {/* Hospitals Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {loading ? (
            <div className="text-gray-600">Loading hospitals...</div>
          ) : filteredHospitals.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
              <p className="text-gray-600">Hospitals will appear here once they are added.</p>
            </div>
          ) : (
            filteredHospitals.map((hospital) => (
              <Card key={hospital.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{hospital.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-600">{hospital.location}</p>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(hospital.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bed className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Documents</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{hospital.stats.documents}</p>
                      <p className="text-sm text-gray-600">Total uploaded</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Doctors</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{hospital.stats.doctors}</p>
                      <p className="text-sm text-gray-600">Total staff</p>
                    </div>
                  </div>

                  {hospital.services && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {hospital.services.split(',').map((service, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                            {service.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">License: {hospital.licenseNo}</span>
                    </div>
                    <div className="flex space-x-2">
                      {hospital.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleStatusUpdate(hospital.id, 'APPROVED')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(hospital.id, 'REJECTED')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {hospital.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(hospital.id, 'SUSPENDED')}
                          className="border-gray-300 text-gray-700"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Suspend
                        </Button>
                      )}
                      {(hospital.status === 'REJECTED' || hospital.status === 'SUSPENDED') && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleStatusUpdate(hospital.id, 'APPROVED')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}