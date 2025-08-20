import { useEffect, useState } from 'react';
import { Building2, Plus, Search, MapPin, Phone, Users, Bed } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await fetch('/api/admin/hospitals');
        if (!res.ok) throw new Error('Failed to load hospitals');
        const data = await res.json();
        setHospitals(data.hospitals);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Hospital Management</h2>
            <p className="text-muted-foreground">Manage partner hospitals and their resources</p>
          </div>
          <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-hover">
            <Plus className="w-4 h-4 mr-2" />
            Add Hospital
          </Button>
        </div>

        {/* Search */}
        <div className="bg-gradient-card border border-border rounded-xl p-6 shadow-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search hospitals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Hospitals Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {loading ? (
            <div className="text-muted-foreground">Loading hospitals...</div>
          ) : (
            hospitals
              .filter((h) =>
                [h.name, h.location, h.licenseNo].some((v) => v.toLowerCase().includes(search.toLowerCase()))
              )
              .map((hospital) => (
                <div key={hospital.id} className="bg-gradient-card border border-border rounded-xl p-6 shadow-card hover:shadow-hover transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{hospital.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{hospital.location}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${hospital.status === 'APPROVED'
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                      }`}>
                      {hospital.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bed className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Documents</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{hospital.stats.documents}</p>
                      <p className={`text-sm font-medium text-muted-foreground`}>
                        Total uploaded
                      </p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium text-foreground">Doctors</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{hospital.stats.doctors}</p>
                      <p className="text-sm text-muted-foreground">Total staff</p>
                    </div>
                  </div>

                  {hospital.services && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-2">Services</p>
                      <div className="flex flex-wrap gap-2">
                        {hospital.services.split(',').map((service, index) => (
                          <span key={index} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md">
                            {service.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">License: {hospital.licenseNo}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="border-border">
                        View Details
                      </Button>
                      <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
        )}
        </div>
      </div>
    </AdminLayout>
  );
}