import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import { toast } from 'sonner';

interface VideoConsultationButtonProps {
    appointmentId: string;
    appointmentType: string;
    appointmentStatus: string;
    userRole: 'PATIENT' | 'DOCTOR';
}

export default function VideoConsultationButton({
    appointmentId,
    appointmentType,
    appointmentStatus,
    userRole
}: VideoConsultationButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleJoinMeeting = async () => {
        if (appointmentType !== 'VIDEO_CALL') {
            toast.error('This is not a video consultation appointment');
            return;
        }

        if (appointmentStatus !== 'APPROVED') {
            toast.error('Appointment must be approved to join video consultation');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');

            if (!token) {
                toast.error('Authentication token not found');
                return;
            }

            // Generate or get meeting URL
            const response = await fetch(`/api/appointments/${appointmentId}/meeting`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate meeting URL');
            }

            const { meetingUrl } = await response.json();

            // Open Jitsi Meet in new tab
            window.open(meetingUrl, '_blank', 'width=1200,height=800');

            toast.success('Opening video consultation...');
        } catch (error) {
            console.error('Error joining meeting:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to join video consultation');
        } finally {
            setIsLoading(false);
        }
    };

    if (appointmentType !== 'VIDEO_CALL' || appointmentStatus !== 'APPROVED') {
        return null;
    }

    return (
        <Button
            onClick={handleJoinMeeting}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
        >
            {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
                <Video className="h-4 w-4 mr-2" />
            )}
            Join Video Consultation
        </Button>
    );
}
