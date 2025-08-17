import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
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

        const { conversationId } = req.query;

        if (!conversationId || typeof conversationId !== 'string') {
            return res.status(400).json({ message: 'Conversation ID is required' });
        }

        // Check if user has access to this conversation
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { patientId: true, doctorId: true }
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Get the user's patient or doctor record to check access
        let userRecordId: string | null = null;
        if (req.user.role === 'PATIENT') {
            const patientRecord = await prisma.patient.findUnique({
                where: { supabaseId: req.user.supabaseId },
                select: { id: true }
            });
            userRecordId = patientRecord?.id || null;
        } else if (req.user.role === 'DOCTOR') {
            const doctorRecord = await prisma.doctor.findUnique({
                where: { supabaseId: req.user.supabaseId },
                select: { id: true }
            });
            userRecordId = doctorRecord?.id || null;
        }

        if (!userRecordId || (conversation.patientId !== userRecordId && conversation.doctorId !== userRecordId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (req.method === 'GET') {
            // Get messages for the conversation using Prisma
            const messages = await prisma.message.findMany({
                where: { conversationId },
                include: {
                    sender: {
                        select: { id: true, fullName: true, email: true }
                    }
                },
                orderBy: { createdAt: 'asc' }
            });

            return res.status(200).json({ messages });
        }

        if (req.method === 'POST') {
            const { content } = req.body;

            if (!content || typeof content !== 'string' || content.trim().length === 0) {
                return res.status(400).json({ message: 'Message content is required' });
            }

            // Create new message using Prisma
            const message = await prisma.message.create({
                data: {
                    conversationId,
                    senderId: req.user.supabaseId, // Use supabaseId as it references User.id
                    content: content.trim()
                },
                include: {
                    sender: {
                        select: { id: true, fullName: true, email: true }
                    }
                }
            });

            return res.status(201).json({ message });
        }

    } catch (error) {
        console.error('Error in messages API:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
}
