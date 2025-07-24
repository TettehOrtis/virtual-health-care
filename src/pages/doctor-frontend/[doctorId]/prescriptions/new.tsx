import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, Users, Search, Plus, FileIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreatePrescriptionForm from "@/components/prescription/CreatePrescriptionForm";
import { toast } from "sonner";

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

  if (!patientId) {
    return (
      <MainLayout>
        <DashboardSidebar items={sidebarItems} />
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Create Prescription</h1>
            <p className="text-gray-600 mb-6">Please select a patient from the list to create a prescription.</p>
            <Button
              onClick={() => router.push(`/doctor-frontend/${doctorId}/prescriptions`)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Prescriptions
            </Button>
          </div>
        </div>
      </MainLayout>
    );
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
              <CreatePrescriptionForm
                patientId={patientId || ''}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreatePrescription;
