import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    UserCheck,
    Building2,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Activity,
    Calendar,
    DollarSign,
    Download,
    RefreshCw,
    BarChart3,
    PieChart,
    Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
    doctors: number;
    patients: number;
    appointments: number;
    completedAppointments: number;
    hospitals: number;
    pendingHospitalApprovals: number;
    pendingDoctorApprovals: number;
    totalRevenue: number;
    monthlyRevenue: number;
    activeUsers: number;
    newUsersThisMonth: number;
    averageAppointmentDuration: number;
    topSpecializations: Array<{
        name: string;
        count: number;
    }>;
    recentActivity: Array<{
        id: string;
        type: string;
        description: string;
        timestamp: string;
        user: string;
    }>;
    appointmentTrends: Array<{
        date: string;
        appointments: number;
        completed: number;
    }>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    useEffect(() => {
        fetchStats();
    }, []);

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
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const exportReport = () => {
        if (!stats) return;

        const csvContent = [
            ['Metric', 'Value'],
            ['Total Doctors', stats.doctors],
            ['Total Patients', stats.patients],
            ['Total Appointments', stats.appointments],
            ['Completed Appointments', stats.completedAppointments],
            ['Total Hospitals', stats.hospitals],
            ['Pending Hospital Approvals', stats.pendingHospitalApprovals],
            ['Pending Doctor Approvals', stats.pendingDoctorApprovals],
            ['Total Revenue', stats.totalRevenue],
            ['Monthly Revenue', stats.monthlyRevenue],
            ['Active Users', stats.activeUsers],
            ['New Users This Month', stats.newUsersThisMonth],
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Report exported successfully');
    };

    const statCards = [
        {
            title: 'Total Doctors',
            value: stats?.doctors ?? 0,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            trend: '+12%',
            trendUp: true,
        },
        {
            title: 'Total Patients',
            value: stats?.patients ?? 0,
            icon: UserCheck,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            trend: '+8%',
            trendUp: true,
        },
        {
            title: 'Total Revenue',
            value: `$${stats?.totalRevenue?.toLocaleString() ?? 0}`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            trend: '+15%',
            trendUp: true,
        },
        {
            title: 'Active Users',
            value: stats?.activeUsers ?? 0,
            icon: Activity,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            trend: '+5%',
            trendUp: true,
        },
        {
            title: 'Total Appointments',
            value: stats?.appointments ?? 0,
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            trend: '+20%',
            trendUp: true,
        },
        {
            title: 'Completed Appointments',
            value: stats?.completedAppointments ?? 0,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            trend: '+18%',
            trendUp: true,
        },
        {
            title: 'Pending Approvals',
            value: (stats?.pendingHospitalApprovals ?? 0) + (stats?.pendingDoctorApprovals ?? 0),
            icon: AlertTriangle,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            trend: '-3%',
            trendUp: false,
        },
        {
            title: 'New Users This Month',
            value: stats?.newUsersThisMonth ?? 0,
            icon: TrendingUp,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            trend: '+25%',
            trendUp: true,
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
                        <p className="text-gray-600">Overview of your healthcare platform</p>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="border-gray-300 text-gray-700"
                        >
                            {refreshing ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Refresh
                        </Button>
                        <Button
                            onClick={exportReport}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-gray-600">Loading dashboard data...</div>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {statCards.map((card, index) => {
                                const IconComponent = card.icon;
                                return (
                                    <Card key={index} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600">{card.title}</p>
                                                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                                                    <div className="flex items-center mt-2">
                                                        {card.trendUp ? (
                                                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                                        ) : (
                                                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                                                        )}
                                                        <span className={`text-sm ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                                            {card.trend}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                                    <IconComponent className={`w-6 h-6 ${card.color}`} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Charts and Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Appointment Trends */}
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-gray-900">
                                        <BarChart3 className="w-5 h-5 mr-2" />
                                        Appointment Trends
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                                        <div className="text-center">
                                            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-600">Chart visualization would go here</p>
                                            <p className="text-sm text-gray-500">Integration with chart library needed</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Top Specializations */}
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-gray-900">
                                        <PieChart className="w-5 h-5 mr-2" />
                                        Top Specializations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {stats?.topSpecializations?.slice(0, 5).map((spec, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`w-3 h-3 rounded-full mr-3 ${index === 0 ? 'bg-blue-500' :
                                                            index === 1 ? 'bg-green-500' :
                                                                index === 2 ? 'bg-yellow-500' :
                                                                    index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                                                        }`} />
                                                    <span className="text-gray-900">{spec.name}</span>
                                                </div>
                                                <Badge className="bg-gray-100 text-gray-800">{spec.count}</Badge>
                                            </div>
                                        )) || (
                                                <div className="text-center py-8">
                                                    <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-gray-600">No specialization data available</p>
                                                </div>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity and Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Activity */}
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-gray-900">
                                        <Activity className="w-5 h-5 mr-2" />
                                        Recent Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {stats?.recentActivity?.slice(0, 5).map((activity) => (
                                            <div key={activity.id} className="flex items-start space-x-3">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-900">{activity.description}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )) || (
                                                <div className="text-center py-8">
                                                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-gray-600">No recent activity</p>
                                                </div>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card className="bg-white border border-gray-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-gray-900">
                                        <Eye className="w-5 h-5 mr-2" />
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <h4 className="font-medium text-yellow-900 mb-2">Review Pending Approvals</h4>
                                            <p className="text-sm text-yellow-700">
                                                {stats?.pendingDoctorApprovals ?? 0} doctors and {stats?.pendingHospitalApprovals ?? 0} hospitals awaiting approval
                                            </p>
                                            <Button size="sm" className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white">
                                                Review Now
                                            </Button>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <h4 className="font-medium text-blue-900 mb-2">Platform Overview</h4>
                                            <p className="text-sm text-blue-700">
                                                {stats?.doctors ?? 0} doctors serving {stats?.patients ?? 0} patients across {stats?.hospitals ?? 0} hospitals
                                            </p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                            <h4 className="font-medium text-green-900 mb-2">Appointment Activity</h4>
                                            <p className="text-sm text-green-700">
                                                {stats?.completedAppointments ?? 0} of {stats?.appointments ?? 0} appointments completed
                                            </p>
                                            <p className="text-xs text-green-600 mt-1">
                                                Completion rate: {stats?.appointments ? Math.round((stats.completedAppointments / stats.appointments) * 100) : 0}%
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}


