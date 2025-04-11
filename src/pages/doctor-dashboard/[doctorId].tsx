import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DoctorDashboardRedirect() {
    const router = useRouter();
    const { doctorId } = router.query;

    useEffect(() => {
        if (doctorId) {
            router.replace(`/doctor-frontend/${doctorId}/dashboard`);
        }
    }, [doctorId, router]);

    return (
        <div className="flex justify-center items-center h-screen">
            Redirecting...
        </div>
  );
}
