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

        // Fetch patient's prescriptions
        const prescriptions = await prisma.prescription.findMany({
            where: { patientId: user.supabaseId },
            include: { doctor: { include: { user: true } } }, // Include doctor details
        });

        res.status(200).json(prescriptions);
    } catch (error: any) {
        console.error("Error fetching prescriptions:", error);
        res.status(500).json({ message: "Internal Server Error", error: error?.message || "Unknown error" });
    }
}