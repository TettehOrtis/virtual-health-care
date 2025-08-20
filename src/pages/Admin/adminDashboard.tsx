import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminDashboard() {
    const [stats, setStats] = useState<{ doctors: number; patients: number; appointments: number; completedAppointments: number } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const res = await fetch('/api/admin/stats', {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : ''
                    }
                });
                if (!res.ok) throw new Error('Failed to load stats');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
                {loading ? (
                    <div className="text-muted-foreground">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-card border border-border rounded-xl p-6 shadow-card">
                            <p className="text-sm text-muted-foreground">Doctors</p>
                            <p className="text-3xl font-bold text-foreground">{stats?.doctors ?? 0}</p>
                        </div>
                        <div className="bg-gradient-card border border-border rounded-xl p-6 shadow-card">
                            <p className="text-sm text-muted-foreground">Patients</p>
                            <p className="text-3xl font-bold text-foreground">{stats?.patients ?? 0}</p>
                        </div>
                        <div className="bg-gradient-card border border-border rounded-xl p-6 shadow-card">
                            <p className="text-sm text-muted-foreground">Appointments</p>
                            <p className="text-3xl font-bold text-foreground">{stats?.appointments ?? 0}</p>
                        </div>
                        <div className="bg-gradient-card border border-border rounded-xl p-6 shadow-card">
                            <p className="text-sm text-muted-foreground">Completed</p>
                            <p className="text-3xl font-bold text-foreground">{stats?.completedAppointments ?? 0}</p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}


