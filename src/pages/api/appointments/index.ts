import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/middleware/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Verify token and get decoded fields (sub = supabase user id)
    const user = verifyToken(req);
    console.log("Authenticated User:", user);

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    switch (req.method) {
        case "GET":
            try {
                let appointments;
                if (user.role === "PATIENT") {
                    // Resolve patient by supabase user id
                    const patient = await prisma.patient.findFirst({ where: { supabaseId: user.sub } });
                    if (!patient) {
                        return res.status(404).json({ message: "Patient profile not found" });
                    }
                    // Fetch appointments for the patient
                    appointments = await prisma.appointment.findMany({
                        where: { patientId: patient.id },
                        include: {
                            doctor: {
                                include: { user: true },
                            },
                        },
                    });
                } else if (user.role === "DOCTOR") {
                    // Resolve doctor by supabase user id
                    const doctor = await prisma.doctor.findFirst({ where: { supabaseId: user.sub } });
                    if (!doctor) {
                        return res.status(404).json({ message: "Doctor profile not found" });
                    }
                    // Fetch appointments for the doctor
                    appointments = await prisma.appointment.findMany({
                        where: { doctorId: doctor.id },
                        include: {
                            patient: {
                                include: { user: true },
                            },
                        },
                    });
                } else {
                    return res.status(403).json({ message: "Access Denied" });
                }

                // Map the appointments to include patient and doctor names
                const formattedAppointments = appointments.map((appointment) => ({
                    ...appointment,
                    patientName: appointment.patient?.user?.fullName,
                    doctorName: appointment.doctor?.user?.fullName,
                }));

                res.status(200).json(formattedAppointments);
            } catch (error: any) {
                console.error("Error fetching appointments:", error);
                res.status(500).json({ message: "Internal Server Error", error: error?.message || "Unknown error" });
            }
            break;

        case "POST":
            try {
                if (user.role !== "PATIENT") {
                    return res.status(403).json({ message: "Access Denied: Only patients can create appointments" });
                }

                const { doctorId, date, status } = req.body;

                // Validate request body
                if (!doctorId || !date || !status) {
                    return res.status(400).json({ message: "Missing required fields" });
                }

                console.log("Doctor ID from request:", doctorId);

                // Check if the doctor exists
                const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
                if (!doctor) {
                    return res.status(404).json({ message: "Doctor not found" });
                }

                console.log("Doctor record from database:", doctor);

                // Resolve patient id from token
                const patient = await prisma.patient.findFirst({ where: { supabaseId: user.sub } });
                if (!patient) {
                    return res.status(404).json({ message: "Patient profile not found" });
                }

                // Create the appointment
                const appointment = await prisma.appointment.create({
                    data: {
                        patientId: patient.id,
                        doctorId,
                        date: new Date(date),
                        status,
                    },
                    include: {
                        patient: { include: { user: true } },
                        doctor: { include: { user: true } },
                    },
                });

                // Construct the response with patient and doctor names
                const response = {
                    ...appointment,
                    patientName: appointment.patient.user.fullName,
                    doctorName: appointment.doctor.user.fullName,
                };

                res.status(201).json(response);
            } catch (error: any) {
                console.error("Error creating appointment:", error);
                res.status(500).json({ message: "Internal Server Error", error: error?.message || "Unknown error" });
            }
            break;

        case "PATCH":
            try {
                if (user.role !== "DOCTOR") {
                    return res.status(403).json({ message: "Access Denied: Only doctors can update appointments" });
                }

                const { appointmentId, status } = req.body;

                // Validate request body
                if (!appointmentId || !status) {
                    return res.status(400).json({ message: "Appointment ID and status are required" });
                }

                // Check if the appointment exists and belongs to the authenticated doctor
                const appointment = await prisma.appointment.findUnique({
                    where: { id: appointmentId },
                    include: {
                        doctor: true, // Include the doctor to verify ownership
                    },
                });

                if (!appointment) {
                    return res.status(404).json({ message: "Appointment not found" });
                }

                // Resolve doctor id from token
                const doctor = await prisma.doctor.findFirst({ where: { supabaseId: user.sub } });
                if (!doctor) {
                    return res.status(404).json({ message: "Doctor profile not found" });
                }

                if (appointment.doctorId !== doctor.id) {
                    return res.status(403).json({ message: "Access Denied: You do not own this appointment" });
                }

                // Update the appointment
                const updatedAppointment = await prisma.appointment.update({
                    where: { id: appointmentId },
                    data: {
                        status,
                    },
                    include: {
                        patient: {
                            include: {
                                user: true, // Include the associated User record for the patient
                            },
                        },
                        doctor: {
                            include: {
                                user: true, // Include the associated User record for the doctor
                            },
                        },
                    },
                });

                // Construct the response with patient and doctor names
                const response = {
                    ...updatedAppointment,
                    patientName: updatedAppointment.patient.user.fullName,
                    doctorName: updatedAppointment.doctor.user.fullName,
                };

                res.status(200).json(response);
            } catch (error: any) {
                console.error("Error updating appointment:", error);
                res.status(500).json({ message: "Internal Server Error", error: error?.message || "Unknown error" });
            }
            break;

        default:
            res.status(405).json({ message: "Method Not Allowed" });
    }
}