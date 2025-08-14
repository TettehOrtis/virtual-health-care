import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, Users, Search, Plus, FileIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreatePrescriptionForm from "@/components/prescription/CreatePrescriptionForm";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Patient {
  id: string;
  user: {
    fullName: string;
  };
}

const CreatePrescription = () => {
  const router = useRouter();
  const { doctorId } = router.query;
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

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
    const fetchPatients = async () => {
      if (!router.isReady) return;
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          router.push('/login');
          return;
        }
        const response = await fetch(`/api/doctors/patients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        }
      } catch (error) {
        // handle error
      }
    };
    fetchPatients();
  }, [router.isReady]);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!router.isReady) return;

      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          router.push('/login');
          return;
        }

        const patientId = router.query.patientId as string;
        if (patientId) {
          const response = await fetch(`/api/doctors/patients/${patientId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const patient = await response.json();
            setPatient(patient);
            setPatientId(patient.id);
            setError(null);
          } else {
            const errorData = await response.json();
            setError(errorData.message || "Failed to load patient information");
            toast.error(errorData.message || "Failed to load patient information");
          }
        } else {
          setError("No patient selected. Please select a patient from the prescriptions list.");
          toast.error("No patient selected. Please select a patient from the prescriptions list.");
        }
      } catch (error) {
        setError("An error occurred while loading patient information");
        toast.error("An error occurred while loading patient information");
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [router.isReady, router.query.patientId]);

  const handleSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        toast.error("Please login to create prescriptions");
        router.push('/login');
        return;
      }

      if (!patientId) {
        toast.error("Please select a patient first");
        return;
      }

      const response = await fetch(`/api/doctors/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          medication: data.medication,
          dosage: data.dosage,
          instructions: data.instructions,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create prescription');
      }

      toast.success("Prescription created successfully!");
      router.push(`/doctor-frontend/${doctorId}/prescriptions`);
    } catch (error) {
      console.error("Error creating prescription:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create prescription.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <MainLayout>
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar items={sidebarItems} className="h-full" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 flex items-center px-8 border-b bg-white">
            <h1 className="text-2xl font-semibold text-gray-900">Create Prescription</h1>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              {/* Patient selection if not selected */}
              {!patientId && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient</label>
                  <Select
                    value={patientId || undefined}
                    onValueChange={(value) => {
                      setPatientId(value);
                      router.replace({
                        pathname: router.pathname,
                        query: { ...router.query, patientId: value },
                      }, undefined, { shallow: true });
                    }}
                  >
                    <SelectTrigger className="w-full md:w-96">
                      <SelectValue placeholder="Choose a patient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Show form only if patient is selected */}
              {patientId && (
                <CreatePrescriptionForm
                  patientId={patientId}
                  onSubmit={handleSubmit}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreatePrescription;
