import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends NextApiRequest {
    user?: {
        id: string;
        role: string;
        supabaseId: string;
    };
}

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        if (!decoded) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = {
            id: decoded.id,
            role: decoded.role,
            supabaseId: decoded.supabaseId
        };

        if (req.method === 'GET') {
            // Get conversations for the authenticated user using Prisma
            let conversations;

            if (req.user.role === 'PATIENT') {
                // For patients, get their patient record first
                const patientRecord = await prisma.patient.findUnique({
                    where: { supabaseId: req.user.supabaseId }
                });

                if (!patientRecord) {
                    return res.status(404).json({ message: 'Patient record not found' });
                }

                // Get conversations where this patient is involved
                conversations = await prisma.conversation.findMany({
                    where: { patientId: patientRecord.id },
                    include: {
                        patient: {
                            include: {
                                user: {
                                    select: { id: true, fullName: true, email: true }
                                }
                            }
                        },
                        doctor: {
                            include: {
                                user: {
                                    select: { id: true, fullName: true, email: true }
                                }
                            }
                        },
                        messages: {
                            include: {
                                sender: {
                                    select: { id: true, fullName: true }
                                }
                            },
                            orderBy: { createdAt: 'asc' }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            } else if (req.user.role === 'DOCTOR') {
                // For doctors, get their doctor record first
                const doctorRecord = await prisma.doctor.findUnique({
                    where: { supabaseId: req.user.supabaseId }
                });

                if (!doctorRecord) {
                    return res.status(404).json({ message: 'Doctor record not found' });
                }

                // Get conversations where this doctor is involved
                conversations = await prisma.conversation.findMany({
                    where: { doctorId: doctorRecord.id },
                    include: {
                        patient: {
                            include: {
                                user: {
                                    select: { id: true, fullName: true, email: true }
                                }
                            }
                        },
                        doctor: {
                            include: {
                                user: {
                                    select: { id: true, fullName: true, email: true }
                                }
                            }
                        },
                        messages: {
                            include: {
                                sender: {
                                    select: { id: true, fullName: true }
                                }
                            },
                            orderBy: { createdAt: 'asc' }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            } else {
                return res.status(403).json({ message: 'Invalid user role' });
            }

            return res.status(200).json({ conversations });
        }

        if (req.method === 'POST') {
            const { patientId, doctorId } = req.body;

            if (!patientId || !doctorId) {
                return res.status(400).json({ message: 'Patient ID and Doctor ID are required' });
            }

            // Check if user is authorized to create this conversation
            if (req.user.role === 'PATIENT') {
                // For patients, check if they're creating a conversation for themselves
                const patientRecord = await prisma.patient.findUnique({
                    where: { supabaseId: req.user.supabaseId }
                });

                if (!patientRecord || patientRecord.id !== patientId) {
                    return res.status(403).json({ message: 'Access denied' });
                }
            } else if (req.user.role === 'DOCTOR') {
                // For doctors, check if they're creating a conversation for themselves
                const doctorRecord = await prisma.doctor.findUnique({
                    where: { supabaseId: req.user.supabaseId }
                });

                if (!doctorRecord || doctorRecord.id !== doctorId) {
                    return res.status(403).json({ message: 'Access denied' });
                }
            }

            // Check if conversation already exists
            const existingConversation = await prisma.conversation.findUnique({
                where: {
                    patientId_doctorId: {
                        patientId,
                        doctorId
                    }
                }
            });

            if (existingConversation) {
                return res.status(200).json({ conversation: existingConversation });
            }

            // Create new conversation
            const conversation = await prisma.conversation.create({
                data: {
                    patientId,
                    doctorId
                }
            });

            return res.status(201).json({ conversation });
        }

    } catch (error) {
        console.error('Error in conversations API:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
}
