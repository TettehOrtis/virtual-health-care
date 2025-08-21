import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // GET request to fetch all approved doctors
    if (req.method === "GET") {
        try {
            // Get only approved doctors with their user info
            const doctors = await prisma.doctor.findMany({
                where: { status: 'APPROVED' }, // Only show approved doctors
                select: {
                    id: true,
                    specialization: true,
                    user: {
                        select: {
                            fullName: true,
                            email: true,
                        },
                    },
                },
            });

            // If no doctors exist yet, return empty array
            if (!doctors) {
                return res.status(200).json([]);
            }

            // Return the doctors with calculated/mock values for the frontend
            const doctorsWithExtras = doctors.map(doctor => ({
                ...doctor,
                yearsOfExperience: 5,
                consultationFee: 100,
                rating: 4.5,
                availableToday: Math.random() > 0.5,
            }));

            // Return the doctors with the added fields
            return res.status(200).json(doctorsWithExtras);
        } catch (error: any) {
            console.error("Error fetching doctors:", error);
            return res.status(500).json({ error: "Failed to fetch doctors" });
        }
    }

    // Method not allowed
    return res.status(405).json({ error: "Method not allowed" });
} 