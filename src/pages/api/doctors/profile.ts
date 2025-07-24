import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/middleware/auth";

/**
 * Doctor Profile API Handler
 * 
 * This API endpoint handles operations related to a doctor's profile.
 * Supports:
 * - GET: Retrieve doctor profile
 * - PUT: Update doctor profile information
 * 
 * @see https://nextjs.org/docs/api-routes/introduction
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication token and extract userId
    const { supabaseId } = verifyToken(req);
    if (!supabaseId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    /**
     * GET Method: Retrieve doctor profile
     */
    if (req.method === "GET") {
      // Find the doctor profile with associated user data
      const doctor = await prisma.doctor.findUnique({
        where: { supabaseId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              createdAt: true,
              // Exclude password for security
            }
          }
        }
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }

      return res.status(200).json(doctor);
    }

    /**
     * PUT Method: Update doctor profile
     */
    if (req.method === "PUT") {
      const { specialization, phone, address } = req.body;

      // Validate required fields
      if (!specialization && !phone && !address) {
        return res.status(400).json({ error: "No fields to update provided" });
      }

      // Update doctor profile
      const updatedDoctor = await prisma.doctor.update({
        where: { supabaseId },
        data: {
          ...(specialization && { specialization }),
          ...(phone && { phone }),
          ...(address && { address })
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              createdAt: true,
            }
          }
        }
      });

      return res.status(200).json(updatedDoctor);
    }

    // Method not allowed
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error:any) {
    console.error("Error in doctor profile API handler:", error);
    
    // Handle specific errors
    if (error.message?.includes("Unauthorized")) {
      return res.status(401).json({ error: "Unauthorized: " + error.message });
    }
    
    // General server error
    return res.status(500).json({ error: "Internal Server Error" });
  }
}