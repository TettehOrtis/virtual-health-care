import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/middleware/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { appointmentId } = req.query;

    if (!appointmentId || typeof appointmentId !== 'string') {
        return res.status(400).json({ message: 'Appointment ID is required' });
    }

    // Verify authentication
    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Fetch appointment and verify access
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctor: { include: { user: true } },
                patient: { include: { user: true } }
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify user has access to this appointment
        if (user.role === 'PATIENT' && appointment.patientId !== user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        if (user.role === 'DOCTOR' && appointment.doctorId !== user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        switch (req.method) {
            case 'GET':
                // Return existing meeting details
                return res.status(200).json({
                    meetingId: appointment.meetingId,
                    meetingUrl: appointment.meetingUrl,
                    appointment: {
                        id: appointment.id,
                        date: appointment.date,
                        time: appointment.time,
                        type: appointment.type,
                        status: appointment.status,
                        notes: appointment.notes,
                        patient: {
                            id: appointment.patient.id,
                            fullName: appointment.patient.user.fullName
                        },
                        doctor: {
                            id: appointment.doctor.id,
                            fullName: appointment.doctor.user.fullName,
                            specialization: appointment.doctor.specialization
                        }
                    }
                });

            case 'POST':
                // Generate new meeting URL
                if (appointment.type !== 'VIDEO_CALL') {
                    return res.status(400).json({ message: 'This appointment is not a video consultation' });
                }

                if (appointment.status !== 'APPROVED') {
                    return res.status(400).json({ message: 'Appointment must be approved to generate meeting URL' });
                }

                // Generate unique meeting ID
                const meetingId = `medicloud-${appointmentId}-${Date.now()}`;

                // Create Jitsi Meet URL
                const meetingUrl = `https://meet.jitsi.si/${meetingId}`;

                // Update appointment with meeting details
                const updatedAppointment = await prisma.appointment.update({
                    where: { id: appointmentId },
                    data: {
                        meetingId,
                        meetingUrl
                    },
                    include: {
                        doctor: { include: { user: true } },
                        patient: { include: { user: true } }
                    }
                });

                return res.status(200).json({
                    meetingId,
                    meetingUrl,
                    appointment: {
                        id: updatedAppointment.id,
                        date: updatedAppointment.date,
                        time: updatedAppointment.time,
                        type: updatedAppointment.type,
                        status: updatedAppointment.status,
                        notes: updatedAppointment.notes,
                        patient: {
                            id: updatedAppointment.patient.id,
                            fullName: updatedAppointment.patient.user.fullName
                        },
                        doctor: {
                            id: updatedAppointment.doctor.id,
                            fullName: updatedAppointment.doctor.user.fullName,
                            specialization: updatedAppointment.doctor.specialization
                        }
                    }
                });

            default:
                return res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error handling meeting request:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
