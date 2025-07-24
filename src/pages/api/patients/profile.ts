import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/middleware/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Verify token
        const user = verifyToken(req);
        console.log("Authenticated User:", user);

        if (!user || user.role !== "PATIENT") {
            return res.status(403).json({ message: "Access Denied" });
        }

        if (req.method === "GET") {
            // Fetch patient profile
            const patient = await prisma.patient.findUnique({
                where: { supabaseId: user.supabaseId },
                include: { user: true },
            });

            if (!patient) {
                return res.status(404).json({ message: "Patient profile not found" });
            }

            return res.status(200).json(patient);
        }

        if (req.method === "PATCH") {
            const { phone, address, medicalHistory, gender } = req.body;

            // Update patient profile
            const updatedPatient = await prisma.patient.update({
                where: { supabaseId: user.supabaseId },
                data: {
                    phone: phone ? phone : undefined,
                    address: address ? address : undefined,
                    medicalHistory: medicalHistory ? medicalHistory : undefined,
                    gender: gender ? gender : undefined,
                },
            });

            return res.status(200).json({ message: "Profile updated successfully", updatedPatient });
        }

        return res.status(405).json({ message: "Method Not Allowed" });
    } catch (error: any) {
        console.error("Error in patient profile API:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error?.message || "Unknown error" });
    }
}
