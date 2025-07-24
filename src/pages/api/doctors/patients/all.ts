import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/middleware/auth";

/**
 * Doctor's Patients API Handler
 * 
 * This API endpoint handles retrieving all patients associated with a doctor.
 * 
 * @see https://nextjs.org/docs/api-routes/introduction
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Only allow GET requests
        if (req.method !== "GET") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        // Verify authentication token and extract userId
        const { supabaseId } = verifyToken(req);
        if (!supabaseId) {
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }

        // Find the doctor
        const doctor = await prisma.doctor.findUnique({
            where: { supabaseId }
        });

        if (!doctor) {
            return res.status(404).json({ error: "Doctor profile not found" });
        }

        // Get all patients who have appointments or prescriptions with this doctor
        const patients = await prisma.patient.findMany({
            where: {
                OR: [
                    {
                        appointments: {
                            some: {
                                doctorId: doctor.id
                            }
                        }
                    },
                    {
                        prescriptions: {
                            some: {
                                doctorId: doctor.id
                            }
                        }
                    }
                ]
            },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        appointments: {
                            where: {
                                doctorId: doctor.id
                            }
                        },
                        prescriptions: {
                            where: {
                                doctorId: doctor.id
                            }
                        }
                    }
                },
                // Get the most recent appointment as last visit date
                appointments: {
                    where: {
                        doctorId: doctor.id,
                        status: 'COMPLETED'
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

        // Format the response to include lastVisitDate
        const formattedPatients = patients.map(patient => {
            const lastVisit = patient.appointments.length > 0 ? patient.appointments[0].date : null;

            return {
                id: patient.id,
                user: patient.user,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                phone: patient.phone,
                address: patient.address,
                lastVisitDate: lastVisit,
                appointmentCount: patient._count.appointments,
                prescriptionCount: patient._count.prescriptions
            };
        });

        return res.status(200).json(formattedPatients);
    } catch (error: any) {
        console.error("Error in patients/all API handler:", error);

        // Handle specific errors
        if (error.message?.includes("Unauthorized")) {
            return res.status(401).json({ error: "Unauthorized: " + error.message });
        }

        // General server error
        return res.status(500).json({ error: "Internal Server Error" });
    }
} 