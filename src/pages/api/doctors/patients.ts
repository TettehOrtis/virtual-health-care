import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const verifyToken = (req: NextApiRequest): { supabaseId: string } => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error("No token provided");
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { supabaseId: string };
    return decoded;
};

const getDoctorByUserId = async (supabaseId: string) => {
    const doctor = await prisma.doctor.findFirst({
        where: { supabaseId },
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

const getPatients = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { supabaseId } = verifyToken(req);
        const doctor = await getDoctorByUserId(supabaseId);

        // Find patients who have appointments with this doctor
        const patients = await prisma.patient.findMany({
            where: {
                appointments: {
                    some: { doctorId: doctor.id }
                }
            },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                },
                // Include appointments to get the last visit date
                appointments: {
                    where: {
                        doctorId: doctor.id,
                        status: "COMPLETED"
                    },
                    orderBy: {
                        date: 'desc'
                    },
                    take: 1,
                    select: {
                        date: true
                    }
                }
            }
        });

        // Transform data to match frontend expectations
        const enhancedPatients = patients.map(patient => {
            // Extract medical conditions from medical history if available
            const medicalConditions = patient.medicalHistory
                ? [patient.medicalHistory]
                : [];

            // Get the last visit date if available
            const lastVisitDate = patient.appointments.length > 0
                ? patient.appointments[0].date.toISOString()
                : null;

            return {
                id: patient.id,
                user: {
                    fullName: patient.user.fullName,
                    email: patient.user.email
                },
                dateOfBirth: patient.dateOfBirth?.toISOString(),
                gender: patient.gender,
                // Phone and address fields from schema
                phoneNumber: patient.phone,
                address: patient.address,
                // Default status to active since schema doesn't have this field
                status: "active",
                medicalConditions,
                lastVisitDate
            };
        });

        return res.status(200).json(enhancedPatients);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "No token provided" || error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({ message: error.message });
            }
            if (error.message === "Doctor not found") {
                return res.status(404).json({ message: error.message });
            }
        }
        console.error("Error in getPatients:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        return getPatients(req, res);
    }

    return res.status(405).json({ message: "Method not allowed" });
}
