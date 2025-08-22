import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Users, UserCheck, Building2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface DashboardStats {
    doctors: number;
    patients: number;
    appointments: number;
    completedAppointments: number;
    hospitals: number;
    pendingHospitalApprovals: number;
    pendingDoctorApprovals: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
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

    const statCards = [
        {
            title: 'Total Doctors',
            value: stats?.doctors ?? 0,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Total Patients',
            value: stats?.patients ?? 0,
            icon: UserCheck,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Total Hospitals',
            value: stats?.hospitals ?? 0,
            icon: Building2,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Total Appointments',
            value: stats?.appointments ?? 0,
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            title: 'Completed Appointments',
            value: stats?.completedAppointments ?? 0,
            icon: CheckCircle,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            title: 'Pending Hospital Approvals',
            value: stats?.pendingHospitalApprovals ?? 0,
            icon: AlertTriangle,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            title: 'Pending Doctor Approvals',
            value: stats?.pendingDoctorApprovals ?? 0,
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6 p-6 bg-white">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
                    <p className="text-muted-foreground">Overview of your healthcare platform</p>
                </div>

                {loading ? (
                    <div className="text-muted-foreground">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {statCards.map((card, index) => {
                            const IconComponent = card.icon;
                            return (
                                <div key={index} className="bg-gradient-card border border-border rounded-xl p-6 shadow-card hover:shadow-hover transition-all duration-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{card.title}</p>
                                            <p className="text-3xl font-bold text-foreground">{card.value}</p>
                                        </div>
                                        <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                            <IconComponent className={`w-6 h-6 ${card.color}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Quick Actions Section */}
                <div className="bg-gradient-card border border-border rounded-xl p-6 shadow-card">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-medium text-foreground mb-2">Review Pending Approvals</h4>
                            <p className="text-sm text-muted-foreground">
                                {stats?.pendingDoctorApprovals ?? 0} doctors and {stats?.pendingHospitalApprovals ?? 0} hospitals awaiting approval
                            </p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-medium text-foreground mb-2">Platform Overview</h4>
                            <p className="text-sm text-muted-foreground">
                                {stats?.doctors ?? 0} doctors serving {stats?.patients ?? 0} patients across {stats?.hospitals ?? 0} hospitals
                            </p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-medium text-foreground mb-2">Appointment Activity</h4>
                            <p className="text-sm text-muted-foreground">
                                {stats?.completedAppointments ?? 0} of {stats?.appointments ?? 0} appointments completed
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}


