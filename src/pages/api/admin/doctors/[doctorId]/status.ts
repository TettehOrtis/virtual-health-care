import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/middleware/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH'])
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        const user = verifyToken(req) as { role?: string }
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' })
        }

        const { doctorId } = req.query
        const { status } = req.body

        if (!doctorId || typeof doctorId !== 'string') {
            return res.status(400).json({ message: 'Doctor ID is required' })
        }

        if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({ message: 'Valid status is required' })
        }

        // Check if doctor exists
        const existingDoctor = await prisma.doctor.findUnique({
            where: { id: doctorId }
        })

        if (!existingDoctor) {
            return res.status(404).json({ message: 'Doctor not found' })
        }

        // Update doctor status
        const updatedDoctor = await prisma.doctor.update({
            where: { id: doctorId },
            data: { status },
            include: {
                user: { select: { fullName: true, email: true } }
            }
        })

        return res.status(200).json({
            message: 'Doctor status updated successfully',
            doctor: {
                id: updatedDoctor.id,
                name: updatedDoctor.user?.fullName,
                email: updatedDoctor.user?.email,
                status: updatedDoctor.status
            }
        })
    } catch (error) {
        console.error('Failed to update doctor status:', error)
        return res.status(500).json({ message: 'Failed to update doctor status' })
    }
}
