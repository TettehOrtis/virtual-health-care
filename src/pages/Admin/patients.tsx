import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AdminPatient {
    id: string;
    supabaseId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
    updatedAt: string;
    stats: { appointmentCount: number; prescriptionCount: number; medicalRecordCount: number };
}

export default function AdminPatients() {
    const [patients, setPatients] = useState<AdminPatient[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const res = await fetch('/api/admin/patients', {
                    headers: { Authorization: token ? `Bearer ${token}` : '' }
                });
                if (!res.ok) throw new Error('Failed to load patients');
                const data = await res.json();
                setPatients(data.patients);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">Patients</h2>
                {loading ? (
                    <div className="text-muted-foreground">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {patients.map((p) => (
                            <div key={p.id} className="bg-gradient-card border border-border rounded-xl p-4 shadow-card">
                                <p className="font-semibold text-foreground">{p.name}</p>
                                <p className="text-sm text-muted-foreground">{p.email}</p>
                                <p className="text-sm text-muted-foreground">{p.phone}</p>
                                <div className="mt-2 text-xs text-muted-foreground">Appointments: {p.stats.appointmentCount} • Prescriptions: {p.stats.prescriptionCount} • Records: {p.stats.medicalRecordCount}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}


