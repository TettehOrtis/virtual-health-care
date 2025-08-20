import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AdminDoctor {
    id: string;
    supabaseId: string;
    name: string;
    email: string;
    specialization: string;
    phone: string;
    address: string;
    createdAt: string;
    updatedAt: string;
    stats: { appointmentCount: number; prescriptionCount: number };
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

    return (
        <AdminLayout>
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">Doctors</h2>
                {loading ? (
                    <div className="text-muted-foreground">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {doctors.map((d) => (
                            <div key={d.id} className="bg-gradient-card border border-border rounded-xl p-4 shadow-card">
                                <p className="font-semibold text-foreground">{d.name}</p>
                                <p className="text-sm text-muted-foreground">{d.email}</p>
                                <p className="text-sm text-muted-foreground">{d.specialization}</p>
                                <div className="mt-2 text-xs text-muted-foreground">Appointments: {d.stats.appointmentCount} • Prescriptions: {d.stats.prescriptionCount}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}


