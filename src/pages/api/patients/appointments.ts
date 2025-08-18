import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { AppointmentNotificationService } from "@/lib/email/appointment-notifications";
import { AppointmentNotificationData } from '@/lib/email/appointment-notifications';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Extract authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token and get supabase user id from `sub`
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };

        // Get patient information by Supabase ID
        const patient = await prisma.patient.findFirst({
            where: { supabaseId: decoded.sub }
        });

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Handle GET request - fetch appointments
        if (req.method === "GET") {
            // Fetch patient's appointments
            const appointments = await prisma.appointment.findMany({
                where: { patientId: patient.id },
                include: {
                    doctor: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: {
                    date: 'desc'
                }
            });

            return res.status(200).json(appointments);
        }

        // Handle POST request - create new appointment
        else if (req.method === "POST") {
            const { doctorId, date, type, notes } = req.body;

            // Validate required fields
            if (!doctorId || !date) {
                return res.status(400).json({ message: "Doctor ID and appointment date are required" });
            }

            // Check if doctor exists
            const doctor = await prisma.doctor.findUnique({
                where: { id: doctorId }
            });

            if (!doctor) {
                return res.status(404).json({ message: "Doctor not found" });
            }

            // Validate and normalize appointment type
            const validTypes = ['IN_PERSON', 'ONLINE', 'VIDEO_CALL'];
            const validType = validTypes.includes(type) ? type : 'IN_PERSON';

            // Create new appointment
            const appointment = await prisma.appointment.create({
                data: {
                    patientId: patient.id,
                    doctorId,
                    date: new Date(date),
                    time: new Date(date).toLocaleTimeString(),
                    type: validType,
                    notes: notes || undefined,
                    status: "PENDING"
                },
                include: {
                    doctor: { include: { user: true } },
                    patient: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            // Send appointment booking notifications
            try {
                // Format appointment data for notification service
                const notificationData: AppointmentNotificationData = {
                    appointment: {
                        ...appointment,
                        date: appointment.date.toISOString(),
                        notes: appointment.notes || undefined
                    },
                    patientName: appointment.patient.user.fullName,
                    doctorName: appointment.doctor.user.fullName,
                    type: 'BOOKING'
                };

                await AppointmentNotificationService.sendNotification(notificationData);
            } catch (error) {
                console.error('Failed to send appointment notification:', error);
                // Don't fail the appointment creation if email fails
            }

            return res.status(201).json({
                message: "Appointment booked successfully",
                appointment
            });
        }

        // Handle PUT request - update appointment
        else if (req.method === "PUT") {
            const { id, notes } = req.body;

            if (!id) {
                return res.status(400).json({ message: "Appointment ID is required" });
            }

            // Verify the appointment belongs to this patient
            const existingAppointment = await prisma.appointment.findFirst({
                where: {
                    id,
                    patientId: patient.id
                }
            });

            if (!existingAppointment) {
                return res.status(404).json({ message: "Appointment not found" });
            }

            // Patients can only update notes, not status or date
            const updatedAppointment = await prisma.appointment.update({
                where: { id },
                data: {
                    notes: notes || undefined
                },
                include: {
                    doctor: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            return res.status(200).json({
                message: "Appointment updated successfully",
                appointment: updatedAppointment
            });
        }

        // Handle DELETE request - cancel appointment
        else if (req.method === "DELETE") {
            const { id } = req.query;

            if (!id || typeof id !== "string") {
                return res.status(400).json({ message: "Appointment ID is required" });
            }

            // Verify the appointment belongs to this patient
            const existingAppointment = await prisma.appointment.findFirst({
                where: {
                    id,
                    patientId: patient.id
                }
            });

            if (!existingAppointment) {
                return res.status(404).json({ message: "Appointment not found" });
            }

            // Check if appointment can be cancelled (only PENDING or APPROVED appointments can be cancelled)
            if (existingAppointment.status !== "PENDING" && existingAppointment.status !== "APPROVED") {
                return res.status(400).json({
                    message: `Cannot cancel appointment with status '${existingAppointment.status}'`
                });
            }

            // Update status to CANCELED instead of deleting
            const cancelledAppointment = await prisma.appointment.update({
                where: { id },
                data: {
                    status: "CANCELED"
                },
                include: {
                    doctor: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            return res.status(200).json({
                message: "Appointment cancelled successfully",
                appointment: cancelledAppointment
            });
        }

        // If we get here, it means the HTTP method is not supported
        else {
            return res.status(405).json({ message: "Method not allowed" });
        }

    } catch (error: any) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid token" });
        }
        console.error("Error handling appointment request:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}