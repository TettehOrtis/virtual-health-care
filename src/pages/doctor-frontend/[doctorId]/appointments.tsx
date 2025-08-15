import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, CreditCard, Search, Download, FileText as FileIcon, Filter, ArrowLeft, Video, Users, Clock } from "lucide-react";
import VideoConsultationButton from "@/components/video/VideoConsultationButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { formatDistance } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import RescheduleAppointment from "@/components/appointment/reschedule";

interface Appointment {
    id: string;
    date: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELED';
    type?: 'IN_PERSON' | 'ONLINE' | 'VIDEO_CALL';
    notes?: string;
    patientId: string;
    doctorId: string;
    patient: {
        id: string;
        user: {
            fullName: string;
        };
    };
}

const DoctorAppointments = () => {
    const router = useRouter();
    const { doctorId } = router.query;
    const [appointmentTab, setAppointmentTab] = useState("today");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

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
        // Fetch appointment data from the API
        const fetchAppointments = async () => {
            if (!router.isReady) return;

            try {
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await fetch("/api/doctors/appointments", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setAppointments(data);
                } else {
                    toast.error("Failed to fetch appointments.");
                }
            } catch (error) {
                toast.error("An error occurred while fetching appointments.");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [router.isReady, doctorId, router]);

    const formatAppointmentDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if it's today
        if (date.toDateString() === today.toDateString()) {
            return "Today";
        }

        // Check if it's tomorrow
        if (date.toDateString() === tomorrow.toDateString()) {
            return "Tomorrow";
        }

        // Otherwise, return formatted date
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatAppointmentTime = (dateString: string) => {
        const date = new Date(dateString);
        const startTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        // Calculate end time (30 min after start)
        const endDate = new Date(date);
        endDate.setMinutes(endDate.getMinutes() + 30);
        const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        return `${startTime} - ${endTime}`;
    };

    // Filter and categorize appointments
    const getTodayAppointments = () => {
        const today = new Date().toDateString();
        return appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.date).toDateString();
            return appointmentDate === today &&
                (appointment.status === 'PENDING' || appointment.status === 'APPROVED');
        });
    };

    const getUpcomingAppointments = () => {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        return appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            return appointmentDate > today &&
                (appointment.status === 'PENDING' || appointment.status === 'APPROVED');
        });
    };

    const getPastAppointments = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        return appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            return appointmentDate < today ||
                (appointment.status === 'COMPLETED' || appointment.status === 'CANCELED' || appointment.status === 'REJECTED');
        });
    };

    // Filter appointments based on search and filters
    const filterAppointments = (appointments: Appointment[]) => {
        return appointments.filter(appointment => {
            // Search filter
            const matchesSearch = appointment.patient.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const statusMap: Record<string, string[]> = {
                "all": ["PENDING", "APPROVED", "COMPLETED", "CANCELED", "REJECTED"],
                "upcoming": ["PENDING", "APPROVED"],
                "completed": ["COMPLETED"],
                "canceled": ["CANCELED", "REJECTED"]
            };

            const matchesStatus = statusMap[filterStatus]?.includes(appointment.status) ?? true;

            // Type filter (default to IN_PERSON if not specified)
            const matchesType = filterType === "all" ||
                appointment.type?.toLowerCase() === filterType ||
                (filterType === "in-person" && (!appointment.type || appointment.type === "IN_PERSON"));

            return matchesSearch && matchesStatus && matchesType;
        });
    };

    const todayAppointments = filterAppointments(getTodayAppointments());
    const upcomingAppointments = filterAppointments(getUpcomingAppointments());
    const pastAppointments = filterAppointments(getPastAppointments());

    const handleStartSession = async (appointmentId: string) => {
        // Would typically initialize a video session or prepare the consultation
        toast.info(`Starting session for appointment ${appointmentId}`);
    };

    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

    const handleReschedule = async (appointment: any) => {
        setSelectedAppointment(appointment);
        setIsRescheduleModalOpen(true);
    };

    const handleRescheduleConfirm = async (newDate: string, type: "VIDEO" | "IN_PERSON") => {
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const response = await fetch("/api/doctors/appointments", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: selectedAppointment?.id,
                    date: newDate,
                    type,
                    status: "PENDING"  // Reset to pending for rescheduling
                }),
            });

            if (response.ok) {
                toast.success("Appointment rescheduled successfully.");
                // Update local state
                setAppointments(prevAppointments =>
                    prevAppointments.map(apt =>
                        apt.id === selectedAppointment?.id ? {
                            ...apt,
                            date: newDate,
                            type,
                            status: "PENDING" as any
                        } : apt
                    )
                );
                setIsRescheduleModalOpen(false);
            } else {
                toast.error("Failed to reschedule appointment.");
            }
        } catch (error) {
            toast.error("An error occurred while rescheduling appointment.");
        }
    };

    const handleUpdateStatus = async (appointmentId: string, status: string) => {
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const response = await fetch("/api/doctors/appointments", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: appointmentId,
                    status
                }),
            });

            if (response.ok) {
                toast.success(`Appointment ${status.toLowerCase()} successfully.`);
                // Update the local state to reflect changes
                setAppointments(prevAppointments =>
                    prevAppointments.map(apt =>
                        apt.id === appointmentId ? { ...apt, status: status as any } : apt
                    )
                );
            } else {
                toast.error("Failed to update appointment status.");
            }
        } catch (error) {
            toast.error("An error occurred while updating the appointment.");
        }
    };

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

    // Add this function to highlight pending appointments
    const getTodayPendingCount = () => {
        return todayAppointments.filter(apt => apt.status === "PENDING").length;
    };

    const getUpcomingPendingCount = () => {
        return upcomingAppointments.filter(apt => apt.status === "PENDING").length;
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-80px)]">
                <DashboardSidebar items={sidebarItems} />

                <div className="flex-1 overflow-auto bg-gray-50 p-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-lg shadow-sm">
                            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                asChild
                            >
                                <a href={`/doctor-frontend/${doctorId}/schedule`}>Manage Schedule</a>
                            </Button>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-700 border border-blue-200">
                            <p className="mb-1 font-medium">Appointment Management</p>
                            <p>New appointments scheduled by patients will appear as "Pending" until you accept or decline them. Once accepted, you can start consultations, reschedule, or cancel appointments if needed.</p>
                        </div>

                        <div className="mb-6 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search patient name"
                                    className="pl-9 text-gray-900 placeholder-gray-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[180px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Status" className="text-gray-900" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-gray-900">All Statuses</SelectItem>
                                        <SelectItem value="upcoming" className="text-gray-900">Upcoming</SelectItem>
                                        <SelectItem value="completed" className="text-gray-900">Completed</SelectItem>
                                        <SelectItem value="canceled" className="text-gray-900">Canceled</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-[180px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Type" className="text-gray-900" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-gray-900">All Types</SelectItem>
                                        <SelectItem value="video" className="text-gray-900">Video</SelectItem>
                                        <SelectItem value="in-person" className="text-gray-900">In-person</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <Tabs value={appointmentTab} onValueChange={setAppointmentTab}>
                                <TabsList className="mb-6">
                                    <TabsTrigger value="today" className="relative">
                                        Today ({todayAppointments.length})
                                        {getTodayPendingCount() > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {getTodayPendingCount()}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="upcoming" className="relative">
                                        Upcoming ({upcomingAppointments.length})
                                        {getUpcomingPendingCount() > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {getUpcomingPendingCount()}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="past">
                                        Past ({pastAppointments.length})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="today">
                                    {todayAppointments.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {todayAppointments.map((appointment) => (
                                                <div key={appointment.id} className="border rounded-lg overflow-hidden">
                                                    <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
                                                                {appointment.patient.user.fullName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{appointment.patient.user.fullName}</h4>
                                                                <p className="text-sm text-gray-600">Patient ID: {appointment.patient.id}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClasses(appointment.status)}`}>
                                                                {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-white">
                                                        <div className="flex flex-col gap-2 mb-4">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Calendar className="h-4 w-4" />
                                                                <span className="font-medium">{formatAppointmentDate(appointment.date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Clock className="h-4 w-4" />
                                                                <span>{formatAppointmentTime(appointment.date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                {appointment.type === "VIDEO_CALL" ? (
                                                                    <>
                                                                        <Video className="h-4 w-4" />
                                                                        <span>Video Consultation</span>
                                                                    </>
                                                                ) : appointment.type === "ONLINE" ? (
                                                                    <>
                                                                        <Video className="h-4 w-4" />
                                                                        <span>Online Consultation</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Users className="h-4 w-4" />
                                                                        <span>In-person Visit</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            {appointment.status === "PENDING" && (
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                                        onClick={() => handleUpdateStatus(appointment.id, 'APPROVED')}
                                                                    >
                                                                        Accept
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="text-red-600 hover:text-red-700 border-red-200"
                                                                        onClick={() => handleUpdateStatus(appointment.id, 'REJECTED')}
                                                                    >
                                                                        Decline
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            {appointment.status === "APPROVED" && (
                                                                <div className="flex gap-2">
                                                                    {appointment.type === "VIDEO_CALL" && (
                                                                        <VideoConsultationButton
                                                                            appointmentId={appointment.id}
                                                                            appointmentType={appointment.type}
                                                                            appointmentStatus={appointment.status}
                                                                            userRole="DOCTOR"
                                                                        />
                                                                    )}
                                                                    <Button
                                                                        variant="outline"
                                                                        className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                                                        onClick={() => handleUpdateStatus(appointment.id, 'COMPLETED')}
                                                                    >
                                                                        Complete
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="text-gray-700 hover:text-gray-900"
                                                                        onClick={() => handleReschedule(appointment.id)}
                                                                    >
                                                                        Reset for Rescheduling
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-gray-500">No appointments scheduled for today.</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="upcoming">
                                    {upcomingAppointments.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {upcomingAppointments.map((appointment) => (
                                                <div key={appointment.id} className="border rounded-lg overflow-hidden">
                                                    <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
                                                                {appointment.patient.user.fullName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{appointment.patient.user.fullName}</h4>
                                                                <p className="text-sm text-gray-600">Patient ID: {appointment.patient.id}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClasses(appointment.status)}`}>
                                                                {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-white">
                                                        <div className="flex flex-col gap-2 mb-4">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Calendar className="h-4 w-4" />
                                                                <span className="font-medium">{formatAppointmentDate(appointment.date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Clock className="h-4 w-4" />
                                                                <span>{formatAppointmentTime(appointment.date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                {appointment.type === "VIDEO_CALL" ? (
                                                                    <>
                                                                        <Video className="h-4 w-4" />
                                                                        <span>Video Consultation</span>
                                                                    </>
                                                                ) : appointment.type === "ONLINE" ? (
                                                                    <>
                                                                        <Video className="h-4 w-4" />
                                                                        <span>Online Consultation</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Users className="h-4 w-4" />
                                                                        <span>In-person Visit</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {appointment.notes && (
                                                                <div className="text-sm text-gray-600 mt-2">
                                                                    <p className="font-medium">Notes:</p>
                                                                    <p>{appointment.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-2">
                                                            {appointment.status === 'PENDING' && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                                                        onClick={() => handleUpdateStatus(appointment.id, 'APPROVED')}
                                                                    >
                                                                        Accept
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                                                        onClick={() => handleUpdateStatus(appointment.id, 'REJECTED')}
                                                                    >
                                                                        Decline
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {appointment.status === 'APPROVED' && (
                                                                <>
                                                                    {appointment.type === "VIDEO_CALL" && (
                                                                        <VideoConsultationButton
                                                                            appointmentId={appointment.id}
                                                                            appointmentType={appointment.type}
                                                                            appointmentStatus={appointment.status}
                                                                            userRole="DOCTOR"
                                                                        />
                                                                    )}
                                                                    <Button
                                                                        variant="outline"
                                                                        className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                                                        onClick={() => handleUpdateStatus(appointment.id, 'COMPLETED')}
                                                                    >
                                                                        Complete
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="text-gray-700 hover:text-gray-900"
                                                                        onClick={() => handleReschedule(appointment)}
                                                                    >
                                                                        Reschedule
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-gray-500">No upcoming appointments found.</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="past">
                                    {pastAppointments.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {pastAppointments.map((appointment) => (
                                                <div key={appointment.id} className="border rounded-lg overflow-hidden">
                                                    <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
                                                                {appointment.patient.user.fullName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{appointment.patient.user.fullName}</h4>
                                                                <p className="text-sm text-gray-600">Patient ID: {appointment.patient.id}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClasses(appointment.status)}`}>
                                                                {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-white">
                                                        <div className="flex flex-col gap-2 mb-4">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Calendar className="h-4 w-4" />
                                                                <span className="font-medium">{formatAppointmentDate(appointment.date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Clock className="h-4 w-4" />
                                                                <span>{formatAppointmentTime(appointment.date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                {appointment.type === "VIDEO_CALL" ? (
                                                                    <>
                                                                        <Video className="h-4 w-4" />
                                                                        <span>Video Consultation</span>
                                                                    </>
                                                                ) : appointment.type === "ONLINE" ? (
                                                                    <>
                                                                        <Video className="h-4 w-4" />
                                                                        <span>Online Consultation</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Users className="h-4 w-4" />
                                                                        <span>In-person Visit</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                className="text-gray-700 hover:text-gray-900"
                                                                asChild
                                                            >
                                                                <a href={`/doctor-frontend/${doctorId}/patients/${appointment.patient.id}`}>
                                                                    View Patient
                                                                </a>
                                                            </Button>
                                                            {appointment.status === "COMPLETED" && (
                                                                <Button
                                                                    variant="outline"
                                                                    className="text-blue-600 hover:text-blue-700"
                                                                    asChild
                                                                >
                                                                    <a href={`/doctor-frontend/${doctorId}/prescriptions/new?patientId=${appointment.patient.id}`}>
                                                                        Issue Prescription
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-gray-500">No past appointments found.</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
            {/* Reschedule Modal */}
            <RescheduleAppointment
                isOpen={isRescheduleModalOpen}
                onClose={() => setIsRescheduleModalOpen(false)}
                appointment={selectedAppointment}
                onReschedule={handleRescheduleConfirm}
            />

        </MainLayout>
    );
};

export default DoctorAppointments;