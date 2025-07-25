import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, CreditCard, ArrowLeft, Search, Filter, Clock, Video, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Doctor {
    id: string;
    specialization: string;
    user: {
        fullName: string;
    };
}

const BookAppointment = () => {
    const router = useRouter();
    const { patientId, doctorId: preselectedDoctorId } = router.query;
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [specialtyFilter, setSpecialtyFilter] = useState("all");
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [dateTime, setDateTime] = useState("");
    const [notes, setNotes] = useState("");
    const [bookingStep, setBookingStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [appointmentType, setAppointmentType] = useState<string>("IN_PERSON");

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
        const fetchDoctors = async () => {
            if (!router.isReady) return;

            try {
                // Check for authentication token
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    console.error("No token found");
                    router.push('/login');
                    return;
                }

                // Get the doctorId from query parameters
                const { doctorId: queriedDoctorId } = router.query;
                const selectedDoctorId = queriedDoctorId || preselectedDoctorId;

                // Fetch available doctors
                const response = await fetch("/api/doctors", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setDoctors(data);

                    // Extract unique specialties for filter with proper typing
                    const specializations = data.map((doctor: Doctor) => doctor.specialization || "");
                    const filteredSpecializations = specializations.filter((item: string) => item !== "");
                    const uniqueSpecialties = Array.from(new Set(filteredSpecializations)) as string[];
                    setSpecialties(uniqueSpecialties);

                    // If a doctorId was provided in the URL or props, preselect that doctor
                    if (selectedDoctorId && typeof selectedDoctorId === 'string') {
                        setSelectedDoctor(selectedDoctorId);

                        // If a doctor is preselected, move to step 2
                        setBookingStep(2);
                    }
                } else {
                    console.error("Failed to fetch doctors:", await response.text());
                    toast.error("Failed to load available doctors");
                }
            } catch (error: any) {
                console.error("Error fetching doctors:", error);
                toast.error("An error occurred while fetching doctors");
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, [router.isReady, patientId, router, preselectedDoctorId]);

    // Filter doctors based on search and specialty
    const filteredDoctors = doctors.filter(doctor => {
        const matchesSearch =
            doctor.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSpecialty =
            specialtyFilter === "all" ||
            doctor.specialization === specialtyFilter;

        return matchesSearch && matchesSpecialty;
    });

    // Handle doctor selection
    const handleDoctorSelect = (doctorId: string) => {
        setSelectedDoctor(doctorId);
        setBookingStep(2);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDoctor || !dateTime) {
            toast.error("Please select a doctor and appointment time");
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            if (!token) {
                toast.error("Authentication token not found");
                return;
            }

            // Create appointment
            const response = await fetch("/api/patients/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    doctorId: selectedDoctor,
                    date: dateTime,
                    notes,
                    type: appointmentType
                }),
            });

            if (response.ok) {
                toast.success("Appointment booked successfully");
                // Redirect to appointments page
                router.push(`/patient-frontend/${patientId}/appointments`);
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to book appointment");
            }
        } catch (error: any) {
            console.error("Error booking appointment:", error);
            toast.error("An error occurred while booking your appointment");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Display loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading doctors...</p>
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
                        <Button
                            variant="outline"
                            className="mb-6 font-medium text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            asChild
                        >
                            <Link href={`/patient-frontend/${patientId}/appointments`}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Appointments
                            </Link >
                        </Button >

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="mb-6 border-b border-gray-100 pb-4">
                                <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
                                <p className="text-gray-600 mt-1">Find a doctor and schedule your consultation</p>
                            </div>

                            {bookingStep === 1 ? (
                                <>
                                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Search by doctor name or specialty..."
                                                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <div className="w-full md:w-64">
                                            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                                                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                                    <SelectValue placeholder="Filter by specialty" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Specialties</SelectItem>
                                                    {specialties.map((specialty) => (
                                                        <SelectItem key={specialty} value={specialty}>
                                                            {specialty}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="w-full md:w-64">
                                            <Label htmlFor="appointment-type" className="text-gray-700 font-medium block mb-2">
                                                Appointment Type
                                            </Label>
                                            <Select defaultValue="IN_PERSON" onValueChange={(value) => setAppointmentType(value)}>
                                                <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                                    <SelectValue placeholder="Select appointment type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="IN_PERSON">In-person Visit</SelectItem>
                                                    <SelectItem value="ONLINE">Online Consultation</SelectItem>
                                                    <SelectItem value="VIDEO_CALL">Video Call Consultation</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Choose how you would like to meet with the doctor
                                            </p>
                                        </div>
                                    </div>

                                    {filteredDoctors.length > 0 ? (
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {filteredDoctors.map((doctor) => (
                                                <div
                                                    key={doctor.id}
                                                    className={`border ${selectedDoctor === doctor.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                                                        } rounded-lg p-5 cursor-pointer hover:border-blue-300 transition`}
                                                    onClick={() => handleDoctorSelect(doctor.id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-12 w-12">
                                                            <AvatarImage src="" />
                                                            <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                                                                {doctor.user.fullName.split(' ').map(n => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">Dr. {doctor.user.fullName}</h3>
                                                            <p className="text-sm text-gray-600">{doctor.specialization}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                                                        <span className="text-sm text-gray-500">Next available</span>
                                                        <span className="text-sm font-medium text-gray-800">Today, 2:00 PM</span>
                                                    </div>

                                                    <Button
                                                        className="w-full mt-4"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDoctorSelect(doctor.id);
                                                        }}
                                                    >
                                                        Select Doctor
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                            <h3 className="text-xl font-medium mb-2 text-gray-900">No doctors found</h3>
                                            <p className="text-gray-600 mb-6">
                                                Try adjusting your search or filter criteria
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setSpecialtyFilter("all");
                                                }}
                                            >
                                                Clear Filters
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    {selectedDoctor && (
                                        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Selected Doctor</h2>
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src="" />
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                                                        {doctors.find(d => d.id === selectedDoctor)?.user.fullName.split(' ').map(n => n[0]).join('') || 'DR'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        Dr. {doctors.find(d => d.id === selectedDoctor)?.user.fullName}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {doctors.find(d => d.id === selectedDoctor)?.specialization}
                                                    </p>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="ml-auto"
                                                    onClick={() => {
                                                        setBookingStep(1);
                                                        if (!preselectedDoctorId) {
                                                            setSelectedDoctor(null);
                                                        }
                                                    }}
                                                >
                                                    Change
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <div>
                                            <Label htmlFor="appointment-date" className="text-gray-700 font-medium block mb-2">
                                                Select Date and Time
                                            </Label>
                                            <Input
                                                id="appointment-date"
                                                type="datetime-local"
                                                required
                                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                value={dateTime}
                                                onChange={(e) => setDateTime(e.target.value)}
                                                min={new Date().toISOString().slice(0, 16)}
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                Please select your preferred date and time for the appointment
                                            </p>
                                        </div>

                                        <div>
                                            <Label htmlFor="notes" className="text-gray-700 font-medium block mb-2">
                                                Notes (Optional)
                                            </Label>
                                            <textarea
                                                id="notes"
                                                className="w-full border text-gray-700 border-gray-300 rounded-md p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                rows={4}
                                                placeholder="Describe your symptoms or reason for the appointment..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="appointment-type" className="text-gray-700 font-medium block mb-2">
                                                Appointment Type
                                            </Label>

                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <h3 className="font-semibold text-gray-900 mb-2">Appointment Information</h3>
                                            <ul className="space-y-2">
                                                <li className="flex justify-between">
                                                    <span className="text-gray-600">Consultation Fee</span>
                                                    <span className="font-medium text-gray-900">$50.00</span>
                                                </li>
                                                <li className="flex justify-between">
                                                    <span className="text-gray-600">Duration</span>
                                                    <span className="font-medium text-gray-900">30 minutes</span>
                                                </li>
                                            </ul>
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <p className="text-sm text-gray-600">
                                                    Payment will be processed after the appointment is confirmed by the doctor.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row justify-end gap-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={isSubmitting}
                                                onClick={() => setBookingStep(1)}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting || !dateTime}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    "Book Appointment"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                </form>
                            )}
                        </div>
                    </div >
                </div >
            </div >
        </MainLayout >
    );
};

export default BookAppointment; 