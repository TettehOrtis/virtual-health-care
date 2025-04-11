import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const verifyToken = (req: NextApiRequest): { userId: string } => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error("No token provided");
    }

    const token = authHeader.split(' ')[1];
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
};

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

const getPrescriptions = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { userId } = verifyToken(req);
        const doctor = await getDoctorByUserId(userId);

        const prescriptions = await prisma.prescription.findMany({
            where: { doctorId: doctor.id },
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
                createdAt: 'desc'
            }
        });

        return res.status(200).json(prescriptions);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "No token provided" || error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({ message: error.message });
            }
            if (error.message === "Doctor not found") {
                return res.status(404).json({ message: error.message });
            }
        }
        console.error("Error in getPrescriptions:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const createPrescription = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { userId } = verifyToken(req);
        const doctor = await getDoctorByUserId(userId);
        const { patientId, medication, dosage, instructions } = req.body;

        if (!patientId || !medication || !dosage) {
            return res.status(400).json({ message: "Patient ID, medication, and dosage are required" });
        }

        // Check if patient exists
        const patient = await prisma.patient.findUnique({
            where: { id: patientId }
        });

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const prescription = await prisma.prescription.create({
            data: {
                doctorId: doctor.id,
                patientId,
                medication,
                dosage,
                instructions: instructions || ""
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

        return res.status(201).json(prescription);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "No token provided" || error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({ message: error.message });
            }
            if (error.message === "Doctor not found") {
                return res.status(404).json({ message: error.message });
            }
        }
        console.error("Error in createPrescription:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case "GET":
            return getPrescriptions(req, res);
        case "POST":
            return createPrescription(req, res);
        default:
            return res.status(405).json({ message: "Method not allowed" });
    }
}
