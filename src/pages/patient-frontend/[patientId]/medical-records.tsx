import { useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MedicalRecordUpload from "@/components/medical-records/MedicalRecordUpload";
import MedicalRecordsList from "@/components/medical-records/MedicalRecordsList";

const MedicalRecordsPage = () => {
  const router = useRouter();
  const { patientId } = router.query;
  const [activeTab, setActiveTab] = useState("records");

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

  const handleUploadSuccess = () => {
    setActiveTab("records");
  };

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-80px)]">
        <DashboardSidebar items={sidebarItems} />

        <div className="flex-1 overflow-auto bg-gray-50 p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
                <p className="text-gray-600 mt-1">
                  Upload, view, and manage your medical records and documents
                </p>
              </div>
              <Button
                onClick={() => setActiveTab("upload")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Upload Record
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="records">My Records</TabsTrigger>
                <TabsTrigger value="upload">Upload New</TabsTrigger>
              </TabsList>

              <TabsContent value="records" className="mt-6">
                <MedicalRecordsList />
              </TabsContent>

              <TabsContent value="upload" className="mt-6">
                <MedicalRecordUpload onUploadSuccess={handleUploadSuccess} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MedicalRecordsPage; 