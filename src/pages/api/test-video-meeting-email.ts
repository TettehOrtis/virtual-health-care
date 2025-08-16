import { NextApiRequest, NextApiResponse } from 'next';
import { AppointmentNotificationService } from '@/lib/email/appointment-notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const {
            patientEmail,
            doctorEmail,
            patientName = 'Test Patient',
            doctorName = 'Dr. Test Doctor',
            meetingUrl = 'https://meet.jit.si/test-meeting-123'
        } = req.body;

        if (!patientEmail || !doctorEmail) {
            return res.status(400).json({ message: 'Both patientEmail and doctorEmail are required' });
        }

        // Create a mock appointment object for testing
        const mockAppointment = {
            id: 'test-appointment-id',
            date: new Date().toISOString(),
            time: '10:00 AM',
            type: 'VIDEO_CALL' as const,
            status: 'APPROVED' as const,
            notes: 'Test video consultation',
            patient: {
                id: 'test-patient-id',
                user: {
                    id: 'test-user-id',
                    email: patientEmail,
                    fullName: patientName
                }
            },
            doctor: {
                id: 'test-doctor-id',
                user: {
                    id: 'test-doctor-user-id',
                    email: doctorEmail,
                    fullName: doctorName
                }
            }
        };

        console.log('Sending test video meeting email to:', patientEmail, doctorEmail);

        // Test the video meeting notification service
        await AppointmentNotificationService.sendVideoMeetingNotification(mockAppointment, meetingUrl);

        console.log('Test video meeting email sent successfully');
        return res.status(200).json({
            message: 'Test video meeting email sent successfully',
            details: {
                patientEmail,
                doctorEmail,
                meetingUrl,
                appointmentType: 'VIDEO_CALL'
            }
        });
    } catch (error) {
        console.error('Failed to send test video meeting email:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return res.status(500).json({
            message: 'Failed to send test video meeting email',
            error: errorMessage
        });
    }
}
