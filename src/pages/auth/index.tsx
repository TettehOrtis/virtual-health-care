import AuthForm from "@/components/auth/authform";
import MainLayout from "@/components/layout/mainlayout";

export default function AuthPage() {
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome to MediCloudHub
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in or register to access your account
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    </MainLayout>
  );
}
