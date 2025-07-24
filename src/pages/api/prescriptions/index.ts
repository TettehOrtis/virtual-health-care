import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/middleware/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Verify token and get user
    const user = verifyToken(req);
    console.log("Authenticated User:", user);

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    switch (req.method) {
        case "GET":
            try {
                let prescriptions;
                if (user.role === "PATIENT") {
                    // Fetch prescriptions for the patient
                    prescriptions = await prisma.prescription.findMany({
                        where: { patientId: user.supabaseId },
                        include: {
                            patient: {
                                include: {
                                    user: true,
                                },
                            },
                            doctor: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    });
                } else if (user.role === "DOCTOR") {
                    // Fetch prescriptions for the doctor
                    prescriptions = await prisma.prescription.findMany({
                        where: { doctorId: user.supabaseId },
                        include: {
                            patient: {
                                include: {
                                    user: true,
                                },
                            },
                            doctor: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    });
                } else {
                    return res.status(403).json({ message: "Access Denied" });
                }

                // Map the prescriptions to include patient and doctor names
                const formattedPrescriptions = prescriptions.map((prescription) => ({
                    ...prescription,
                    patientName: prescription.patient?.user?.fullName ?? null,
                    doctorName: prescription.doctor?.user?.fullName ?? null,
                }));

                res.status(200).json(formattedPrescriptions);
            } catch (error: any) {
                console.error("Error fetching prescriptions:", error);
                res.status(500).json({ message: "Internal Server Error", error: error?.message || "Unknown error" });
            }
            break;

        case "POST":
            try {
                if (user.role !== "DOCTOR") {
                    return res.status(403).json({ message: "Access Denied: Only doctors can create prescriptions" });
                }

                const { patientId, medication, dosage, instructions } = req.body;

                // Validate request body
                if (!patientId || !medication || !dosage || !instructions) {
                    return res.status(400).json({ message: "Missing required fields" });
                }

                console.log("Patient ID from request:", patientId);

                // Check if the patient exists
                const patient = await prisma.patient.findUnique({ where: { id: patientId } });
                if (!patient) {
                    return res.status(404).json({ message: "Patient not found" });
                }

                console.log("Patient record from database:", patient);

                // Fetch the doctor record using the authenticated user's userId
                const doctor = await prisma.doctor.findUnique({ where: { supabaseId: user.supabaseId } });
                if (!doctor) {
                    return res.status(404).json({ message: "Doctor not found" });
                }

                console.log("Doctor record from database:", doctor);

                // Create the prescription
                const prescription = await prisma.prescription.create({
                    data: {
                        patientId,
                        doctorId: doctor.id, // Use the doctor's id from the Doctor table
                        medication,
                        dosage,
                        instructions,
                    },
                    include: {
                        patient: {
                            include: {
                                user: true, // Include the associated User record for the patient
                            },
                        },
                        doctor: {
                            include: {
                                user: true, // Include the associated User record for the doctor
                            },
                        },
                    },
                });

                // Construct the response with patient and doctor names
                const response = {
                    ...prescription,
                    patientName: prescription.patient.user.fullName,
                    doctorName: prescription.doctor.user.fullName,
                };

                res.status(201).json(response);
            } catch (error: any) {
                console.error("Error creating prescription:", error);
                res.status(500).json({ message: "Internal Server Error", error: error?.message || "Unknown error" });
            }
            break;

        case "PATCH":
            try {
                if (user.role !== "DOCTOR") {
                    return res.status(403).json({ message: "Access Denied: Only doctors can update prescriptions" });
                }

                const { prescriptionId, medication, dosage, instructions } = req.body;

                // Validate request body
                if (!prescriptionId) {
                    return res.status(400).json({ message: "Prescription ID is required" });
                }

                // Check if the prescription exists and belongs to the authenticated doctor
                const prescription = await prisma.prescription.findUnique({
                    where: { id: prescriptionId },
                    include: {
                        doctor: true, // Include the doctor to verify ownership
                    },
                });

                if (!prescription) {
                    return res.status(404).json({ message: "Prescription not found" });
                }

                if (prescription.doctorId !== user.supabaseId) {
                    return res.status(403).json({ message: "Access Denied: You do not own this prescription" });
                }

                // Update the prescription
                const updatedPrescription = await prisma.prescription.update({
                    where: { id: prescriptionId },
                    data: {
                        medication: medication !== undefined ? medication : prescription.medication,
                        dosage: dosage !== undefined ? dosage : prescription.dosage,
                        instructions: instructions !== undefined ? instructions : prescription.instructions,
                    },
                    include: {
                        patient: {
                            include: {
                                user: true, // Include the associated User record for the patient
                            },
                        },
                        doctor: {
                            include: {
                                user: true, // Include the associated User record for the doctor
                            },
                        },
                    },
                });

                // Construct the response with patient and doctor names
                const response = {
                    ...updatedPrescription,
                    patientName: updatedPrescription.patient.user.fullName,
                    doctorName: updatedPrescription.doctor.user.fullName,
                };

                res.status(200).json(response);
            } catch (error: any) {
                console.error("Error updating prescription:", error);
                res.status(500).json({ message: "Internal Server Error", error: error?.message || "Unknown error" });
            }
            break;

        default:
            res.status(405).json({ message: "Method Not Allowed" });
    }
}