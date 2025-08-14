import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, CreditCard, ArrowLeft, Download, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Prescription {
    id: string;
    medication: string;
    dosage: string;
    instructions: string;
    createdAt: string;
    doctor: {
        id: string;
        specialization: string;
        user: {
            fullName: string;
        };
    };
}

const PrescriptionDetail = () => {
    const router = useRouter();
    const { patientId, prescriptionId } = router.query;
    const [prescription, setPrescription] = useState<Prescription | null>(null);
    const [loading, setLoading] = useState(true);

    // Define sidebar items with the patientId in the paths
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
        const fetchPrescription = async () => {
            if (!router.isReady || !prescriptionId) return;

            try {
                // Check for authentication token
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    console.error("No token found");
                    router.push('/login');
                    return;
                }

                // Fetch individual prescription
                // Note: If you have an endpoint for single prescription, use that instead
                const response = await fetch("/api/patients/prescriptions", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    const foundPrescription = data.find((p: Prescription) => p.id === prescriptionId);

                    if (foundPrescription) {
                        setPrescription(foundPrescription);
                    } else {
                        toast.error("Prescription not found");
                        router.push(`/patient-frontend/${patientId}/prescriptions`);
                    }
                } else {
                    console.error("Failed to fetch prescription:", await response.text());
                    toast.error("Failed to load prescription details");
                }
            } catch (error: any) {
                console.error("Error fetching prescription:", error);
                toast.error("An error occurred while fetching prescription details");
            } finally {
                setLoading(false);
            }
        };

        fetchPrescription();
    }, [router.isReady, patientId, prescriptionId, router]);

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

    const handleDownload = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token || !prescriptionId) return;
            const res = await fetch(`/api/patients/prescriptions/pdf?id=${prescriptionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                toast.error('Failed to generate PDF');
                return;
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prescription-${prescriptionId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            toast.error('Download failed');
        }
    };

    // Display loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading prescription details...</p>
                </div>
            </div>
        );
    }

    if (!prescription) {
        return (
            <MainLayout>
                <div className="flex h-[calc(100vh-80px)]">
                    <DashboardSidebar items={sidebarItems} />
                    <div className="flex-1 overflow-auto bg-gray-50 p-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <h2 className="text-2xl font-bold mb-4 text-gray-900">Prescription Not Found</h2>
                                <p className="mb-6 text-gray-700 text-lg">The prescription you're looking for doesn't exist or has been removed.</p>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    asChild
                                >
                                    <Link href={`/patient-frontend/${patientId}/prescriptions`}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Prescriptions
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
                    <div className="max-w-4xl mx-auto space-y-6">
                        <Button
                            variant="outline"
                            className="mb-2 font-medium text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            asChild
                        >
                            <Link href={`/patient-frontend/${patientId}/prescriptions`}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Prescriptions
                            </Link>
                        </Button>

                        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <h1 className="text-2xl font-bold text-gray-900">Prescription Details</h1>
                                <Button
                                    variant="outline"
                                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                                    onClick={handleDownload}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Medication Information</h2>
                                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">Medication</h3>
                                            <p className="text-xl font-semibold text-gray-900">{prescription.medication}</p>
                                        </div>

                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">Dosage</h3>
                                            <p className="text-lg font-medium text-gray-900">{prescription.dosage}</p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-1">Instructions</h3>
                                            <p className="text-gray-800 whitespace-pre-line">{prescription.instructions}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescription Information</h2>

                                    <div className="space-y-4">
                                        <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src="" />
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                                                        {prescription.doctor.user.fullName.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm text-gray-500">Prescribed by</span>
                                                    </div>
                                                    <p className="font-medium text-gray-900">Dr. {prescription.doctor.user.fullName}</p>
                                                    <p className="text-sm text-gray-600">{prescription.doctor.specialization}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-500">Date Issued</span>
                                            </div>
                                            <p className="font-medium text-gray-900">{formatDate(prescription.createdAt)}</p>
                                        </div>

                                        <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm text-gray-500">Prescription ID</span>
                                            </div>
                                            <p className="font-medium text-gray-900">{prescription.id}</p>
                                        </div>

                                        <Button
                                            className="w-full mt-4"
                                            asChild
                                        >
                                            <Link href={`/patient-frontend/${patientId}/book-appointment?doctorId=${prescription.doctor.id}`}>
                                                Book Follow-up Appointment
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start gap-2">
                                <div className="bg-yellow-100 p-2 rounded-full">
                                    <FileText className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Important Note</h3>
                                    <p className="text-sm text-gray-600">
                                        Always follow the prescribed dosage and instructions. If you experience any adverse effects,
                                        contact your doctor immediately or seek emergency medical assistance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PrescriptionDetail; 