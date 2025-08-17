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
    if (req.method !== 'POST') {
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

        const { appointmentId } = req.body;

        if (!appointmentId) {
            return res.status(400).json({ message: 'Appointment ID is required' });
        }

        // Get appointment details using Prisma
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: { patientId: true, doctorId: true, status: true }
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Only create conversation for completed appointments
        if (appointment.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Can only create conversations for completed appointments' });
        }

        // Check if conversation already exists using Prisma
        const existingConversation = await prisma.conversation.findUnique({
            where: {
                patientId_doctorId: {
                    patientId: appointment.patientId,
                    doctorId: appointment.doctorId
                }
            }
        });

        if (existingConversation) {
            return res.status(200).json({
                message: 'Conversation already exists',
                conversation: existingConversation
            });
        }

        // Create new conversation using Prisma
        const conversation = await prisma.conversation.create({
            data: {
                patientId: appointment.patientId,
                doctorId: appointment.doctorId
            }
        });

        return res.status(201).json({
            message: 'Conversation created successfully',
            conversation
        });

    } catch (error) {
        console.error('Error in create conversation API:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
}
