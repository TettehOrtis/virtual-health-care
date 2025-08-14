import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/middleware/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        // Verify token and get user
        const user = verifyToken(req);
        console.log("Authenticated User:", user);

        if (!user || user.role !== "PATIENT") {
            return res.status(403).json({ message: "Access Denied" });
        }

        // Find the patient by supabaseId to get internal patient.id
        const patient = await prisma.patient.findUnique({
            where: { supabaseId: user.supabaseId },
        });

        if (!patient) {
            return res.status(404).json({ message: "Patient profile not found" });
        }

        // Fetch patient's prescriptions using patient.id
        const prescriptions = await prisma.prescription.findMany({
            where: { patientId: patient.id },
            include: { doctor: { include: { user: true } } },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json(prescriptions);
    } catch (error: any) {
        console.error("Error fetching prescriptions:", error);
        res.status(500).json({ message: "Internal Server Error", error: error?.message || "Unknown error" });
    }
}