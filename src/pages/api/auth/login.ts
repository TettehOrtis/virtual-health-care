import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctor: true,
        patient: true
      }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check for role-specific profiles
    if (user.role === 'DOCTOR' && !user.doctor) {
      return res.status(403).json({
        message: "Doctor profile not found",
        details: "Your account is registered but missing a doctor profile. Please contact support."
      });
    }

    if (user.role === 'PATIENT' && !user.patient) {
      return res.status(403).json({
        message: "Patient profile not found",
        details: "Your account is registered but missing a patient profile. Please contact support."
      });
    }

    let doctorId = null;
    let patientId = null;

    if (user.role === "DOCTOR" && user.doctor) {
      doctorId = user.doctor.id;
    } else if (user.role === "PATIENT" && user.patient) {
      patientId = user.patient.id;
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        doctorId,
        patientId
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    // Set token in HTTP-only cookie
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=3600`);

    const responseData = {
      token,
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      redirectUrl: user.role === "DOCTOR"
        ? `/doctor-frontend/${doctorId}/dashboard`
        : `/patient-frontend/${patientId}/dashboard`
    };

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
}