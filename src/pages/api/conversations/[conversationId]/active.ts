import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '../../../../lib/supabaseServer';
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

        // Check if user has access to this conversation
        const { data: conversation, error: conversationError } = await supabaseServer
            .from('conversations')
            .select('patientId, doctorId')
            .eq('id', conversationId)
            .single();

        if (conversationError || !conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        if (conversation.patientId !== req.user.id && conversation.doctorId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get the most recent appointment between this patient and doctor
        const { data: latestAppointment, error: appointmentError } = await supabaseServer
            .from('appointments')
            .select('endTime, status')
            .eq('patientId', conversation.patientId)
            .eq('doctorId', conversation.doctorId)
            .eq('status', 'COMPLETED')
            .order('endTime', { ascending: false })
            .limit(1)
            .single();

        if (appointmentError || !latestAppointment || !latestAppointment.endTime) {
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
