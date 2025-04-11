import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LegacyPatientDashboardRedirect() {
    const router = useRouter();
    const { patientId } = router.query;

    useEffect(() => {
        if (patientId && typeof patientId === 'string') {
            // Redirect to the new path structure
            router.replace(`/patient-frontend/${patientId}/dashboard`);
        }
    }, [patientId, router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="rounded-lg bg-white p-8 shadow-md text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-700">Redirecting to the new dashboard location...</p>
            </div>
        </div>
    );
} 