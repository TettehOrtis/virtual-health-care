import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/router";

import { LayoutDashboard, FileText, Plus, UserCircle, Users, Info, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface CreatePrescriptionFormProps {
  patientId: string;
  onSubmit: (data: FormData) => Promise<void>;
}

interface FormData {
  medication: string;
  dosage: string;
  instructions: string;
}

const CreatePrescriptionForm: React.FC<CreatePrescriptionFormProps> = ({ patientId, onSubmit }) => {
  const router = useRouter();
  const { doctorId } = router.query;
  const [formData, setFormData] = useState<FormData>({
    medication: "",
    dosage: "",
    instructions: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Define sidebar items
  const sidebarItems = [
    {
      title: 'Dashboard',
      href: '/doctor-frontend/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Prescriptions',
      href: '/doctor-frontend/prescriptions',
      icon: FileText,
    },
    {
      title: 'My Patients',
      href: '/doctor-frontend/patients',
      icon: Users,
    },
    {
      title: 'Profile',
      href: '/doctor-frontend/profile',
      icon: UserCircle,
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medication || !formData.dosage) {
      toast.error("Please fill in medication and dosage");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(formData);
      toast.success("Prescription created successfully!");
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create referral.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-white rounded-xl shadow-md">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Prescription Details</CardTitle>
              <p className="text-sm text-gray-500">Fill in the prescription details below</p>
            </div>
            <Button variant="ghost" asChild className="gap-2">
              <Link href={doctorId ? `/doctor-frontend/${doctorId}/prescriptions` : "/doctor-frontend/prescriptions"}>
                <Plus className="h-4 w-4" />
                Back to Prescriptions
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Medication</Label>
                <Input
                  type="text"
                  placeholder="Enter medication name"
                  value={formData.medication}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                  required
                  disabled={isLoading}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Dosage</Label>
                <Input
                  type="text"
                  placeholder="e.g., 500mg"
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  required
                  disabled={isLoading}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Instructions</Label>
              <Textarea
                rows={4}
                placeholder="Enter prescription instructions..."
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                disabled={isLoading}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Creating...
                </>
              ) : (
                "Create Prescription"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePrescriptionForm;
