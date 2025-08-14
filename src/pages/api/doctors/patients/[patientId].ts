import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/middleware/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        try {
            const { supabaseId } = verifyToken(req) as { supabaseId: string };
            const { patientId } = req.query;

            if (!patientId || typeof patientId !== 'string') {
                return res.status(400).json({ message: "Patient ID is required" });
            }

            const doctor = await prisma.doctor.findUnique({
                where: { supabaseId } 
            });
            if (!doctor) {
                return res.status(404).json({ message: "Doctor not found" });
            }

            if (!doctor) {
                return res.status(404).json({ message: "Doctor not found" });
            }

            // First check if the doctor has a relationship with this patient
            const hasRelationship = await prisma.patient.findFirst({
                where: {
                    id: patientId,
                    OR: [
                        {
                            prescriptions: {
                                some: { doctorId: doctor.id }
                            }
                        },
                        {
                            appointments: {
                                some: { doctorId: doctor.id }
                            }
                        }
                    ]
                }
            });

            if (!hasRelationship) {
                return res.status(403).json({ message: "You don't have permission to view this patient" });
            }

            // Get detailed patient information
            const patient = await prisma.patient.findUnique({
                where: { id: patientId },
                include: {
                    user: {
                        select: {
                            fullName: true,
                            email: true
                        }
                    },
                    appointments: {
                        where: {
                            doctorId: doctor.id
                        },
                        orderBy: {
                            date: 'desc'
                        }
                    },
                    prescriptions: {
                        where: {
                            doctorId: doctor.id
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    },
                    MedicalRecord: {
                        orderBy: { uploadedAt: 'desc' },
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            fileUrl: true,
                            fileType: true,
                            fileName: true,
                            uploadedAt: true,
                        }
                    }
                }
            });

            if (!patient) {
                return res.status(404).json({ message: "Patient not found" });
            }

            return res.status(200).json(patient);
        } catch (error) {
            console.error("Error fetching patient:", error);
            return res.status(500).json({ message: "Failed to fetch patient" });
        }
    }

    res.status(405).json({ message: "Method not allowed" });
} 