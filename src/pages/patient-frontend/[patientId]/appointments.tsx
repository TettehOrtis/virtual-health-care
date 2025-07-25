import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, CreditCard, Search, Download, FileText as FileIcon, Filter, ArrowLeft, Video, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Appointment {
    id: string;
    date: string;
    time?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELED';
    type?: 'VIDEO' | 'IN_PERSON';
    notes?: string;
    doctor: {
        id: string;
        specialization: string;
        user: {
            fullName: string;
        };
    };
}

const PatientAppointments = () => {
    const router = useRouter();
    const { patientId } = router.query;
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

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
        const fetchAppointments = async () => {
            if (!router.isReady) return;

            try {
                // Check for authentication token
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    console.error("No token found");
                    router.push('/login');
                    return;
                }

                // Fetch appointments
                const response = await fetch("/api/patients/appointments", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setAppointments(data);
                } else {
                    console.error("Failed to fetch appointments:", await response.text());
                    toast.error("Failed to load appointments");
                }
            } catch (error: any) {
                console.error("Error fetching appointments:", error);
                toast.error("An error occurred while fetching appointments");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [router.isReady, patientId, router]);

    // Filter appointments based on search term and status
    const filteredAppointments = appointments.filter(appointment => {
        const matchesSearch =
            appointment.doctor.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (appointment.notes || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === "all" ||
            appointment.status.toLowerCase() === statusFilter.toLowerCase() ||
            (statusFilter === "canceled" &&
                (appointment.status === "CANCELED" || appointment.status === "REJECTED"));

        return matchesSearch && matchesStatus;
    });

    // Add this function for status badge styling (similar to doctor page)
    const getStatusBadgeClasses = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return "bg-green-100 text-green-800";
            case 'CANCELED':
            case 'REJECTED':
                return "bg-red-100 text-red-800";
            case 'PENDING':
                return "bg-yellow-100 text-yellow-800";
            case 'APPROVED':
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Add this function to cancel appointments
    const handleCancelAppointment = async (appointmentId: string) => {
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const response = await fetch(`/api/patients/appointments?id=${appointmentId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                toast.success("Appointment cancelled successfully");
                // Update the local state
                setAppointments(prevAppointments =>
                    prevAppointments.map(apt =>
                        apt.id === appointmentId ? { ...apt, status: "CANCELED" } : apt
                    )
                );
            } else {
                toast.error("Failed to cancel appointment");
            }
        } catch (error) {
            console.error("Error cancelling appointment:", error);
            toast.error("An error occurred while cancelling the appointment");
        }
    };

    // Add a formatAppointmentTime function (similar to doctor page)
    const formatAppointmentTime = (dateString: string) => {
        const date = new Date(dateString);
        const startTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        // Calculate end time (30 min after start)
        const endDate = new Date(date);
        endDate.setMinutes(endDate.getMinutes() + 30);
        const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        return `${startTime} - ${endTime}`;
    };

    // Display loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading appointments...</p>
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
                            <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search appointments..."
                                        className="pl-10 w-full md:w-64 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    asChild
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Link href={`/patient-frontend/${patientId}/book-appointment`}>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Book Appointment
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-6">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="canceled">Canceled/Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Tabs defaultValue="item-1" className="w-full">
                            <TabsContent value="item-1">
                                {filteredAppointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {filteredAppointments.map((appointment) => (
                                            <div key={appointment.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                                                <div className="flex flex-col md:flex-row justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                            <Calendar className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-lg text-gray-900">Dr. {appointment.doctor.user.fullName}</h3>
                                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClasses(appointment.status)}`}>
                                                                    {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-600">{appointment.doctor.specialization}</p>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                                                <Calendar className="h-4 w-4" />
                                                                <span className="font-medium">{new Date(appointment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                
                                                                <span>{formatAppointmentTime(appointment.date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                {appointment.type === "VIDEO" ? (
                                                                    <>
                                                                        <Video className="h-4 w-4" />
                                                                        <span>Video Consultation</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Users className="h-4 w-4" />
                                                                        <span>In-person Visit</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {appointment.notes && (
                                                                <p className="mt-2 text-gray-500">
                                                                    <span className="font-medium">Notes:</span> {appointment.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 md:mt-0 flex flex-col gap-3">
                                                        {appointment.status === "PENDING" && (
                                                            <div className="bg-yellow-50 p-3 rounded-md text-yellow-800 text-sm mb-2">
                                                                <p className="font-medium">Awaiting Doctor's Approval</p>
                                                                <p>Your appointment is waiting for the doctor's confirmation.</p>
                                                            </div>
                                                        )}

                                                        {(appointment.status === "PENDING" || appointment.status === "APPROVED") && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-red-200 text-red-700 hover:bg-red-50"
                                                                onClick={() => handleCancelAppointment(appointment.id)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        )}

                                                        {appointment.status === "APPROVED" && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                            >
                                                                <Video className="h-4 w-4 mr-2" />
                                                                Join Consultation
                                                            </Button>
                                                        )}

                                                        {appointment.status === "COMPLETED" && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-gray-200 text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download Summary
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
                                        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-xl font-medium mb-2 text-gray-900">No past appointments</h3>
                                        <p className="text-gray-600 mb-6">
                                            {searchTerm || statusFilter !== 'all'
                                                ? "No appointments match your search criteria."
                                                : "You don't have any past appointments in your records."}
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSearchTerm("");
                                                setStatusFilter("all");
                                            }}
                                            className={searchTerm || statusFilter !== 'all' ? "" : "hidden"}
                                        >
                                            Clear Filters
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

export default PatientAppointments;
