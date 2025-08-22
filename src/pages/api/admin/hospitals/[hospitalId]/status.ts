import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const user = verifyToken(req) as { role?: string };
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { hospitalId } = req.query;
        const { status } = req.body;

        if (!hospitalId || typeof hospitalId !== 'string') {
            return res.status(400).json({ message: 'Hospital ID is required' });
        }

        if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({ message: 'Valid status is required' });
        }

        const existingHospital = await prisma.hospital.findUnique({
            where: { id: hospitalId },
        });

        if (!existingHospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        const updatedHospital = await prisma.hospital.update({
            where: { id: hospitalId },
            data: { status },
        });

        return res.status(200).json({
            message: 'Hospital status updated successfully',
            hospital: updatedHospital,
        });
    } catch (error) {
        console.error('Failed to update hospital status:', error);
        return res.status(500).json({ message: 'Failed to update hospital status' });
    }
}
