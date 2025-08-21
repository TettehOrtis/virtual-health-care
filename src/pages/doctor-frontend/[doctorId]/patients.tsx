import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, Users, Search, Filter, ArrowUpDown,MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

interface Patient {
    id: string;
    user: {
        fullName: string;
        email: string;
    };
    dateOfBirth?: string;
    gender?: string;
    bloodType?: string;
    phoneNumber?: string;  // This maps to 'phone' in the schema
    address?: string;
    status?: string;
    medicalConditions?: string[];
    lastVisitDate?: string | null;
}

const DoctorPatients = () => {
    const router = useRouter();
    const { doctorId } = router.query;
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

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
          href: `/doctor-frontend/${doctorId}/documents`,
          icon: FileText,
          title: "Documents",
        },
        {
          href: `/doctor-frontend/${doctorId}/messages`,
          icon: MessageCircle,
          title: "Messages",
        },
        {
          href: `/doctor-frontend/${doctorId}/profile`,
          icon: UserCircle,
          title: "My Profile",
        }
      ];

    useEffect(() => {
        const fetchPatients = async () => {
            if (!router.isReady) return;

            try {
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await fetch("/api/doctors/patients/all", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setPatients(data);
                } else {
                    toast.error("Failed to fetch patients.");
                }
            } catch (error) {
                toast.error("An error occurred while fetching patients.");
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [router.isReady, doctorId, router]);

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth?: string) => {
        if (!dateOfBirth) return "N/A";

        const dob = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDifference = today.getMonth() - dob.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        return age;
    };

    // Format the last visit date
    const formatLastVisitDate = (lastVisitDate?: string | null) => {
        if (!lastVisitDate) return "N/A";

        const date = new Date(lastVisitDate);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Filter patients based on search term and status filter
    const filteredPatients = patients.filter(patient => {
        const matchesSearch =
            patient.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (patient.medicalConditions?.some(condition =>
                condition.toLowerCase().includes(searchTerm.toLowerCase())
            ) ?? false);

        const matchesStatus =
            statusFilter === "all" ||
            (patient.status?.toLowerCase() === statusFilter.toLowerCase());

        return matchesSearch && matchesStatus;
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-lg shadow-sm">
                            <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>

                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search patients..."
                                        className="pl-10 w-full md:w-64 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[160px] border-gray-300">
                                            <span className="flex items-center gap-2">
                                                <Filter className="h-4 w-4 text-gray-500" />
                                                <span className="text-gray-700 font-medium">Status:</span>
                                            </span>
                                            <SelectValue placeholder="All" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {filteredPatients.length > 0 ? (
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 text-left">
                                            <tr>
                                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                                    <div className="flex items-center gap-1">
                                                        Patient
                                                        <ArrowUpDown className="h-3 w-3" />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                                    <div className="flex items-center gap-1">
                                                        Age/Sex
                                                        <ArrowUpDown className="h-3 w-3" />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                                    <div className="flex items-center gap-1">
                                                        Contact
                                                        <ArrowUpDown className="h-3 w-3" />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                                                    <div className="flex items-center gap-1">
                                                        Last Visit
                                                        <ArrowUpDown className="h-3 w-3" />
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredPatients.map((patient) => (
                                                <tr key={patient.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarImage src="" />
                                                                <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                                                                    {patient.user.fullName.split(' ').map(n => n[0]).join('')}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{patient.user.fullName}</p>
                                                                <p className="text-sm text-gray-600">
                                                                    {patient.medicalConditions && patient.medicalConditions.length > 0
                                                                        ? patient.medicalConditions.join(', ')
                                                                        : 'No conditions listed'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="font-medium text-gray-800">{calculateAge(patient.dateOfBirth)}</span>
                                                        <span className="text-gray-600"> / </span>
                                                        <span className="font-medium text-gray-800">{patient.gender || "N/A"}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p className="font-medium text-gray-800">{patient.phoneNumber || "N/A"}</p>
                                                        <p className="text-sm text-gray-600">{patient.user.email}</p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p className={`font-medium ${patient.lastVisitDate ? 'text-gray-800' : 'text-gray-500 italic'}`}>
                                                            {formatLastVisitDate(patient.lastVisitDate)}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-white bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                                                                asChild
                                                            >
                                                                <Link href={`/doctor-frontend/${doctorId}/patients/${patient.id}`}>
                                                                    View Details
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-gray-700 border-gray-300 hover:bg-gray-50"
                                                                asChild
                                                            >
                                                                <Link href={`/doctor-frontend/${doctorId}/appointments?patient=${patient.id}`}>
                                                                    View Appointments
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm">
                                <div className="text-center py-16">
                                    <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-xl font-medium mb-3 text-gray-900">No patients found</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        {searchTerm
                                            ? "No patients match your search criteria. Try different keywords."
                                            : "You don't have any patients yet."}
                                    </p>
                                    {searchTerm && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setSearchTerm("")}
                                            className="mx-auto"
                                        >
                                            Clear Search
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default DoctorPatients;