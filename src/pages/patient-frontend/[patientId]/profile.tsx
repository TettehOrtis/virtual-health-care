import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { LayoutDashboard, Calendar, FileText, UserCircle, CreditCard, Save, Mail, Phone, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface PatientProfile {
    id: string;
    supabaseId: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    address: string;
    medicalHistory?: string;
    user: {
        fullName: string;
        email: string;
        createdAt: string;
    };
}

const PatientProfile = () => {
    const router = useRouter();
    const { patientId } = router.query;
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        phone: "",
        address: "",
        medicalHistory: ""
    });

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
        const fetchProfile = async () => {
            if (!router.isReady) return;

            try {
                // Check for authentication token
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    console.error("No token found");
                    router.push('/login');
                    return;
                }

                // Fetch patient profile data
                const response = await fetch("/api/patients/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const profileData = await response.json();
                    setProfile(profileData);

                    // Initialize form data
                    setFormData({
                        phone: profileData.phone || "",
                        address: profileData.address || "",
                        medicalHistory: profileData.medicalHistory || ""
                    });
                } else {
                    console.error("Failed to fetch profile:", await response.text());
                    toast.error("Failed to load profile data");
                }
            } catch (error: any) {
                console.error("Error fetching profile:", error);
                toast.error("An error occurred while fetching profile data");
            } finally {
                setLoading(false);
                setInitialLoad(false); // Only show loading screen once
            }
        };

        fetchProfile();
    }, [router.isReady, patientId, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const calculateAge = (dateOfBirth: string) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            if (!token) {
                toast.error("Authentication token not found");
                return;
            }

            const response = await fetch("/api/patients/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const updatedProfile = await response.json();
                setProfile(updatedProfile);
                setEditing(false);
                toast.success("Profile updated successfully");
                
                // Refetch profile to ensure data is up to date
                const fetchProfile = async () => {
                    try {
                        const response = await fetch("/api/patients/profile", {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });
                        if (response.ok) {
                            const profileData = await response.json();
                            setProfile(profileData);
                        }
                    } catch (error) {
                        console.error("Error refetching profile:", error);
                        toast.error("Failed to refresh profile data");
                    }
                };
                fetchProfile();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to update profile");
            }
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error("An error occurred while updating your profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading && initialLoad) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <MainLayout>
                <div className="flex h-[calc(100vh-80px)]">
                    <DashboardSidebar items={sidebarItems} />
                    <div className="flex-1 overflow-auto bg-gray-50 p-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <h2 className="text-2xl font-bold mb-4 text-gray-900">Profile Not Found</h2>
                                <p className="mb-6 text-gray-700 text-lg">We couldn't find your profile information.</p>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    asChild
                                >
                                    <Link href="/login">Go to Login</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-80px)]">
                <DashboardSidebar items={sidebarItems} />

                <div className="flex-1 overflow-auto bg-gray-50 p-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                                {!editing ? (
                                    <Button
                                        onClick={() => setEditing(true)}
                                        className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <div className="flex gap-3 mt-4 md:mt-0">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setEditing(false);
                                                setFormData({
                                                    phone: profile?.phone || "",
                                                    address: profile?.address || "",
                                                    medicalHistory: profile?.medicalHistory || ""
                                                });
                                            }}
                                            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="default"
                                            className="bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full text-white"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2 text-white bg-blue-600 hover:bg-blue-700" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Profile Photo */}
                                <div className="flex flex-col items-center">
                                    <Avatar className="h-32 w-32 border-2 border-blue-100">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                                            {profile?.user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="mt-4 text-center">
                                        <h2 className="text-xl font-semibold text-gray-900">{profile?.user?.fullName || 'Loading...'}</h2>
                                        <p className="text-gray-500">
                                            Patient • {calculateAge(profile?.dateOfBirth || '')} years • {profile?.gender || 'Loading...'}
                                        </p>
                                    </div>
                                </div>

                                {/* Profile Info */}
                                <div className="flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                <Mail className="h-4 w-4 mr-2" />
                                                Email
                                            </p>
                                            <p className="text-gray-900">{profile?.user?.email || 'Loading...'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                <CalendarIcon className="h-4 w-4 mr-2" />
                                                Date of Birth
                                            </p>
                                            <p className="text-gray-900">{profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Loading...'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                <Phone className="h-4 w-4 mr-2" />
                                                Phone Number
                                            </p>
                                            {editing ? (
                                                <div>
                                                    <Input
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter your phone number"
                                                        className="mt-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-gray-900">{profile?.phone || "Not provided"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                <MapPin className="h-4 w-4 mr-2" />
                                                Address
                                            </p>
                                            {editing ? (
                                                <div>
                                                    <Input
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter your address"
                                                        className="mt-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-gray-900">{profile?.address || "Not provided"}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <Label className="text-sm font-medium text-gray-700 ">Medical History</Label>
                                        {editing ? (
                                            <Textarea
                                                name="medicalHistory"
                                                value={formData.medicalHistory}
                                                onChange={handleInputChange}
                                                placeholder="Enter any relevant medical history, conditions, or allergies"
                                                className="mt-1 h-32 bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <div className="mt-2 p-4 bg-gray-50 rounded-md">
                                                <p className="text-gray-700 whitespace-pre-line">
                                                    {profile?.medicalHistory ? profile.medicalHistory : "No medical history provided"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Member Since</p>
                                        <p className="text-gray-900">{profile?.user?.createdAt ? formatDate(profile.user.createdAt) : 'Loading...'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Account ID</p>
                                        <p className="text-gray-900">{profile?.id || 'Loading...'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default PatientProfile; 