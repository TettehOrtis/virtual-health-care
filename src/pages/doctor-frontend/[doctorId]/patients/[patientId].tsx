import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, Users, ArrowLeft, Clock, Pill, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface User {
    supabaseId: string;
    fullName: string;
    email: string;
}

interface Appointment {
    id: string;
    date: string;
    status: string;
}

interface Prescription {
    id: string;
    medication: string;
    dosage: string;
    instructions: string;
    createdAt: string;
}

interface Patient {
    id: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    address: string;
    medicalHistory?: string;
    user: User;
    appointments: Appointment[];
    prescriptions: Prescription[];
}

const PatientDetails = () => {
    const router = useRouter();
    const { doctorId, patientId } = router.query;
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);

    const sidebarItems = [
        {
            title: 'Dashboard',
            href: `/doctor-frontend/${doctorId}/dashboard`,
            icon: LayoutDashboard,
        },
        {
            title: 'Appointments',
            href: `/doctor-frontend/${doctorId}/appointments`,
            icon: Calendar,
        },
        {
            href: `/doctor-frontend/${doctorId}/patients`,
            icon: Users,
            title: "My Patients",
        },
        {
            href: `/doctor-frontend/${doctorId}/prescriptions`,
            icon: FileText,
            title: "Prescriptions",
        },
        {
            href: `/doctor-frontend/${doctorId}/profile`,
            icon: UserCircle,
            title: "My Profile",
        }
    ];

    useEffect(() => {
        const fetchPatient = async () => {
            if (!router.isReady || !patientId) return;

            try {
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await fetch(`/api/doctors/patients/${patientId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setPatient(data);
                } else {
                    toast.error("Failed to fetch patient details.");
                }
            } catch (error) {
                toast.error("An error occurred while fetching patient details.");
            } finally {
                setLoading(false);
            }
        };

        fetchPatient();
    }, [router.isReady, patientId, router]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateAge = (dateOfBirth: string) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading patient details...</p>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <MainLayout>
                <div className="flex h-[calc(100vh-80px)]">
                    <DashboardSidebar items={sidebarItems} />
                    <div className="flex-1 overflow-auto bg-gray-50 p-8">
                        <div className="max-w-6xl mx-auto">
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <h2 className="text-2xl font-bold mb-4 text-gray-900">Patient Not Found</h2>
                                <p className="mb-6 text-gray-700 text-lg">The patient you're looking for doesn't exist or you don't have permission to view this patient.</p>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    asChild
                                >
                                    <Link href={`/doctor-frontend/${doctorId}/patients`}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Patients
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-80px)]">
                <DashboardSidebar items={sidebarItems} />

                <div className="flex-1 overflow-auto bg-gray-50 p-8">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <Button
                            variant="outline"
                            className="mb-2 font-medium text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            asChild
                        >
                            <Link href={`/doctor-frontend/${doctorId}/patients`}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Patients
                            </Link>
                        </Button>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <Avatar className="h-24 w-24 border-2 border-blue-100">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                                        {patient.user.fullName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{patient.user.fullName}</h1>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {calculateAge(patient.dateOfBirth)} years
                                        </span>
                                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {patient.gender}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Email</h3>
                                            <p className="text-gray-900 font-medium">{patient.user.email}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</h3>
                                            <p className="text-gray-900 font-medium">{patient.phone || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</h3>
                                            <p className="text-gray-900 font-medium">{formatDate(patient.dateOfBirth)}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</h3>
                                            <p className="text-gray-900 font-medium">{patient.address || "Not provided"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="medical-history" className="space-y-6">
                            <TabsList className="bg-white shadow-md rounded-md border border-gray-200 p-1">
                                <TabsTrigger
                                    value="medical-history"
                                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-base px-4 py-2"
                                >
                                    Medical History
                                </TabsTrigger>
                                <TabsTrigger
                                    value="appointments"
                                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-base px-4 py-2"
                                >
                                    Appointments
                                </TabsTrigger>
                                <TabsTrigger
                                    value="prescriptions"
                                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-base px-4 py-2"
                                >
                                    Prescriptions
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="medical-history" className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-3">Medical History</h2>
                                {patient.medicalHistory ? (
                                    <div className="bg-gray-50 p-4 rounded-md text-gray-800 whitespace-pre-line">
                                        {patient.medicalHistory}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-md">
                                        <p className="text-gray-500 italic font-medium">No medical history recorded for this patient.</p>
                                        <p className="text-gray-400 text-sm mt-1">You can add medical notes during appointments.</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="appointments" className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Appointment History</h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                        asChild
                                    >
                                        <Link href={`/doctor-frontend/${doctorId}/appointments?patient=${patient.id}`}>
                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                            View All Appointments
                                        </Link>
                                    </Button>
                                </div>

                                {patient.appointments && patient.appointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {patient.appointments.map(appointment => (
                                            <div key={appointment.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-5 w-5 text-blue-600" />
                                                        <span className="font-semibold text-lg text-gray-900">{formatDate(appointment.date)}</span>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                        appointment.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                                            appointment.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {appointment.status}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-600 hover:text-gray-900"
                                                    asChild
                                                >
                                                    <Link href={`/doctor-frontend/${doctorId}/appointments/${appointment.id}`}>
                                                        View Details
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-md">
                                        <p className="text-gray-500 italic font-medium">No appointments found for this patient.</p>
                                        <Button
                                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                                            asChild
                                        >
                                            <Link href={`/doctor-frontend/${doctorId}/appointments?new=true&patient=${patient.id}`}>
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Schedule Appointment
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="prescriptions" className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Prescription History</h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                        asChild
                                    >
                                        <Link href={`/doctor-frontend/${doctorId}/prescriptions?patient=${patient.id}`}>
                                            <FileText className="h-4 w-4 mr-2" />
                                            View All Prescriptions
                                        </Link>
                                    </Button>
                                </div>

                                {patient.prescriptions && patient.prescriptions.length > 0 ? (
                                    <div className="space-y-4">
                                        {patient.prescriptions.map(prescription => (
                                            <div key={prescription.id} className="border-l-4 border-green-500 bg-white rounded-md shadow-sm p-4">
                                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                                                    <div>
                                                        <div className="flex items-start gap-2 mb-2">
                                                            <Pill className="h-5 w-5 text-green-600 mt-1" />
                                                            <div>
                                                                <h3 className="font-semibold text-gray-900">{prescription.medication}</h3>
                                                                <p className="text-gray-800 font-medium">{prescription.dosage}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-gray-50 p-3 rounded-md mt-2">
                                                            <h4 className="text-sm font-semibold text-gray-600 mb-1">Instructions:</h4>
                                                            <p className="text-gray-800">{prescription.instructions}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-500 md:text-right">
                                                        <p>Prescribed on:</p>
                                                        <p className="font-medium text-gray-700">{formatDate(prescription.createdAt)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-md">
                                        <p className="text-gray-500 italic font-medium">No prescriptions found for this patient.</p>
                                        <Button
                                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                                            asChild
                                        >
                                            <Link href={`/doctor-frontend/${doctorId}/prescriptions/new?patient=${patient.id}`}>
                                                <FileText className="h-4 w-4 mr-2" />
                                                Create Prescription
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PatientDetails; 