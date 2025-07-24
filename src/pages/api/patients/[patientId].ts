import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/middleware/auth";

/**
 * Patient Detail API Handler
 * 
 * This API endpoint handles operations related to a specific patient, identified by patientId.
 * Supports GET (retrieve patient data) and PUT (update patient data) operations.
 * 
 * Security:
 * - Verifies authentication token for all operations
 * - Ensures users can only access/modify their own data (patient) or data they're authorized for (doctor)
 * 
 * @see https://nextjs.org/docs/api-routes/dynamic-api-routes
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication token and extract userId
    const { supabaseId } = verifyToken(req);
    if (!supabaseId) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Extract patientId from URL query parameters
    const { patientId } = req.query;
    if (!patientId || typeof patientId !== 'string') {
      return res.status(400).json({ error: "Bad Request: Patient ID is required" });
    }

    // Find the user to determine their role (patient/doctor)
    const user = await prisma.user.findUnique({
      where: { id: supabaseId },
      select: { role: true, supabaseId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check authorization: patients can only access their own data
    if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { supabaseId: user.supabaseId },
        select: { id: true }
      });

      if (!patient || patient.id !== patientId) {
        return res.status(403).json({ error: "Forbidden: You can only access your own data" });
      }
    }

    // Doctors are allowed to access patient data if they have a relationship with the patient
    // (via appointments or prescriptions)
    if (user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { supabaseId: user.supabaseId }
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }

      // Check if doctor has a relationship with this patient
      const hasRelationship = await prisma.patient.findFirst({
        where: {
          id: patientId,
          OR: [
            {
              appointments: {
                some: { doctorId: doctor.id }
              }
            },
            {
              prescriptions: {
                some: { doctorId: doctor.id }
              }
            }
          ]
        }
      });

      if (!hasRelationship) {
        return res.status(403).json({ error: "Forbidden: No relationship with this patient" });
      }
    }

    /**
     * GET Method Handler - Retrieve patient data
     * 
     * Returns detailed patient information including associated user data,
     * appointments, prescriptions, and medical history (if authorized).
     */
    if (req.method === "GET") {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              // Exclude sensitive fields like password
            }
          },
          appointments: {
            include: {
              doctor: {
                include: {
                  user: {
                    select: { fullName: true }
                  }
                }
              }
            },
            orderBy: { date: 'desc' }
          },
          prescriptions: {
            include: {
              doctor: {
                include: {
                  user: {
                    select: { fullName: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      return res.status(200).json(patient);
    }

    /**
     * PUT Method Handler - Update patient data
     * 
     * Updates patient information such as phone, address, and medical history.
     * Note: Critical fields like userId, id cannot be updated through this endpoint.
     */
    if (req.method === "PUT") {
      const { phone, address, medicalHistory, dateOfBirth, gender } = req.body;

      // Update patient record with validated fields
      const updatedPatient = await prisma.patient.update({
        where: { id: patientId },
        data: {
          ...(phone && { phone }),
          ...(address && { address }),
          ...(medicalHistory && { medicalHistory }),
          ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
          ...(gender && { gender })
        },
        include: {
          user: {
            select: {
              fullName: true,
              email: true
            }
          }
        }
      });

      return res.status(200).json(updatedPatient);
    }

    // Method not allowed
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error:any) {
    console.error("Error in patient API handler:", error);

    // Handle specific errors with appropriate status codes
    if (error.message?.includes("Unauthorized")) {
      return res.status(401).json({ error: "Unauthorized: " + error.message });
    }

    if (error.message?.includes("Forbidden")) {
      return res.status(403).json({ error: "Forbidden: " + error.message });
    }

    // General server error
    return res.status(500).json({ error: "Internal Server Error" });
  }
}