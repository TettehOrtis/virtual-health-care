import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { verifyToken } from '../../../middleware/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify token
    const user = verifyToken(req)
    console.log("Authenticated User:", user)

    if (!user || user.role !== "PATIENT") {
      return res.status(403).json({ message: "Access Denied" })
    }

    if (req.method === "GET") {
      // Get patient from database
      const patient = await prisma.patient.findUnique({
        where: { supabaseId: user.supabaseId },
        include: { user: true }
      })

      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" })
      }

      // Fetch medical records for the patient
      const medicalRecords = await prisma.medicalRecord.findMany({
        where: { patientId: patient.id },
        orderBy: { uploadedAt: 'desc' }
      })

      return res.status(200).json(medicalRecords)
    }

    if (req.method === "DELETE") {
      const { recordId } = req.query

      if (!recordId || typeof recordId !== 'string') {
        return res.status(400).json({ message: "Record ID is required" })
      }

      // Get patient from database
      const patient = await prisma.patient.findUnique({
        where: { supabaseId: user.supabaseId }
      })

      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" })
      }

      // Check if record belongs to patient
      const medicalRecord = await prisma.medicalRecord.findFirst({
        where: {
          id: recordId,
          patientId: patient.id
        }
      })

      if (!medicalRecord) {
        return res.status(404).json({ message: "Medical record not found" })
      }

      // Delete the record
      await prisma.medicalRecord.delete({
        where: { id: recordId }
      })

      return res.status(200).json({ message: "Medical record deleted successfully" })
    }

    return res.status(405).json({ message: "Method Not Allowed" })
  } catch (error: any) {
    console.error("Error in medical records API:", error)
    return res.status(500).json({ message: "Internal Server Error", error: error?.message || "Unknown error" })
  }
} 