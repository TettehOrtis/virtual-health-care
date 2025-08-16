import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AppointmentNotificationService } from '@/lib/email/appointment-notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Get appointments that are scheduled for tomorrow (24-hour reminder)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        const upcomingAppointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: tomorrow,
                    lt: dayAfterTomorrow
                },
                status: 'APPROVED'
            },
            include: {
                doctor: { include: { user: true } },
                patient: { include: { user: true } }
            }
        });

        console.log(`Found ${upcomingAppointments.length} appointments for tomorrow`);

        const results = [];

        for (const appointment of upcomingAppointments) {
            try {
                // Prepare notification data
                const notificationData = {
                    appointment: {
                        ...appointment,
                        date: appointment.date.toISOString(),
                        notes: appointment.notes || undefined
                    },
                    patientName: appointment.patient.user.fullName,
                    doctorName: appointment.doctor.user.fullName,
                    type: 'REMINDER' as const,
                    meetingUrl: appointment.meetingUrl || undefined
                };

                // Send reminder notification
                await AppointmentNotificationService.sendNotification(notificationData);

                results.push({
                    appointmentId: appointment.id,
                    patientEmail: appointment.patient.user.email,
                    doctorEmail: appointment.doctor.user.email,
                    status: 'sent',
                    type: appointment.type,
                    hasMeetingUrl: !!appointment.meetingUrl
                });

                console.log(`Reminder sent for appointment ${appointment.id}`);
            } catch (error) {
                console.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
                results.push({
                    appointmentId: appointment.id,
                    patientEmail: appointment.patient.user.email,
                    doctorEmail: appointment.doctor.user.email,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    type: appointment.type,
                    hasMeetingUrl: !!appointment.meetingUrl
                });
            }
        }

        return res.status(200).json({
            message: 'Appointment reminders processed',
            totalAppointments: upcomingAppointments.length,
            results
        });

    } catch (error) {
        console.error('Error processing appointment reminders:', error);
        return res.status(500).json({
            message: 'Failed to process appointment reminders',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
