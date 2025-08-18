import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  UserCircle,
  Bell,
  Users,
  Upload,
  MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Doctor {
  id: string;
  specialization: string;
  phone: string;
  address: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

const DoctorProfile = () => {
  const router = useRouter();
  const { doctorId } = router.query;
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullName: "",
    specialization: "",
    phone: "",
    address: "",
    email: "",
  });

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
    // Fetch profile data from the API
    const fetchProfile = async () => {
      if (!router.isReady) return;

      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch("/api/doctors/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile({
            fullName: data.user.fullName,
            specialization: data.specialization || "",
            phone: data.phone || "",
            address: data.address || "",
            email: data.user.email || "",
          });
        } else {
          toast.error("Failed to fetch profile data.");
        }
      } catch (error) {
        toast.error("An error occurred while fetching profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router.isReady, doctorId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/doctors/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          specialization: profile.specialization,
          phone: profile.phone,
          address: profile.address,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        toast.success("Your profile has been updated successfully.");
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (error) {
      toast.error("An error occurred while updating the profile.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-80px)]">
        <DashboardSidebar items={sidebarItems} />

        <div className="flex-1 overflow-auto bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => isEditing ? handleProfileUpdate() : setIsEditing(true)}
                className={isEditing
                  ? "bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  : "border-blue-600 text-blue-600 hover:bg-blue-50 font-medium"}
              >
                {isEditing ? "Save Changes" : "Edit Profile"}
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-blue-100">
                      <AvatarImage src={profileImage} alt="Doctor profile" />
                      <AvatarFallback className="bg-blue-600 text-white text-2xl">
                        {profile.fullName ? profile.fullName.split(' ').map(n => n[0]).join('') : 'DR'}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="absolute bottom-0 right-0">
                        <Label htmlFor="profile-image" className="cursor-pointer bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 flex items-center justify-center">
                          <Upload className="h-4 w-4" />
                        </Label>
                        <Input
                          id="profile-image"
                          type="file"
                          className="hidden"
                          onChange={handleImageUpload}
                          accept="image/*"
                        />
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="text-center mt-4">
                      <h2 className="text-xl font-semibold text-gray-900">Dr. {profile.fullName.split('Dr. ').pop()}</h2>
                      <p className="text-gray-600">{profile.specialization}</p>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName" className="text-gray-700 mb-1 block">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={profile.fullName}
                          onChange={handleInputChange}
                          disabled // Full name is managed by the User model
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-gray-700 mb-1 block">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          value={profile.email}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="specialization" className="text-gray-700 mb-1 block">Specialization</Label>
                        <Select
                          value={profile.specialization}
                          onValueChange={(value) => handleSelectChange(value, "specialization")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select specialization" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cardiology">Cardiology</SelectItem>
                            <SelectItem value="Dermatology">Dermatology</SelectItem>
                            <SelectItem value="Neurology">Neurology</SelectItem>
                            <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                            <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                            <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-gray-700 mb-1 block">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={profile.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address" className="text-gray-700 mb-1 block">Address</Label>
                        <Textarea
                          id="address"
                          name="address"
                          value={profile.address}
                          onChange={handleInputChange}
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="ml-0 md:ml-4">
                      <p className="text-gray-600 mb-3">
                        <span className="font-medium">Email:</span> {profile.email}
                      </p>
                      <p className="text-gray-600 mb-3">
                        <span className="font-medium">Phone:</span> {profile.phone}
                      </p>
                      <p className="text-gray-600 mb-3">
                        <span className="font-medium">Address:</span> {profile.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProfileUpdate}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorProfile;