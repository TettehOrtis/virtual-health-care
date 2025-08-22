import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/mainlayout';
import DashboardSidebar from '@/components/dashboard/dashboardsidebar';
import { CreditCard, LayoutDashboard, Calendar, FileText, UserCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    paystackRef?: string;
    createdAt: string;
}

const BillingPage = () => {
    const router = useRouter();
    const { patientId } = router.query;
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actualPatientId, setActualPatientId] = useState<string | null>(null);

    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);
            setError(null);

            try {
                // Get current user info from auth token
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (!token) {
                    setError('Authentication token not found');
                    return;
                }

                // Get current user info
                const userRes = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!userRes.ok) {
                    setError('Failed to get user info');
                    return;
                }

                const userData = await userRes.json();
                console.log('Current user data:', userData);

                // Use the patientId directly from user data
                if (!userData.patientId) {
                    setError('Patient record not found for this user');
                    return;
                }

                setActualPatientId(userData.patientId);

                // Now fetch payments using the correct patient ID
                const paymentsRes = await fetch(`/api/patients/${userData.patientId}/payments`);
                if (!paymentsRes.ok) {
                    throw new Error('Failed to fetch payments');
                }

                const paymentsData = await paymentsRes.json();
                setPayments(paymentsData.payments || []);

            } catch (err: any) {
                console.error('Error in fetchPayments:', err);
                setError(err.message || 'Error loading payments');
            } finally {
                setLoading(false);
            }
        };

        if (router.isReady) {
            fetchPayments();
        }
    }, [router.isReady]);

    const sidebarItems = [
        {
            href: `/patient-frontend/${patientId}/dashboard`,
            icon: LayoutDashboard,
            title: "Dashboard",
        },
        {
            href: `/patient-frontend/${patientId}/appointments`,
            icon: Calendar,
            title: "Appointments",
        },
        {
            href: `/patient-frontend/${patientId}/prescriptions`,
            icon: FileText,
            title: "Prescriptions",
        },
        {
            href: `/patient-frontend/${patientId}/medical-records`,
            icon: FileText,
            title: "Medical Records",
        },
        {
            href: `/patient-frontend/${patientId}/messages`,
            icon: MessageCircle,
            title: "Messages",
        },
        {
            href: `/patient-frontend/${patientId}/profile`,
            icon: UserCircle,
            title: "My Profile",
        },
        {
            href: `/patient-frontend/${patientId}/billing`,
            icon: CreditCard,
            title: "Billing",
        }
    ];

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-80px)]">
                <DashboardSidebar items={sidebarItems} />
                <div className="flex-1 overflow-auto bg-gray-50 p-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="h-6 w-6 text-blue-600" /> Billing & Payment History
                        </h1>

                        {loading ? (
                            <div className="text-gray-600">Loading payments...</div>
                        ) : error ? (
                            <div className="text-red-600">
                                <p className="mb-2">Error: {error}</p>
                                <p className="text-sm text-gray-600">
                                    URL patientId: {patientId}<br />
                                    Actual patientId: {actualPatientId || 'Not found'}
                                </p>
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-gray-600">No payments found.</div>
                        ) : (
                            <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-red-500 border-b">
                                            <th className="py-2 px-4 text-left ">Date</th>
                                            <th className="py-2 px-4 text-left">Amount</th>
                                            <th className="py-2 px-4 text-left">Status</th>
                                            <th className="py-2 px-4 text-left">Description</th>
                                            <th className="py-2 px-4 text-left">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((p) => (
                                            <tr key={p.id} className="border-b last:border-0 ">
                                                <td className="py-2 px-4 text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                                                <td className="py-2 px-4 text-slate-500">{p.currency} {Number(p.amount).toLocaleString()}</td>
                                                <td className="py-2 px-4 text-slate-950">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${p.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{p.status}</span>
                                                </td>
                                                <td className="py-2 px-4 text-slate-500">{p.description}</td>
                                                <td className="py-2 px-4 text-slate-500">{p.paystackRef || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default BillingPage;
