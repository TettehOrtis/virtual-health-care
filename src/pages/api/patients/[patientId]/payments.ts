import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // TODO: Add authentication and get userId from session
    const { patientId } = req.query;
    if (!patientId || typeof patientId !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid patientId' });
    }

    try {
        // First find the patient to get their userId
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            include: { user: true },
        });

        if (!patient || !patient.user) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Then find payments for this user
        const payments = await prisma.payment.findMany({
            where: { userId: patient.user.id },
            orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({ payments });
    } catch (error) {
        console.error('Fetch payments error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
