import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/middleware/auth"; // Import the authenticate middleware
import { Role } from "@prisma/client"; // Import the Role enum from Prisma

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        // Extract the action from the query parameters
        const { action } = req.query;

        if (typeof action !== "string") {
            return res.status(400).json({ message: "Invalid action" });
        }

        switch (action) {
            case "stats":
                if (req.method !== "GET") {
                    return res.status(405).json({ message: "Method Not Allowed" });
                }
                return await getStats(req, res);

            case "patients":
                if (req.method !== "GET") {
                    return res.status(405).json({ message: "Method Not Allowed" });
                }
                return await getPatients(req, res);

            case "doctors":
                if (req.method !== "GET") {
                    return res.status(405).json({ message: "Method Not Allowed" });
                }
                return await getDoctors(req, res);

            case "appointments":
                if (req.method !== "GET") {
                    return res.status(405).json({ message: "Method Not Allowed" });
                }
                return await getAppointments(req, res);

            case "disable":
                if (req.method !== "POST") {
                    return res.status(405).json({ message: "Method Not Allowed" });
                }
                return await disableUser(req, res);

            default:
                return res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        res.status(500).json({ message: "Internal Server Error", error: errorMessage });
    }
};

// Get system statistics
async function getStats(req: NextApiRequest, res: NextApiResponse) {
    const totalPatients = await prisma.patient.count();
    const totalDoctors = await prisma.doctor.count();
    const totalAppointments = await prisma.appointment.count();

    res.status(200).json({ totalPatients, totalDoctors, totalAppointments });
}

// Get all patients
async function getPatients(req: NextApiRequest, res: NextApiResponse) {
    const patients = await prisma.patient.findMany({
        include: { user: true }, // Include user details
    });

    res.status(200).json(patients);
}

// Get all doctors
async function getDoctors(req: NextApiRequest, res: NextApiResponse) {
    const doctors = await prisma.doctor.findMany({
        include: { user: true }, // Include user details
    });

    res.status(200).json(doctors);
}

// Get all appointments
async function getAppointments(req: NextApiRequest, res: NextApiResponse) {
    const appointments = await prisma.appointment.findMany({
        include: {
            patient: { include: { user: true } }, // Include patient details
            doctor: { include: { user: true } }, // Include doctor details
        },
    });

    res.status(200).json(appointments);
}

// Disable a user account
async function disableUser(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Disable the user by deleting their account
        await prisma.user.delete({
            where: { id: userId },
        });

        res.status(200).json({ message: "User account disabled successfully" });
    } catch (error) {
        console.error("Error disabling user:", error);
        res.status(500).json({ message: "Failed to disable user account" });
    }
}

// Wrap the handler with the authenticate middleware
export default authenticate(Role.ADMIN)(handler);