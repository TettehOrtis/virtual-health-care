import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const {
    email,
    password,
    fullName,
    role,
    dateOfBirth,
    gender,
    phone,
    address,
    specialization
  } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({
      message: "Email, password, full name, and role are required."
    });
  }

  try {
    // Step 1: Create user in Supabase
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName,
          role
        }
      }
    });

    if (authError || !supabaseUser) {
      return res.status(400).json({
        message: "Failed to create user account",
        error: authError?.message || "Unknown error"
      });
    }

    // Step 2: Create user in our database
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        role,
        supabaseId: supabaseUser.id,
        ...(role === 'PATIENT' && {
          patient: {
            create: {
              dateOfBirth: new Date(dateOfBirth).toISOString(),
              gender,
              phone,
              address
            }
          }
        }),
        ...(role === 'DOCTOR' && {
          doctor: {
            create: {
              specialization,
              phone,
              address
            }
          }
        })
      },
      include: {
        patient: role === 'PATIENT' ? true : undefined,
        doctor: role === 'DOCTOR' ? true : undefined
      }
    });

    // Step 3: Send verification email
    const { error: sendEmailError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify`
      }
    });

    if (sendEmailError) {
      console.error("Failed to send verification email:", sendEmailError);
    }

    return res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
