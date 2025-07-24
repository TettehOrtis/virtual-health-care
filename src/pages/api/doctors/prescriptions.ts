import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const verifyToken = (req: NextApiRequest): { supabaseId: string; role: string } => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error("No token provided");
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { supabaseId: string; role: string };
    return decoded;
};

const getDoctorByUserId = async (supabaseId: string) => {
    const doctor = await prisma.doctor.findUnique({
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

const getPrescriptions = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { supabaseId, role } = verifyToken(req);
        if (role !== "DOCTOR") {
            return res.status(403).json({ message: "Access denied: Only doctors can view prescriptions" });
        }

        const doctor = await getDoctorByUserId(supabaseId);
        const prescriptions = await prisma.prescription.findMany({
            where: { doctorId: doctor.id },
            include: {
                patient: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform the data to match our frontend interface
        const formattedPrescriptions = prescriptions.map(prescription => ({
            ...prescription,
            patientName: prescription.patient?.user?.fullName,
            createdAt: prescription.createdAt.toISOString()
        }));

        res.status(200).json(formattedPrescriptions);
    } catch (error: any) {
        console.error("Error fetching prescriptions:", error);
        if (error.message === "No token provided") {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (error.message === "Doctor not found") {
            return res.status(404).json({ message: "Doctor not found" });
        }
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

const createPrescription = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { supabaseId, role } = verifyToken(req);
        if (role !== "DOCTOR") {
            return res.status(403).json({ message: "Access denied: Only doctors can create prescriptions" });
        }

        const doctor = await getDoctorByUserId(supabaseId);
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
                        user: true
                    }
                }
            }
        });

        // Transform the response to match the frontend interface
        const formattedPrescription = {
            ...prescription,
            patientName: prescription.patient?.user?.fullName,
            createdAt: prescription.createdAt.toISOString()
        };

        res.status(201).json(formattedPrescription);
    } catch (error: any) {
        console.error("Error creating prescription:", error);
        if (error.message === "No token provided") {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (error.message === "Doctor not found") {
            return res.status(404).json({ message: "Doctor not found" });
        }
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            return getPrescriptions(req, res);
        case 'POST':
            return createPrescription(req, res);
        default:
            res.status(405).json({ message: 'Method not allowed' });
    }
}
