import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Helper function to verify token and get userId
const verifyToken = (req: NextApiRequest): { userId: string } => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error("No token provided");
    }

    const token = authHeader.split(' ')[1];
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
};

// Helper function to get doctor by userId
const getDoctorByUserId = async (userId: string) => {
    const doctor = await prisma.doctor.findFirst({
        where: { userId },
        include: {
            user: {
                select: { fullName: true }
            }
        }
    });

    if (!doctor) {
        throw new Error("Doctor not found");
    }

    return doctor;
};

// CRUD Functions
const getAppointments = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { userId } = verifyToken(req);
        const doctor = await getDoctorByUserId(userId);

        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctor.id
            },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                fullName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        return res.status(200).json(appointments);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "No token provided" || error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({ message: error.message });
            }
            if (error.message === "Doctor not found") {
                return res.status(404).json({ message: error.message });
            }
        }
        console.error("Error in getAppointments:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const createAppointment = async (req: NextApiRequest, res: NextApiResponse) => {
    return res.status(403).json({
        message: "Doctors are not authorized to create appointments directly. Patients must request appointments."
    });
};

const updateAppointment = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { userId } = verifyToken(req);
        const doctor = await getDoctorByUserId(userId);
        const { id, status, notes, date } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Appointment ID is required" });
        }

        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                id,
                doctorId: doctor.id
            }
        });

        if (!existingAppointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (status) {
            const validStatusTransitions: Record<string, string[]> = {
                'PENDING': ['APPROVED', 'REJECTED'],
                'APPROVED': ['COMPLETED', 'CANCELED'],
                'REJECTED': [],
                'COMPLETED': [],
                'CANCELED': []
            };

            const allowedStatuses = validStatusTransitions[existingAppointment.status] || [];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: `Cannot change appointment status from '${existingAppointment.status}' to '${status}'.`
                });
            }
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(notes && { notes }),
                ...(date && { date: new Date(date) })
            },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                fullName: true
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json(updatedAppointment);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "No token provided" || error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({ message: error.message });
            }
            if (error.message === "Doctor not found") {
                return res.status(404).json({ message: error.message });
            }
        }
        console.error("Error in updateAppointment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const deleteAppointment = async (req: NextApiRequest, res: NextApiResponse) => {
    return res.status(403).json({
        message: "Doctors cannot delete appointments. Use the status update to cancel appointments instead."
    });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case "GET":
            return getAppointments(req, res);
        case "POST":
            return createAppointment(req, res);
        case "PUT":
            return updateAppointment(req, res);
        case "DELETE":
            return deleteAppointment(req, res);
        default:
            return res.status(405).json({ message: "Method not allowed" });
    }
}
