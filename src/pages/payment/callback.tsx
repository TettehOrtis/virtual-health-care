import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PaymentCallback = () => {
    const router = useRouter();
    const { reference } = router.query;
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('Verifying your payment...');
    const [patientId, setPatientId] = useState<string | null>(null);

    useEffect(() => {
        if (!reference || typeof reference !== 'string') return;

        const verifyPayment = async () => {
            try {
                const res = await fetch(`/api/payments/verify/${reference}`);
                const data = await res.json();

                if (res.ok && data.status === 'SUCCESS') {
                    setStatus('success');
                    setMessage('Your payment was successful! Your appointment is now confirmed.');
                    // Get patientId from the payment data
                    if (data.payment && data.payment.userId) {
                        setPatientId(data.payment.userId);
                    }
                } else {
                    setStatus('failed');
                    setMessage('Payment verification failed or payment was not successful.');
                }
            } catch (err) {
                setStatus('failed');
                setMessage('An error occurred while verifying your payment.');
            }
        };

        verifyPayment();
    }, [reference]);

    const handleNavigation = (path: string) => {
        if (patientId) {
            router.push(path.replace('[patientId]', patientId));
        } else {
            // Fallback to dashboard if patientId is not available
            router.push('/patient-frontend');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-10 w-10 mx-auto text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-700 font-medium">{message}</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="h-10 w-10 mx-auto text-green-600 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h2>
                        <p className="text-gray-700 mb-6">{message}</p>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
                            onClick={() => handleNavigation('/patient-frontend/[patientId]/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleNavigation('/patient-frontend/[patientId]/appointments')}
                        >
                            View Appointments
                        </Button>
                    </>
                )}
                {status === 'failed' && (
                    <>
                        <XCircle className="h-10 w-10 mx-auto text-red-600 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                        <p className="text-gray-700 mb-6">{message}</p>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleNavigation('/patient-frontend/[patientId]/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentCallback;
