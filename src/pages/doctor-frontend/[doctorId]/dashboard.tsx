import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import DashboardCardHeader from "@/components/dashboard/dashboardhead";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  UserCircle,
  Bell,
  Users,
  TrendingUp
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Appointment {
  id: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  patient: {
    user: {
      fullName: string;
    };
  };
}

interface Patient {
  id: string;
  supabaseId: string;
  user: {
    fullName: string;
    email: string;
  };
}

interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medication: string;
  dosage: string;
  instructions: string;
  createdAt: string;
  patient: {
    user: {
      fullName: string;
    };
  };
}

const DoctorDashboard = () => {
  const router = useRouter();
  const { doctorId } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // Add these new stats calculations
  const stats = {
    totalPatients: patients.length,
    consultationsThisMonth: appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      const today = new Date();
      return aptDate.getMonth() === today.getMonth();
    }).length,
    upcomingAppointments: appointments.filter(apt =>
      new Date(apt.date) >= new Date()
    ).length
  };

  const [appointmentTab, setAppointmentTab] = useState("today");

  // Split appointments
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date).toDateString();
    return aptDate === new Date().toDateString();
  });

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    const today = new Date();
    return aptDate > today;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          router.push('/login');
          return;
        }

        // Verify doctorId is available
        if (!doctorId) {
          return;
        }

        // Fetch user data
        const userResponse = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await userResponse.json();
        setUserName(userData.fullName);

        // Fetch appointments
        const appointmentsResponse = await fetch("/api/doctors/appointments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!appointmentsResponse.ok) {
          throw new Error("Failed to fetch appointments");
        }

        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData);

        // Fetch patients
        const patientsResponse = await fetch("/api/doctors/patients", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!patientsResponse.ok) {
          throw new Error("Failed to fetch patients");
        }

        const patientsData = await patientsResponse.json();
        setPatients(patientsData);

        // Fetch prescriptions
        const prescriptionsResponse = await fetch("/api/doctors/prescriptions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!prescriptionsResponse.ok) {
          throw new Error("Failed to fetch prescriptions");
        }

        const prescriptionsData = await prescriptionsResponse.json();
        setPrescriptions(prescriptionsData);

      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchData();
    }
  }, [router.isReady, doctorId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  }

  // Update sidebar items with the doctorId in the paths
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

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-80px)]">
        <DashboardSidebar items={sidebarItems} />

        <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900">
                    {userName && `Dr. ${userName.split('Dr. ').pop()}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Total Patients</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Your patient count</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Consultations</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.consultationsThisMonth}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">This month</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Appointments</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Upcoming</p>
              </div>
            </div>

            {/* Appointments Section */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <DashboardCardHeader
                  title={<h2 className="text-xl font-semibold text-gray-900">Appointments</h2>}
                  description={<p className="text-sm text-gray-600 mt-1">Manage your appointments and schedule</p>}
                  action={
                    <Button variant="outline" asChild>
                      <Link href={`/doctor-frontend/${doctorId}/schedule`}>
                        Manage Schedule
                      </Link>
                    </Button>
                  }
                />
              </div>

              <div className="p-6">
                <Tabs value={appointmentTab} onValueChange={setAppointmentTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  </TabsList>

                  <TabsContent value="today">
                    {todayAppointments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {todayAppointments.map((appointment) => (
                          <div key={appointment.id} className="border rounded-lg overflow-hidden bg-white">
                            <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
                              <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
                                  {appointment.patient.user.fullName.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{appointment.patient.user.fullName}</h4>
                                  <p className="text-sm text-gray-600">Patient</p>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  appointment.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {appointment.status}
                              </span>
                            </div>

                            <div className="p-4 bg-white">
                              <div className="flex flex-col gap-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span className="font-medium">{new Date(appointment.date).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                  Start Session
                                </Button>
                                <Button variant="outline" className="text-gray-700 hover:text-gray-900">
                                  Reschedule
                                </Button>
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
                          <div key={appointment.id} className="border rounded-lg overflow-hidden bg-white">
                            <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
                              <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
                                  {appointment.patient.user.fullName.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{appointment.patient.user.fullName}</h4>
                                  <p className="text-sm text-gray-600">Patient</p>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  appointment.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {appointment.status}
                              </span>
                            </div>

                            <div className="p-4 bg-white">
                              <div className="flex flex-col gap-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span className="font-medium">{new Date(appointment.date).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                  Start Session
                                </Button>
                                <Button variant="outline" className="text-gray-700 hover:text-gray-900">
                                  Reschedule
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-gray-500">No upcoming appointments.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Recent Patients Table */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <DashboardCardHeader
                  title={<h2 className="text-xl font-semibold text-gray-900">Recent Patients</h2>}
                  description={<p className="text-sm text-gray-600 mt-1">Your recently seen patients</p>}
                  action={
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/doctor-frontend/${doctorId}/patients`}>
                        View All
                      </Link>
                    </Button>
                  }
                />
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-left">
                      <tr className="border-b">
                        <th className="pb-3 font-medium text-gray-900">Patient</th>
                        <th className="pb-3 font-medium text-gray-900">Email</th>
                        <th className="pb-3 font-medium text-gray-900 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.slice(0, 5).map((patient) => (
                        <tr key={patient.id} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-700">
                                {patient.user.fullName.charAt(0)}
                              </div>
                              <span className="text-gray-900 font-medium">{patient.user.fullName}</span>
                            </div>
                          </td>
                          <td className="py-4 text-gray-600 font-medium">{patient.user.email}</td>
                          <td className="py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              asChild
                            >
                              <Link href={`/doctor-frontend/${doctorId}/patients/${patient.id}`}>
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorDashboard;
