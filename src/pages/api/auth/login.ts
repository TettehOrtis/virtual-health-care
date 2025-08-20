import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use SERVICE_ROLE_KEY on server
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Step 1: Sign in with Supabase
    const {
      data: { session, user },
      error,
    } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !session || !user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Step 2: Check email verification status
    if (!user.email_confirmed_at) {
      return res.status(403).json({
        message: "Email not verified",
        details: "Please verify your email before logging in.",
      });
    }

    // Step 3: Fetch user profile from Prisma using Supabase ID
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { doctor: true, patient: true },
    });

    if (!dbUser) {
      return res.status(404).json({ message: "User profile not found in system" });
    }

    // Step 4: Check that role-specific profile exists
    let doctorId = null;
    let patientId = null;

    if (dbUser.role === "DOCTOR") {
      if (!dbUser.doctor) {
        return res.status(403).json({
          message: "Doctor profile missing. Please contact support.",
        });
      }
      doctorId = dbUser.doctor.id;
    } else if (dbUser.role === "PATIENT") {
      if (!dbUser.patient) {
        return res.status(403).json({
          message: "Patient profile missing. Please contact support.",
        });
      }
      patientId = dbUser.patient.id;
    }

    // Step 5: Generate our own JWT token with the same payload
    const token = jwt.sign(
      {
        sub: user.id,
        role: dbUser.role,
        supabaseId: user.id,  // Add supabaseId for consistency
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
      },
      process.env.JWT_SECRET!
    );

    // Compute redirect URL per role
    const redirectUrl = dbUser.role === "DOCTOR"
      ? `/doctor-frontend/${doctorId}/dashboard`
      : dbUser.role === "PATIENT"
        ? `/patient-frontend/${patientId}/dashboard`
        : "/Admin/adminDashboard";

    // Return success with redirect and user info
    return res.status(200).json({
      token,
      message: "Login successful",
      user: {
        id: dbUser.id,
        fullName: dbUser.fullName,
        email: user.email,
        role: dbUser.role,
      },
      redirectUrl,
    });
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong", error: String(err) });
  }
}
