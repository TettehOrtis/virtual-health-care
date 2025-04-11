import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MainLayout from "@/components/layout/mainlayout";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    // Debug: Display any token in local storage on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        console.log("Current token in localStorage:", token ? "exists" : "none");
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setDebugInfo(null);

        console.log("Login attempt for:", email);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            console.log("Login response status:", response.status);
            const data = await response.json();
            setDebugInfo(data); // Store response for debugging

            if (response.ok) {
                console.log("Login successful, received data:", data);

                // Clear any existing token first
                localStorage.removeItem("token");

                // Store the new token
                if (data.token) {
                    console.log("Storing new token");
                    localStorage.setItem("token", data.token);
                } else {
                    console.error("No token received from server");
                    toast.error("Login failed: No authentication token received");
                    return;
                }

                toast.success("Login successful!");

                // Handle redirection
                setTimeout(() => {
                    try {
                        if (data.redirectUrl) {
                            console.log("Redirecting to:", data.redirectUrl);
                            window.location.href = data.redirectUrl; // Force a full page reload
                        } else if (data.user && data.user.role) {
                            // Fallback based on user role
                            const role = data.user.role.toLowerCase();
                            const userId = data.user.id;

                            if (role === "doctor" && userId) {
                                const url = `/doctor-frontend/${userId}/dashboard`;
                                console.log("Fallback redirect (doctor):", url);
                                window.location.href = url;
                            } else if (role === "patient" && userId) {
                                const url = `/patient-frontend/${userId}/dashboard`;
                                console.log("Fallback redirect (patient):", url);
                                window.location.href = url;
                            } else {
                                console.log("No valid role/id for redirection, going to homepage");
                                window.location.href = "/";
                            }
                        } else {
                            console.log("No redirection info, going to homepage");
                            window.location.href = "/";
                        }
                    } catch (redirectError) {
                        console.error("Error during redirect:", redirectError);
                        window.location.href = "/"; // Last resort fallback
                    }
                }, 1000); // Short delay to ensure token is stored
            } else {
                console.error("Login failed:", data);
                toast.error(data.error || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("An error occurred during login");
            setDebugInfo({ error: String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Or{" "}
                            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                create a new account
                            </Link>
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email" className="text-gray-700">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="password" className="text-gray-700">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="mr-2">Signing in</span>
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </Button>
                    </form>

                    {/* Debug information - only visible during development */}
                    {process.env.NODE_ENV !== "production" && debugInfo && (
                        <div className="mt-8 p-4 bg-gray-100 rounded-md">
                            <h3 className="font-medium mb-2">Debug Info:</h3>
                            <pre className="text-xs overflow-auto max-h-64">
                                {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
