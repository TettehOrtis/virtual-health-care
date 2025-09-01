import { useEffect, useState } from 'react';
import { Building2, Plus, Search, MapPin, Phone, Users, Package, CheckCircle, XCircle, Clock, AlertTriangle, Edit, Trash2, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface PharmacyItem {
  id: string;
  name: string;
  location: string;
  phone: string;
  email: string;
  licenseNo: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  services: string[];
  operatingHours: string;
  deliveryRadius: number;
  stats: {
    prescriptions: number;
    orders: number;
    customers: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface PharmacyService {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export default function PharmacyManagement() {
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>([]);
  const [services, setServices] = useState<PharmacyService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showServiceForm, setShowServiceForm] = useState<boolean>(false);
  const [newPharmacy, setNewPharmacy] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    licenseNo: '',
    services: '',
    operatingHours: '',
    deliveryRadius: 10,
  });
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
  });

  useEffect(() => {
    fetchPharmacies();
    fetchServices();
  }, []);

  const fetchPharmacies = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/admin/pharmacies', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Failed to load pharmacies');
      const data = await res.json();
      setPharmacies(data.pharmacies || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/admin/pharmacy-services', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const handleAddPharmacy = async () => {
    if (!newPharmacy.name || !newPharmacy.location || !newPharmacy.licenseNo) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/admin/pharmacies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          ...newPharmacy,
          services: newPharmacy.services.split(',').map(s => s.trim()).filter(s => s)
        })
      });

      if (res.ok) {
        toast.success('Pharmacy added successfully');
        setNewPharmacy({ name: '', location: '', phone: '', email: '', licenseNo: '', services: '', operatingHours: '', deliveryRadius: 10 });
        setShowAddForm(false);
        fetchPharmacies();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to add pharmacy');
      }
    } catch (err) {
      console.error('Error in handleAddPharmacy:', err);
      toast.error('Failed to add pharmacy');
    }
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/admin/pharmacy-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(newService)
      });

      if (res.ok) {
        toast.success('Service added successfully');
        setNewService({ name: '', description: '', price: 0, category: '' });
        setShowServiceForm(false);
        fetchServices();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to add service');
      }
    } catch (err) {
      console.error('Error in handleAddService:', err);
      toast.error('Failed to add service');
    }
  };

  const handleStatusUpdate = async (pharmacyId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`/api/admin/pharmacies/${pharmacyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Pharmacy status updated to ${newStatus}`);
        setPharmacies(prev => prev.map(pharmacy =>
          pharmacy.id === pharmacyId
            ? { ...pharmacy, status: newStatus as any }
            : pharmacy
        ));
      } else {
        toast.error('Failed to update pharmacy status');
      }
    } catch (err) {
      console.error('Failed to update pharmacy status:', err);
      toast.error('Failed to update pharmacy status');
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

  const filteredPharmacies = pharmacies.filter((p) =>
    [p.name, p.location, p.licenseNo, p.email].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Pharmacy Management</h2>
            <p className="text-gray-600">Manage partner pharmacies and their services</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowServiceForm(true)}
              variant="outline"
              className="border-gray-300 text-gray-700"
            >
              <Package className="w-4 h-4 mr-2" />
              Add Service
            </Button>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pharmacy
            </Button>
          </div>
        </div>

        {/* Add Pharmacy Form */}
        {showAddForm && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Add New Pharmacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700">Pharmacy Name *</Label>
                  <Input
                    id="name"
                    value={newPharmacy.name}
                    onChange={(e) => setNewPharmacy(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter pharmacy name"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-gray-700">Location *</Label>
                  <Input
                    id="location"
                    value={newPharmacy.location}
                    onChange={(e) => setNewPharmacy(prev => ({ ...prev, location: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700">Phone</Label>
                  <Input
                    id="phone"
                    value={newPharmacy.phone}
                    onChange={(e) => setNewPharmacy(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPharmacy.email}
                    onChange={(e) => setNewPharmacy(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="licenseNo" className="text-gray-700">License Number *</Label>
                  <Input
                    id="licenseNo"
                    value={newPharmacy.licenseNo}
                    onChange={(e) => setNewPharmacy(prev => ({ ...prev, licenseNo: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter license number"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryRadius" className="text-gray-700">Delivery Radius (km)</Label>
                  <Input
                    id="deliveryRadius"
                    type="number"
                    value={newPharmacy.deliveryRadius}
                    onChange={(e) => setNewPharmacy(prev => ({ ...prev, deliveryRadius: parseInt(e.target.value) }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter delivery radius"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="services" className="text-gray-700">Services (comma-separated)</Label>
                  <Input
                    id="services"
                    value={newPharmacy.services}
                    onChange={(e) => setNewPharmacy(prev => ({ ...prev, services: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="e.g., Prescription delivery, OTC medicines, Health consultations"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="operatingHours" className="text-gray-700">Operating Hours</Label>
                  <Input
                    id="operatingHours"
                    value={newPharmacy.operatingHours}
                    onChange={(e) => setNewPharmacy(prev => ({ ...prev, operatingHours: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="e.g., Mon-Fri: 9AM-9PM, Sat-Sun: 10AM-8PM"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPharmacy} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add Pharmacy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPharmacy({ name: '', location: '', phone: '', email: '', licenseNo: '', services: '', operatingHours: '', deliveryRadius: 10 });
                  }}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Service Form */}
        {showServiceForm && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Add New Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceName" className="text-gray-700">Service Name *</Label>
                  <Input
                    id="serviceName"
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter service name"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-gray-700">Category *</Label>
                  <select
                    id="category"
                    value={newService.category}
                    onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                  >
                    <option value="">Select category</option>
                    <option value="prescription">Prescription</option>
                    <option value="otc">Over-the-Counter</option>
                    <option value="consultation">Health Consultation</option>
                    <option value="delivery">Delivery Service</option>
                    <option value="lab">Lab Services</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="price" className="text-gray-700">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newService.price}
                    onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter price"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-gray-700">Description</Label>
                  <Textarea
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                    placeholder="Enter service description"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddService} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add Service
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowServiceForm(false);
                    setNewService({ name: '', description: '', price: 0, category: '' });
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
              placeholder="Search pharmacies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border border-gray-300 text-gray-900"
            />
          </div>
        </div>

        {/* Pharmacies Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {loading ? (
            <div className="text-gray-600">Loading pharmacies...</div>
          ) : filteredPharmacies.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pharmacies found</h3>
              <p className="text-gray-600">Pharmacies will appear here once they are added.</p>
            </div>
          ) : (
            filteredPharmacies.map((pharmacy) => (
              <Card key={pharmacy.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{pharmacy.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-600">{pharmacy.location}</p>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(pharmacy.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Prescriptions</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{pharmacy.stats.prescriptions}</p>
                      <p className="text-sm text-gray-600">Total filled</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Customers</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{pharmacy.stats.customers}</p>
                      <p className="text-sm text-gray-600">Total served</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Orders</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{pharmacy.stats.orders}</p>
                      <p className="text-sm text-gray-600">Total orders</p>
                    </div>
                  </div>

                  {pharmacy.services && pharmacy.services.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {pharmacy.services.map((service, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    {pharmacy.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{pharmacy.phone}</span>
                      </div>
                    )}
                    {pharmacy.email && (
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>{pharmacy.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span>License: {pharmacy.licenseNo}</span>
                    </div>
                    {pharmacy.operatingHours && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{pharmacy.operatingHours}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Delivery radius: {pharmacy.deliveryRadius}km</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="border-gray-300 text-gray-700">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-300 text-gray-700">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      {pharmacy.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleStatusUpdate(pharmacy.id, 'APPROVED')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(pharmacy.id, 'REJECTED')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {pharmacy.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(pharmacy.id, 'SUSPENDED')}
                          className="border-gray-300 text-gray-700"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Suspend
                        </Button>
                      )}
                      {(pharmacy.status === 'REJECTED' || pharmacy.status === 'SUSPENDED') && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleStatusUpdate(pharmacy.id, 'APPROVED')}
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

        {/* Services Section */}
        {services.length > 0 && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Available Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <Badge className={service.available ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {service.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">${service.price}</span>
                      <span className="text-xs text-gray-500">{service.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
