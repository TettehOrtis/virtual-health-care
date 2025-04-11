import MainLayout from "@/components/layout/mainlayout";
import AuthForm from "@/components/auth/authform";

const Auth = () => {
  return (
    <MainLayout>
      <div className="py-16 bg-gray-50 min-h-[calc(100vh-80px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900">Welcome to MediCloudHub</h1>
              <p className="mt-2 text-lg text-gray-600">
                Sign in to your account or create a new one to get started
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="md:grid md:grid-cols-2">
                {/* Auth Form */}
                <div className="p-8 md:order-last">
                  <AuthForm />
                </div>
                
                {/* Side Panel */}
                <div className="hidden md:block bg-blue-600 relative">
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-white space-y-6 relative z-10">
                      <h2 className="text-2xl font-bold">Virtual Healthcare Platform</h2>
                      <p className="opacity-90">
                        Connect with healthcare professionals through secure virtual consultations.
                      </p>
                      
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p>Book appointments with specialists</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p>Video consultations from anywhere</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p>Secure prescriptions and medical records</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Solid background color */}
                  <div className="absolute inset-0 bg-blue-600 opacity-90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Auth;