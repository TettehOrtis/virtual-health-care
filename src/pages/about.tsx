import { Button } from "@/components/ui/button";
import Link from "next/link";
import MainLayout from "@/components/layout/mainlayout";
import { Shield, Users, Heart, Globe, Award } from "lucide-react";

const About = () => {
    // Mission and values
    const values = [
        {
            icon: Shield,
            title: "Security & Privacy",
            description: "We prioritize privacy, safety, and compliance with healthcare standards in everything we do.",
        },
        {
            icon: Users,
            title: "Verified Professionals",
            description: "All doctors, pharmacies, and hospitals on our platform are carefully verified to ensure trust and quality care.",
        },
        {
            icon: Heart,
            title: "Patient-Centered Care",
            description: "Patients can connect with licensed professionals, book consultations, and get prescriptions with confidence.",
        },
        {
            icon: Globe,
            title: "Accessible Healthcare",
            description: "We built this platform to make healthcare more accessible, secure, and reliable for everyone.",
        },
        {
            icon: Award,
            title: "Quality Assurance",
            description: "Our mission is simple: connect people with the right care, anytime, anywhere.",
        },
    ];

    return (
        <MainLayout>
            {/* Hero Section */}
            <section className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 mb-6">
                            About <span className="text-blue-600">MediCloudHub</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            We're revolutionizing healthcare by making it more accessible, secure, and reliable for everyone.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Link href="/auth">Get Started</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                                <Link href="/find-doctor">Find a Doctor</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 bg-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                We built this platform to make healthcare more accessible, secure, and reliable for everyone.
                                Our mission is simple: connect people with the right care, anytime, anywhere.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                All doctors, pharmacies, and hospitals on our platform are carefully verified to ensure trust
                                and quality care. Patients can connect with licensed professionals, book consultations, and
                                get prescriptions with confidence.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                We prioritize privacy, safety, and compliance with healthcare standards in everything we do.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <img
                                src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
                                alt="Healthcare professionals working together"
                                className="rounded-lg shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Values</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            The principles that guide everything we do
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {values.map((value, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                                    <value.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-900">{value.title}</h3>
                                <p className="text-gray-600">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Our Impact</h2>
                        <p className="text-lg opacity-90">
                            Making a difference in healthcare delivery
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-2">10,000+</div>
                            <div className="text-blue-100">Patients Served</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-2">500+</div>
                            <div className="text-blue-100">Verified Doctors</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-2">50+</div>
                            <div className="text-blue-100">Specialties</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-2">99%</div>
                            <div className="text-blue-100">Satisfaction Rate</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-gray-900">Why Choose MediCloudHub?</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            We're committed to providing the best virtual healthcare experience
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                            <h3 className="text-xl font-semibold mb-3 text-gray-900">Verified Healthcare Providers</h3>
                            <p className="text-gray-600">
                                Every doctor, pharmacy, and hospital on our platform undergoes rigorous verification
                                to ensure they meet our high standards for quality and safety.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                            <h3 className="text-xl font-semibold mb-3 text-gray-900">Secure & Private</h3>
                            <p className="text-gray-600">
                                Your health information is protected with enterprise-grade security and we maintain
                                strict compliance with healthcare privacy standards.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                            <h3 className="text-xl font-semibold mb-3 text-gray-900">24/7 Access</h3>
                            <p className="text-gray-600">
                                Get the care you need when you need it. Our platform is available around the clock
                                to connect you with healthcare professionals.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold mb-6 text-gray-900">Ready to experience better healthcare?</h2>
                        <p className="text-lg mb-8 text-gray-600">
                            Join thousands of patients and doctors already using MediCloudHub for virtual consultations.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Link href="/auth">Sign Up Now</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                                <Link href="/find-doctor">Find a Doctor</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
};

export default About;
