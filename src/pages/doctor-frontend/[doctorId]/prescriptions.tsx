import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, Users, Search, Plus, FileIcon, Download ,MessageCircle} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

interface User {
  id: string;
  fullName: string;
  image?: string;
}

interface Patient {
  id: string;
  user: User;
  fullName: string;
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
  patientName?: string;
}

const DoctorPrescriptions = () => {
  const router = useRouter();
  const { doctorId } = router.query;
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);

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
          setPrescriptions(data as Prescription[]);
          
          // Extract unique patients from prescriptions
          const uniquePatients = [...new Map(data.map((p: Prescription) => [p.patientId, p.patient])).values()];
          setPatients(uniquePatients as Patient[]);
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch prescriptions");
          toast.error(errorData.message || "Failed to fetch prescriptions");
        }
      } catch (error) {
        setError("An error occurred while fetching prescriptions");
        toast.error("An error occurred while fetching prescriptions");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [router.isReady, doctorId, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <MainLayout>
        <DashboardSidebar items={sidebarItems} />
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-red-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch =
      prescription.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.instructions.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPatient = !selectedPatientId || prescription.patientId === selectedPatientId;

    return matchesSearch && matchesPatient;
  });

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

                <Select
                  value={selectedPatientId}
                  onValueChange={(value) => setSelectedPatientId(value === "all" ? undefined : value)}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Select patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  asChild
                >
                  <Link href={`/doctor-frontend/${doctorId}/prescriptions/new` + (selectedPatientId ? `?patientId=${selectedPatientId}` : '')}>
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
                          <AvatarImage src={prescription.patient?.user?.image || "/default-avatar.png"} alt={prescription.patient?.user?.fullName || "Patient Avatar"} />
                          <AvatarFallback>{prescription.patient?.user.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-800">{prescription.patientName || prescription.patient?.user.fullName}</p>
                          <p className="text-sm text-gray-500">Patient ID: {prescription.patientId}</p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/doctor-frontend/${doctorId}/prescriptions/new?patientId=${prescription.patientId}`}>
                          <Plus className="h-4 w-4 mr-2" />
                          New for Patient
                        </Link>
                      </Button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-800">Medication: {prescription.medication}</p>
                      <p className="text-sm text-gray-600">Dosage: {prescription.dosage}</p>
                      <p className="text-sm text-gray-600 mt-2">Instructions: {prescription.instructions}</p>
                      <p className="text-xs text-gray-400 mt-4">Prescribed on: {formatDate(prescription.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No prescriptions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorPrescriptions;