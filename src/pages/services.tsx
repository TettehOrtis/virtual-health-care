import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/mainlayout";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/router";

const services = [
    {
        title: "Virtual Consultations",
        description: "Connect with healthcare professionals through secure video calls from anywhere.",
        features: [
            "24/7 availability for urgent care",
            "Specialists in various medical fields",
            "Secure and HIPAA-compliant platform",
            "Immediate or scheduled appointments"
        ],
        image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
        cta: "Book a Consultation",
        link: "/find-doctor"
    },
    {
        title: "Prescription Services",
        description: "Get prescriptions reviewed, renewed, or written by licensed physicians.",
        features: [
            "Electronic prescriptions sent to your pharmacy",
            "Medication management and reminders",
            "Prescription renewal notifications",
            "Secure prescription history"
        ],
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
        cta: "Learn More",
        link: "/auth"
    },
    {
        title: "Medical Records",
        description: "Access and manage your medical records securely in one place.",
        features: [
            "Centralized health information",
            "Share records with providers",
            "Upload external medical documents",
            "Track health metrics over time"
        ],
        image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80",
        cta: "Access Records",
        link: "/auth"
    },
    {
        title: "Specialist Referrals",
        description: "Get connected with specialized healthcare providers for specific conditions.",
        features: [
            "Network of verified specialists",
            "Easy appointment scheduling",
            "Seamless transfer of medical information",
            "Follow-up coordination"
        ],
        image: "https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?auto=format&fit=crop&w=800&q=80",
        cta: "Find Specialists",
        link: "/find-doctor"
    }
];

const Services = () => {
    const router = useRouter();
    const [patientId, setPatientId] = useState<string | null>(null);

    useEffect(() => {
        // Check if user is logged in and get patientId
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
            // In a real app, you would decode the token or fetch user info
            // This is a simplified example
            try {
                fetch("/api/patients/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.id) {
                            setPatientId(data.id);
                        }
                    });
            } catch (error) {
                console.error("Error fetching patient profile:", error);
            }
        }
    }, []);

    const getServiceLink = (link: string) => {
        if (patientId && (link === "/auth" || link.includes("/patient-"))) {
            // If user is logged in, redirect to patient-specific pages
            return link.replace("/auth", `/patient-frontend/${patientId}/dashboard`)
                .replace("/patient-", `/patient-frontend/${patientId}/`);
        }
        return link;
    };

    return (
        <MainLayout>
            <div className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Services</h1>
                        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                            Comprehensive virtual healthcare solutions designed to meet your needs
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="space-y-24">
                    {services.map((service, index) => (
                        <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}>
                            <div className={index % 2 === 1 ? 'order-first lg:order-last' : ''}>
                                <img
                                    src={service.image}
                                    alt={service.title}
                                    className="rounded-lg shadow-lg w-full h-auto object-cover aspect-video"
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h2>
                                <p className="text-gray-600 mb-6">{service.description}</p>

                                <ul className="space-y-3 mb-8">
                                    {service.features.map((feature, i) => (
                                        <li key={i} className="flex items-start">
                                            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mr-3 mt-0.5" />
                                            <span className="text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Link href={getServiceLink(service.link)}>{service.cta}</Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-blue-600 py-16 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-6">Ready to experience better healthcare?</h2>
                    <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
                        Join thousands of patients already using MediCloudHub for their healthcare needs.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button asChild size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                            <Link href="/auth">Sign In</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                            <Link href="/contact">Contact Us</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Services; 