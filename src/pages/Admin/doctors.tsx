import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    Download
} from 'lucide-react';

interface DoctorDocument {
    id: string;
    title: string;
    fileName: string;
    fileType: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    uploadedAt: string;
    publicUrl?: string;
    size?: number;
}

interface AdminDoctor {
    id: string;
    supabaseId: string;
    name: string;
    email: string;
    specialization: string;
    phone: string;
    address: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    createdAt: string;
    updatedAt: string;
    stats: {
        appointmentCount: number;
        prescriptionCount: number;
        documentCount: number;
    };
    documents: DoctorDocument[];
}

export default function AdminDoctors() {
    const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const res = await fetch('/api/admin/doctors', {
                    headers: { Authorization: token ? `Bearer ${token}` : '' }
                });
                if (!res.ok) throw new Error('Failed to load doctors');
                const data = await res.json();
                setDoctors(data.doctors);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

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

    const getDocumentStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-green-100 text-green-800 text-xs">Approved</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800 text-xs">Rejected</Badge>;
            default:
                return <Badge variant="secondary" className="text-xs">{status}</Badge>;
        }
    };

    const handleStatusUpdate = async (doctorId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`/api/admin/doctors/${doctorId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                // Update the local state
                setDoctors(prev => prev.map(doctor =>
                    doctor.id === doctorId
                        ? { ...doctor, status: newStatus as any }
                        : doctor
                ));
            }
        } catch (err) {
            console.error('Failed to update doctor status:', err);
        }
    };

    const handleDocumentStatusUpdate = async (documentId: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING' | 'SUSPENDED') => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`/api/admin/documents/${documentId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setDoctors(prev => prev.map(d => ({
                    ...d,
                    documents: d.documents.map(doc => doc.id === documentId ? { ...doc, status: newStatus } as any : doc)
                })));
            } else {
                console.error('Failed to update document status');
            }
        } catch (err) {
            console.error('Failed to update document status:', err);
        }
    };

    const handleViewDocument = (doc: DoctorDocument) => {
        if (!doc.publicUrl) return;
        window.open(doc.publicUrl, '_blank');
    }

    const handleDownloadDocument = (doc: DoctorDocument) => {
        if (!doc.publicUrl) return;
        const a = document.createElement('a');
        a.href = doc.publicUrl;
        a.download = doc.fileName || 'document';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-foreground">Doctors Management</h2>
                    <div className="text-muted-foreground">Loading doctors...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Doctors Management</h2>
                    <p className="text-muted-foreground">Manage doctor profiles, documents, and approval status</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {doctors.map((doctor) => (
                        <Card key={doctor.id} className="bg-gradient-card border border-border shadow-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{doctor.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(doctor.status)}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Contact Information */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <span>{doctor.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <span>{doctor.phone}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span>{doctor.address}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span>Joined {new Date(doctor.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-foreground">{doctor.stats.appointmentCount}</p>
                                        <p className="text-xs text-muted-foreground">Appointments</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-foreground">{doctor.stats.prescriptionCount}</p>
                                        <p className="text-xs text-muted-foreground">Prescriptions</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-foreground">{doctor.stats.documentCount}</p>
                                        <p className="text-xs text-muted-foreground">Documents</p>
                                    </div>
                                </div>

                                {/* Documents Section */}
                                {doctor.documents.length > 0 && (
                                    <div className="pt-4 border-t border-border">
                                        <h4 className="font-medium text-foreground mb-3 flex items-center">
                                            <FileText className="w-4 h-4 mr-2" />
                                            Uploaded Documents
                                        </h4>
                                        <div className="space-y-2">
                                            {doctor.documents.map((doc) => (
                                                <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                                    <div className="flex items-center space-x-2">
                                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">{doc.title}</p>
                                                            <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {getDocumentStatusBadge(doc.status)}
                                                        {doc.size ? (
                                                            <span className="text-xs text-muted-foreground">{(doc.size / 1024).toFixed(1)} KB</span>
                                                        ) : null}
                                                        <Button size="sm" variant="ghost" onClick={() => handleViewDocument(doc)}>
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleDownloadDocument(doc)}>
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                        {doc.status === 'PENDING' && (
                                                            <>
                                                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleDocumentStatusUpdate(doc.id, 'APPROVED')}>
                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                    Approve
                                                                </Button>
                                                                <Button size="sm" variant="destructive" onClick={() => handleDocumentStatusUpdate(doc.id, 'REJECTED')}>
                                                                    <XCircle className="w-4 h-4 mr-1" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {doc.status === 'APPROVED' && (
                                                            <Button size="sm" variant="outline" onClick={() => handleDocumentStatusUpdate(doc.id, 'REJECTED')}>
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex space-x-2 pt-4 border-t border-border">
                                    {doctor.status === 'PENDING' && (
                                        <>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleStatusUpdate(doctor.id, 'APPROVED')}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleStatusUpdate(doctor.id, 'REJECTED')}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    {doctor.status === 'APPROVED' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleStatusUpdate(doctor.id, 'SUSPENDED')}
                                        >
                                            <AlertTriangle className="w-4 h-4 mr-1" />
                                            Suspend
                                        </Button>
                                    )}
                                    {(doctor.status === 'REJECTED' || doctor.status === 'SUSPENDED') && (
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleStatusUpdate(doctor.id, 'APPROVED')}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Approve
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {doctors.length === 0 && (
                    <div className="text-center py-12">
                        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No doctors found</h3>
                        <p className="text-muted-foreground">Doctors will appear here once they register and upload their documents.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}


