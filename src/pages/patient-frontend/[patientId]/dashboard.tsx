import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, CreditCard, ActivitySquare, Pill, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * Interfaces for type safety
 */
interface Appointment {
    id: string;
    date: string;
    status: string;
    doctor: {
        id: string;
        specialization: string;
        user: {
            fullName: string;
        };
    };
}

interface Prescription {
    id: string;
    medication: string;
    dosage: string;
    createdAt: string;
    doctor: {
        user: {
            fullName: string;
        };
    };
}

interface PatientData {
    fullName: string;
    email: string;
    dateOfBirth?: string;
    healthScore?: number;
}

interface SidebarItem {
    href: string;
    icon: LucideIcon;
    title: string;
}

const PatientDashboard = () => {
    const router = useRouter();
    const { patientId } = router.query;
    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [appointmentTab, setAppointmentTab] = useState("upcoming");
    const [userName, setUserName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    // Define sidebar items with the patientId in the paths
    const sidebarItems: SidebarItem[] = [
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

    useEffect(() => {
        const fetchData = async () => {
            if (!router.isReady) return;

            try {
                // Check for authentication token
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    console.error("No token found");
                    router.push('/login');
                    return;
                }

                // If patientId is missing, get it from the profile
                if (!patientId) {
                    try {
                        const profileResponse = await fetch("/api/patients/profile", {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });

                        if (profileResponse.ok) {
                            const profileData = await profileResponse.json();
                            // Redirect to the proper URL with the correct patientId
                            if (profileData.id) {
                                router.replace(`/patient-frontend/${profileData.id}/dashboard`);
                                return; // Stop further execution until redirect completes
                            }
                        } else {
                            console.error("Failed to fetch patient profile:", await profileResponse.text());
                            // If we can't get the profile, redirect to login
                            router.push('/login');
                            return;
                        }
                    } catch (profileError: any) {
                        console.error("Error fetching patient profile:", profileError);
                        router.push('/login');
                        return;
                    }
                }

                // Fetch user data
                try {
                    const userResponse = await fetch("/api/auth/me", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        setUserName(userData.fullName);
                        if (userData.avatar) {
                            setAvatarUrl(userData.avatar);
                        }
                    } else {
                        console.error("Failed to fetch user data:", await userResponse.text());
                    }
                } catch (userError: any) {
                    console.error("Error fetching user data:", userError);
                }

                // Fetch patient data
                const profileResponse = await fetch("/api/patients/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    setPatientData(profileData);
                } else {
                    console.error("Failed to fetch patient profile:", await profileResponse.text());
                    toast.error("Failed to load patient data");
                }

                // Fetch appointments with proper error handling
                const appointmentsResponse = await fetch("/api/patients/appointments", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (appointmentsResponse.ok) {
                    const appointmentsData = await appointmentsResponse.json();
                    setAppointments(appointmentsData);
                } else {
                    const errorText = await appointmentsResponse.text();
                    console.error("Failed to fetch appointments:", errorText);
                    toast.error("Failed to fetch appointments");
                }

                // Fetch prescriptions with proper error handling
                const prescriptionsResponse = await fetch("/api/patients/prescriptions", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (prescriptionsResponse.ok) {
                    const prescriptionsData = await prescriptionsResponse.json();
                    setPrescriptions(prescriptionsData);
                } else {
                    console.error("Failed to fetch prescriptions:", await prescriptionsResponse.text());
                    toast.error("Failed to fetch prescriptions");
                }

            } catch (error: any) {
                console.error("Error fetching dashboard data:", error);
                setError(error instanceof Error ? error.message : "An error occurred while fetching data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router.isReady, patientId, router]);

    // Format date to a readable string
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const currentDate = new Date();
    const upcomingAppointments = appointments.filter(
        (appointment) => new Date(appointment.date) >= currentDate
    );
    const pastAppointments = appointments.filter(
        (appointment) => new Date(appointment.date) < currentDate
    );

    // Get upcoming appointments (sorted by date)
    const upcomingAppointmentsSorted = [...upcomingAppointments]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get recent prescriptions
    const recentPrescriptions = [...prescriptions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

    // Calculate completed appointments
    const completedAppointments = appointments.filter(appointment =>
        appointment.status === 'completed'
    ).length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                    <p className="text-red-500 font-medium mb-2">Error loading dashboard</p>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => router.reload()}>Try Again</Button>
                </div>
            </div>
        );
    }

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-80px)]">
                <DashboardSidebar items={sidebarItems} />
                <div className="flex-1 overflow-auto bg-gray-50 p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Welcome, {patientData?.fullName}</h1>
                            <p className="text-gray-600 mt-1">Here's an overview of your health and upcoming appointments</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold">Upcoming Appointments</CardTitle>
                                    <CardDescription>Your next scheduled visits</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-600">{upcomingAppointmentsSorted.length}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold">Consultations</CardTitle>
                                    <CardDescription>Total completed consultations</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-emerald-600">{completedAppointments}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold">Health Score</CardTitle>
                                    <CardDescription>Your current health index</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-amber-600">{patientData?.healthScore || 'N/A'}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
                                    <Button variant="outline" asChild>
                                        <Link href={`/patient-frontend/${patientId}/appointments`}>
                                            View All
                                        </Link>
                                    </Button>
                                </div>

                                {upcomingAppointmentsSorted.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcomingAppointmentsSorted.map((appointment) => (
                                            <div
                                                key={appointment.id}
                                                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">Dr. {appointment.doctor.user.fullName}</h3>
                                                        <p className="text-sm text-gray-600">{appointment.doctor.specialization}</p>
                                                    </div>

                                                    <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                        {appointment.status}
                                                    </div>
                                                </div>

                                                <div className="flex items-center mt-3 text-gray-700">
                                                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                                    <span>{formatDate(appointment.date)}</span>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-sm"
                                                        asChild
                                                    >
                                                        <Link href={`/patient-frontend/${patientId}/appointments/${appointment.id}`}>
                                                            View Details
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
                                        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium mb-2 text-gray-900">No upcoming appointments</h3>
                                        <p className="text-gray-600 mb-6">
                                            Schedule a consultation with one of our healthcare professionals
                                        </p>
                                        <Button asChild>
                                            <Link href={`/patient-frontend/${patientId}/book-appointment`}>
                                                Book Appointment
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-xl font-semibold text-gray-900">Recent Prescriptions</h2>
                                    <Button variant="outline" asChild>
                                        <Link href={`/patient-frontend/${patientId}/prescriptions`}>
                                            View All
                                        </Link>
                                    </Button>
                                </div>

                                {recentPrescriptions.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentPrescriptions.map((prescription) => (
                                            <div
                                                key={prescription.id}
                                                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                                                        <Pill className="h-5 w-5" />
                                                    </div>

                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900">{prescription.medication}</h3>
                                                        <p className="text-sm text-gray-600">{prescription.dosage}</p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Prescribed by Dr. {prescription.doctor.user.fullName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatDate(prescription.createdAt)}
                                                        </p>
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-sm"
                                                        asChild
                                                    >
                                                        <Link href={`/patient-frontend/${patientId}/prescriptions/${prescription.id}`}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
                                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium mb-2 text-gray-900">No prescriptions</h3>
                                        <p className="text-gray-600">
                                            You don't have any prescriptions in your records yet
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                    <ActivitySquare className="h-6 w-6" />
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900">Health Monitoring</h3>
                                    <p className="text-gray-600">
                                        Track your health metrics and get personalized insights
                                    </p>
                                </div>

                                <Button className="ml-auto" asChild>
                                    <Link href={`/patient-frontend/${patientId}/health-monitor`}>
                                        View Health Dashboard
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PatientDashboard; 