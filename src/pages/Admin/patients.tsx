import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Users,
    Search,
    Mail,
    Phone,
    MapPin,
    Activity,
    Eye,
    MessageSquare,
    Download,
    Filter,
    MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminPatient {
    id: string;
    supabaseId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    gender: string;
    bloodType?: string;
    emergencyContact?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
    stats: {
        appointmentCount: number;
        prescriptionCount: number;
        medicalRecordCount: number;
        totalSpent: number;
    };
    recentAppointments: Array<{
        id: string;
        date: string;
        doctorName: string;
        status: string;
    }>;
}

export default function AdminPatients() {
    const [patients, setPatients] = useState<AdminPatient[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [filter, setFilter] = useState<string>('all');
    const [selectedPatient, setSelectedPatient] = useState<AdminPatient | null>(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('/api/admin/patients', {
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });
            if (!res.ok) throw new Error('Failed to load patients');
            const data = await res.json();
            setPatients(data.patients || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'INACTIVE':
                return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
            case 'SUSPENDED':
                return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const filteredPatients = patients.filter((patient) => {
        const matchesSearch = [patient.name, patient.email, patient.phone].some((v) =>
            v.toLowerCase().includes(search.toLowerCase())
        );
        const matchesFilter = filter === 'all' || patient.status === filter;
        return matchesSearch && matchesFilter;
    });

    const exportPatients = () => {
        const csvContent = [
            ['Name', 'Email', 'Phone', 'Status', 'Appointments', 'Prescriptions', 'Records', 'Total Spent'],
            ...filteredPatients.map(p => [
                p.name,
                p.email,
                p.phone,
                p.status,
                p.stats.appointmentCount,
                p.stats.prescriptionCount,
                p.stats.medicalRecordCount,
                p.stats.totalSpent
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'patients.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-gray-900">Patient Management</h2>
                    <div className="text-gray-600">Loading patients...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Patient Management</h2>
                        <p className="text-gray-600">Manage patient profiles and medical records</p>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={exportPatients}
                            className="border-gray-300 text-gray-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search patients..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-white border border-gray-300 text-gray-900"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                            >
                                <option value="all">All Patients</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                            <Button variant="outline" className="border-gray-300 text-gray-700">
                                <Filter className="w-4 h-4 mr-2" />
                                Filter
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Patients Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPatients.map((patient) => (
                        <Card key={patient.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-100 p-3 rounded-lg">
                                            <Users className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-gray-900">{patient.name}</CardTitle>
                                            <p className="text-sm text-gray-600">
                                                {patient.gender} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(patient.status)}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Contact Information */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-900">{patient.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-900">{patient.phone}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-900">{patient.address}</span>
                                    </div>
                                    {patient.bloodType && (
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Activity className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-900">Blood Type: {patient.bloodType}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Statistics */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">{patient.stats.appointmentCount}</p>
                                        <p className="text-xs text-gray-600">Appointments</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">{patient.stats.prescriptionCount}</p>
                                        <p className="text-xs text-gray-600">Prescriptions</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">{patient.stats.medicalRecordCount}</p>
                                        <p className="text-xs text-gray-600">Records</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">${patient.stats.totalSpent}</p>
                                        <p className="text-xs text-gray-600">Total Spent</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-gray-300 text-gray-700"
                                        onClick={() => setSelectedPatient(patient)}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        View Details
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-gray-300 text-gray-700">
                                        <MessageSquare className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-gray-300 text-gray-700">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Additional Info */}
                                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                                    <div className="flex justify-between">
                                        <span>Joined: {new Date(patient.createdAt).toLocaleDateString()}</span>
                                        {patient.lastLogin && (
                                            <span>Last login: {new Date(patient.lastLogin).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredPatients.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                        <p className="text-gray-600">
                            {search ? 'Try adjusting your search criteria.' : 'Patients will appear here once they register.'}
                        </p>
                    </div>
                )}

                {/* Patient Details Modal */}
                {selectedPatient && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Patient Details</h3>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedPatient(null)}
                                    className="border-gray-300 text-gray-700"
                                >
                                    Close
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-700">Name</Label>
                                        <p className="text-gray-900">{selectedPatient.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-700">Email</Label>
                                        <p className="text-gray-900">{selectedPatient.email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-700">Phone</Label>
                                        <p className="text-gray-900">{selectedPatient.phone}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-700">Date of Birth</Label>
                                        <p className="text-gray-900">{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-700">Gender</Label>
                                        <p className="text-gray-900">{selectedPatient.gender}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-700">Blood Type</Label>
                                        <p className="text-gray-900">{selectedPatient.bloodType || 'Not specified'}</p>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-gray-700">Address</Label>
                                    <p className="text-gray-900">{selectedPatient.address}</p>
                                </div>

                                {selectedPatient.emergencyContact && (
                                    <div>
                                        <Label className="text-gray-700">Emergency Contact</Label>
                                        <p className="text-gray-900">{selectedPatient.emergencyContact}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">{selectedPatient.stats.appointmentCount}</p>
                                        <p className="text-sm text-gray-600">Appointments</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">{selectedPatient.stats.prescriptionCount}</p>
                                        <p className="text-sm text-gray-600">Prescriptions</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-purple-600">{selectedPatient.stats.medicalRecordCount}</p>
                                        <p className="text-sm text-gray-600">Records</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-orange-600">${selectedPatient.stats.totalSpent}</p>
                                        <p className="text-sm text-gray-600">Total Spent</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
