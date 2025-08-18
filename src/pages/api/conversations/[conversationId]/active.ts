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
    if (req.method !== 'GET') {
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

        // Find conversation and verify access using Prisma
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { patientId: true, doctorId: true }
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Resolve current user's patient/doctor record id from supabaseId
        let userRecordId: string | null = null;
        if (req.user.role === 'PATIENT') {
            const patient = await prisma.patient.findUnique({
                where: { supabaseId: req.user.supabaseId },
                select: { id: true }
            });
            userRecordId = patient?.id || null;
        } else if (req.user.role === 'DOCTOR') {
            const doctor = await prisma.doctor.findUnique({
                where: { supabaseId: req.user.supabaseId },
                select: { id: true }
            });
            userRecordId = doctor?.id || null;
        }

        if (!userRecordId || (conversation.patientId !== userRecordId && conversation.doctorId !== userRecordId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get the most recent completed appointment between this patient and doctor
        const latestAppointment = await prisma.appointment.findFirst({
            where: {
                patientId: conversation.patientId,
                doctorId: conversation.doctorId,
                status: 'COMPLETED',
                NOT: { endTime: null }
            },
            orderBy: { endTime: 'desc' },
            select: { endTime: true }
        });

        if (!latestAppointment || !latestAppointment.endTime) {
            return res.status(200).json({
                active: false,
                reason: 'No completed appointments found. Please book an appointment first.'
            });
        }

        // Check if chat window is still open (7 days after appointment end)
        const appointmentEndTime = new Date(latestAppointment.endTime);
        const chatWindowEnd = new Date(appointmentEndTime.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 days
        const now = new Date();

        if (now > chatWindowEnd) {
            return res.status(200).json({
                active: false,
                reason: 'Chat window has expired. Please book a new appointment to continue chatting.'
            });
        }

        // Calculate remaining time
        const remainingTime = chatWindowEnd.getTime() - now.getTime();
        const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));

        return res.status(200).json({
            active: true,
            reason: `Chat is active. You can chat for ${remainingDays} more day(s).`,
            remainingDays,
            appointmentEndTime: latestAppointment.endTime,
            chatWindowEnd: chatWindowEnd.toISOString()
        });

    } catch (error) {
        console.error('Error in chat active check API:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
}
