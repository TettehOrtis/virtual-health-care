import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, CreditCard, Search, MessageCircle, Download, FileText as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useSocket } from "@/lib/socket/socket";

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

const PatientPrescriptions = () => {
    const router = useRouter();
    const { patientId } = router.query;
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const socket = useSocket(`/api/socket?token=${localStorage.getItem('token') || sessionStorage.getItem('token')}`);

    useEffect(() => {
        if (socket && patientId) {
            socket.on('new_prescription', (event: MessageEvent<string>) => {
                const message = JSON.parse(event.data) as { data: Prescription };
                // Update prescriptions with new prescription
                setPrescriptions(prev => [
                    ...prev,
                    message.data
                ]);
            });
        }
    }, [socket, patientId]);

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

    useEffect(() => {
        const fetchPrescriptions = async () => {
            if (!router.isReady) return;

            try {
                // Check for authentication token
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    console.error("No token found");
                    router.push('/login');
                    return;
                }

                // Fetch prescriptions
                const response = await fetch("/api/patients/prescriptions", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setPrescriptions(data);
                } else {
                    console.error("Failed to fetch prescriptions:", await response.text());
                    toast.error("Failed to load prescriptions");
                }
            } catch (error: any) {
                console.error("Error fetching prescriptions:", error);
                toast.error("An error occurred while fetching prescriptions");
            } finally {
                setLoading(false);
            }
        };

        fetchPrescriptions();
    }, [router.isReady, patientId, router]);

    // Format date to a readable string
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    // Filter prescriptions based on search term
    const filteredPrescriptions = prescriptions.filter(prescription => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
            prescription.medication.toLowerCase().includes(searchTermLower) ||
            prescription.doctor.user.fullName.toLowerCase().includes(searchTermLower) ||
            prescription.doctor.specialization.toLowerCase().includes(searchTermLower) ||
            prescription.instructions.toLowerCase().includes(searchTermLower)
        );
    });

    // Sort prescriptions by date (newest first)
    const sortedPrescriptions = [...filteredPrescriptions].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Display loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading prescriptions...</p>
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-lg shadow-sm">
                            <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search prescriptions..."
                                    className="pl-10 w-full md:w-64 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {sortedPrescriptions.length > 0 ? (
                            <div className="space-y-4">
                                {sortedPrescriptions.map((prescription) => (
                                    <div key={prescription.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                                        <div className="flex flex-col md:flex-row justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <FileIcon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg text-gray-900">{prescription.medication}</h3>
                                                    <p className="text-gray-600">{prescription.dosage}</p>
                                                    <p className="mt-2 text-gray-500">
                                                        Prescribed by Dr. {prescription.doctor.user.fullName} ({prescription.doctor.specialization})
                                                    </p>
                                                    <p className="text-gray-500">
                                                        Issued on {formatDate(prescription.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 md:mt-0 flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    asChild
                                                >
                                                    <Link href={`/patient-frontend/${patientId}/prescriptions/${prescription.id}`}>
                                                        View Details
                                                    </Link>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <h4 className="text-sm font-medium text-gray-700 mb-1">Instructions:</h4>
                                            <p className="text-gray-600">{prescription.instructions}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
                                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-xl font-medium mb-2 text-gray-900">No prescriptions found</h3>
                                <p className="text-gray-600 mb-6">
                                    {searchTerm
                                        ? "No prescriptions match your search criteria."
                                        : "You don't have any prescriptions in your records."}
                                </p>
                                {searchTerm && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setSearchTerm("")}
                                    >
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PatientPrescriptions; 