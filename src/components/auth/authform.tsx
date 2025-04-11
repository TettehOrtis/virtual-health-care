import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRouter } from "next/router";

type UserRole = "PATIENT" | "DOCTOR";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("PATIENT");
  const router = useRouter();

  // Form state for registration
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "PATIENT",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: "",
    specialization: "",
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      // Handle login
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();
        console.log("Login response data:", data); // Add for debugging

        if (response.ok) {
          // Store token in both localStorage and memory
          localStorage.setItem('token', data.token);
          window.sessionStorage.setItem('token', data.token);

          toast.success("Login successful!");

          if (data.user && data.user.role === "PATIENT") {
            // If patientId is directly in the response
            const patientId = data.patientId || (data.user ? data.user.id : null);
            if (patientId) {
              console.log(`Redirecting to patient dashboard: ${patientId}`);
              router.push(`/patient-frontend/${patientId}/dashboard`);
            } else {
              console.error("Missing patient ID in the response", data);
              toast.error("Login successful but couldn't load your dashboard");
            }
          } else if (data.user && data.user.role === "DOCTOR") {
            // If doctorId is directly in the response
            const doctorId = data.doctorId || (data.user ? data.user.id : null);
            if (doctorId) {
              console.log(`Redirecting to doctor dashboard: ${doctorId}`);
              router.push(`/doctor-frontend/${doctorId}/dashboard`);
            } else {
              console.error("Missing doctor ID in the response", data);
              toast.error("Login successful but couldn't load your dashboard");
            }
          } else if (data.redirectUrl) {
            // Use the redirect URL if provided
            console.log(`Using provided redirect URL: ${data.redirectUrl}`);
            router.push(data.redirectUrl);
          } else {
            console.error("Could not determine user role or find redirect information", data);
            toast.error("Login successful but couldn't determine user type");
          }
        } else {
          toast.error(data.message || data.error || "Login failed. Please try again.");
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error("An error occurred. Please try again.");
      }
    } else {
      // Handle registration
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Registration successful!");
          setIsLogin(true); // Switch back to login form
        } else {
          toast.error(data.error || "Registration failed. Please try again.");
        }
      } catch (error) {
        console.error("Registration error:", error);
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  return (
    <Card className="auth-card bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-gray-900">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          {isLogin
            ? "Enter your credentials to access your account"
            : "Fill in the information below to create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="PATIENT" className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger
              value="PATIENT"
              onClick={() => {
                setUserRole("PATIENT");
                setFormData((prev) => ({ ...prev, role: "PATIENT" }));
              }}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Patient
            </TabsTrigger>
            <TabsTrigger
              value="DOCTOR"
              onClick={() => {
                setUserRole("DOCTOR");
                setFormData((prev) => ({ ...prev, role: "DOCTOR" }));
              }}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Doctor
            </TabsTrigger>
          </TabsList>
          <TabsContent value="PATIENT">
            <p className="text-sm text-gray-600">
              {isLogin
                ? "Access your patient portal"
                : "Create a new patient account"}
            </p>
          </TabsContent>
          <TabsContent value="DOCTOR">
            <p className="text-sm text-gray-600">
              {isLogin
                ? "Access your doctor portal"
                : "Create a verified doctor account"}
            </p>
          </TabsContent>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid gap-2">
              <Label htmlFor="fullName" className="text-gray-700">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="bg-gray-50 border-gray-300 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="bg-gray-50 border-gray-300 focus:ring-blue-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="bg-gray-50 border-gray-300 focus:ring-blue-500"
            />
          </div>

          {!isLogin && userRole === "PATIENT" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="dateOfBirth" className="text-gray-700">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-300 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gender" className="text-gray-700">Gender</Label>
                <Input
                  id="gender"
                  type="text"
                  placeholder="Male/Female/Other"
                  required
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-300 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-gray-700">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="123-456-7890"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-300 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-gray-700">Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main St, City, Country"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-300 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {!isLogin && userRole === "DOCTOR" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="specialization" className="text-gray-700">Specialization</Label>
                <Input
                  id="specialization"
                  type="text"
                  placeholder="Cardiology, Neurology, etc."
                  required
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-300 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-gray-700">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="123-456-7890"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-300 focus:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-gray-700">Address (Optional)</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-300 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          variant="link"
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 hover:text-blue-700"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AuthForm;