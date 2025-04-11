import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/middleware/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const user = verifyToken(req);
        if (user.role !== "PATIENT") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const patient = await prisma.patient.findUnique({
            where: { userId: user.userId },
            include: { user: true, appointments: true, prescriptions: true },
        });

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        res.status(200).json(patient);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ 
            message: "Internal Server Error", 
            error: errorMessage 
        });
    }
}