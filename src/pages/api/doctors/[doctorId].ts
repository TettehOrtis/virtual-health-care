import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { doctorId } = req.query;

  if (req.method === "GET") {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId as string },
        include: { user: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }

      return res.status(200).json(doctor);
    } catch (error) {
      console.error("Error fetching doctor data:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}