import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { fullName, email, password, role, dateOfBirth, gender, phone, address, specialization } = req.body;

    // Log the incoming request for debugging
    console.log("Incoming Registration Request:", {
      fullName, email, role, specialization,
      hasDateOfBirth: !!dateOfBirth,
      hasGender: !!gender,
      hasPhone: !!phone,
      hasAddress: !!address,
      // Don't log the password for security reasons
    });

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        message: "Missing required fields",
        details: "Full name, email, password, and role are required."
      });
    }

    // Role-specific validation
    if (role === "PATIENT" && (!dateOfBirth || !gender)) {
      return res.status(400).json({
        message: "Missing required patient fields",
        details: "Date of birth and gender are required for patient registration."
      });
    }

    if (role === "DOCTOR" && !specialization) {
      return res.status(400).json({
        message: "Missing required doctor fields",
        details: "Specialization is required for doctor registration."
      });
    }

    // Check if the email already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        doctor: true,
        patient: true
      }
    });

    if (existingUser) {
      // If the user exists but has no doctor/patient profile, we could repair it here
      if (role === "DOCTOR" && !existingUser.doctor) {
        try {
          // Attempt to create the missing doctor profile
          const doctor = await prisma.doctor.create({
            data: {
              userId: existingUser.id,
              specialization,
              phone: phone || "",
              address: address || "",
            },
          });

          return res.status(200).json({
            message: "Doctor profile created for existing user",
            user: {
              id: existingUser.id,
              fullName: existingUser.fullName,
              email: existingUser.email,
              role: existingUser.role,
            },
            doctor: {
              id: doctor.id,
              specialization: doctor.specialization
            }
          });
        } catch (repairError) {
          console.error("Failed to repair doctor profile:", repairError);
          // Continue to the normal conflict response
        }
      }

      // Normal conflict response
      return res.status(409).json({
        message: "Email already registered",
        details: "This email address is already associated with an account. Please use a different email or try logging in."
      });
    }

    // Use a transaction to ensure both user and role-specific profile are created
    const result = await prisma.$transaction(async (prisma) => {
      // Create a new user
      const user = await prisma.user.create({
        data: {
          fullName,
          email,
          password, // Store the password directly without hashing
          role,
        },
      });

      // Based on the role, create additional profile
      if (role === "PATIENT") {
        const patient = await prisma.patient.create({
          data: {
            userId: user.id,
            dateOfBirth: new Date(dateOfBirth),
            gender,
            phone: phone || "",
            address: address || "",
          },
        });

        return { user, patient };
      } else if (role === "DOCTOR") {
        const doctor = await prisma.doctor.create({
          data: {
            userId: user.id,
            specialization,
            phone: phone || "",
            address: address || "",
          },
        });

        return { user, doctor };
      }

      return { user };
    });

    // Return success response (excluding password)
    const { user, patient, doctor } = result;
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword,
      ...(patient && { patient: { id: patient.id } }),
      ...(doctor && { doctor: { id: doctor.id } })
    });
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle Prisma errors
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({
        message: "Email already registered",
        details: "This email address is already associated with an account."
      });
    }

    // Log detailed error for debugging
    console.error("Registration Error:", error);

    return res.status(500).json({
      message: "Registration failed",
      details: error.message || "An internal server error occurred"
    });
  }
}