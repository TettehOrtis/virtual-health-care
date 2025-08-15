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
                let errorMessage = 'Failed to generate meeting URL';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                    console.error('API Error:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData,
                        url: response.url
                    });
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Meeting data:', data);
            
            if (!data.meetingUrl) {
                throw new Error('No meeting URL returned from server');
            }

            // Try to open Jitsi Meet in a new tab
            const newWindow = window.open(data.meetingUrl, '_blank', 'width=1200,height=800');
            // If the popup was blocked, redirect the current tab instead
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                window.location.href = data.meetingUrl;
            }

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
