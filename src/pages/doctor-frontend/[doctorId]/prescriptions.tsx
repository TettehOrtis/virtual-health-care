import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, Users, Search, Plus, FileIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import Link from "next/link";

interface Patient {
    id: string;
    user: {
        fullName: string;
    };
}

interface Prescription {
    id: string;
    patientId: string;
    doctorId: string;
    medication: string;
    dosage: string;
    instructions: string;
    createdAt: string;
    patient?: Patient;
}

const DoctorPrescriptions = () => {
    const router = useRouter();
    const { doctorId } = router.query;
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Define sidebar items with the doctorId in the paths
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
        const fetchPrescriptions = async () => {
            if (!router.isReady) return;

            try {
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await fetch("/api/doctors/prescriptions", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setPrescriptions(data);
                } else {
                    toast.error("Failed to fetch prescriptions.");
                }
            } catch (error) {
                toast.error("An error occurred while fetching prescriptions.");
            } finally {
                setLoading(false);
            }
        };

        fetchPrescriptions();
    }, [router.isReady, doctorId, router]);

    // Format the date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Filter prescriptions based on search term
    const filteredPrescriptions = prescriptions.filter(prescription => {
        const matchesSearch =
            prescription.patient?.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prescription.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prescription.instructions.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-80px)]">
                <DashboardSidebar items={sidebarItems} />

                <div className="flex-1 overflow-auto bg-gray-50 p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm">
                            <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>

                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search prescriptions..."
                                        className="pl-10 w-full md:w-64"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                    asChild
                                >
                                    <Link href={`/doctor-frontend/${doctorId}/prescriptions/new`}>
                                        <Plus className="h-4 w-4" />
                                        New Prescription
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {filteredPrescriptions.length > 0 ? (
                            <div className="space-y-6">
                                {filteredPrescriptions.map((prescription) => (
                                    <div key={prescription.id} className="bg-white rounded-lg shadow-sm p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src="" />
                                                    <AvatarFallback className="bg-gray-200 text-gray-600">
                                                        {prescription.patient?.user.fullName.split(' ').map(n => n[0]).join('') || 'P'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-medium text-lg text-gray-900">
                                                        {prescription.patient?.user.fullName || 'Patient'}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        Prescription #{prescription.id.slice(0, 8)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500 mb-2">Medication</h4>
                                                <div className="flex items-start gap-2 border-l-2 border-blue-500 pl-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{prescription.medication}</p>
                                                        <p className="text-sm text-gray-600">{prescription.dosage}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500 mb-2">Instructions</h4>
                                                <p className="text-sm text-gray-700">{prescription.instructions}</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                                <div>
                                                    <p className="text-sm text-gray-500">Prescribed On</p>
                                                    <p className="font-medium text-gray-900">{formatDate(prescription.createdAt)}</p>
                                                </div>
                                                <div className="md:text-right">
                                                    <Button
                                                        variant="outline"
                                                        className="flex items-center gap-2"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link href={`/doctor-frontend/${doctorId}/prescriptions/${prescription.id}/print`}>
                                                            <Download className="h-4 w-4" />
                                                            Download PDF
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm">
                                <div className="text-center py-16">
                                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium mb-2 text-gray-900">No prescriptions found</h3>
                                    <p className="text-gray-500 mb-6">
                                        {searchTerm
                                            ? "No prescriptions match your search criteria. Try different keywords."
                                            : "You haven't created any prescriptions yet."}
                                    </p>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                        asChild
                                    >
                                        <Link href={`/doctor-frontend/${doctorId}/prescriptions/new`}>
                                            <Plus className="h-4 w-4" />
                                            Create New Prescription
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default DoctorPrescriptions; 