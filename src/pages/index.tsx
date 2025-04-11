import { Button } from "@/components/ui/button";
import Link from "next/link"; // Use Next.js Link
import MainLayout from "@/components/layout/mainlayout";
import { Calendar, Video, FileText, CreditCard, Search, Star } from "lucide-react";

const Index = () => {
  // Features list
  const features = [
    {
      title: "Find a Specialist",
      description: "Search and connect with qualified healthcare professionals based on specialty, availability, and ratings.",
      icon: Search,
    },
    {
      title: "Book Appointments",
      description: "Schedule consultations at your convenience, with instant confirmation and reminders.",
      icon: Calendar,
    },
    {
      title: "Video Consultations",
      description: "Connect with doctors through secure video calls from the comfort of your home.",
      icon: Video,
    },
    {
      title: "Digital Prescriptions",
      description: "Receive and manage digital prescriptions that can be sent directly to your preferred pharmacy.",
      icon: FileText,
    },
    {
      title: "Secure Payments",
      description: "Pay for consultations securely online with various payment methods.",
      icon: CreditCard,
    },
  ];

  // How it works steps
  const steps = [
    {
      number: 1,
      title: "Sign up",
      description: "Create an account as a patient or healthcare provider.",
    },
    {
      number: 2,
      title: "Find a Doctor",
      description: "Search for specialists based on your needs and availability.",
    },
    {
      number: 3,
      title: "Book a Consultation",
      description: "Select a convenient time slot and make a secure payment.",
    },
    {
      number: 4,
      title: "Get Care",
      description: "Connect with your doctor via video call at the scheduled time.",
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Virtual Healthcare for <span className="text-blue-600">You</span>
              </h1>
              <p className="text-lg text-gray-600">
                Connect with licensed doctors online for consultations, prescriptions, and medical advice from the comfort of your home.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/auth">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Link href="/find-doctor">Find a Doctor</Link>
                </Button>
              </div>
              <div className="pt-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-blue-200 border-2 border-white">
                      <div className="h-full w-full rounded-full flex items-center justify-center text-blue-600 font-medium">
                        {String.fromCharCode(65 + i)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-blue-600">
                  <span className="font-semibold">4,000+</span> satisfied patients in the last month
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
                alt="Doctor attending to a patient"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">How We're Changing Healthcare</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform makes healthcare more accessible, convenient, and efficient for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get the care you need in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">What Our Users Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Read about the experiences of patients and doctors who use our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">
                  "MediCloudHub has been a game-changer for me. I can consult with my doctor from anywhere, and the platform is so easy to use."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Patient {index + 1}</h4>
                    <p className="text-sm text-gray-600">Regular user</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to experience better healthcare?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of patients and doctors already using MediCloudHub for virtual consultations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Link href="/auth">Sign Up Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent text-white hover:bg-white/10">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;