import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/middleware/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        const user = verifyToken(req) as { role?: string }
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' })
        }

        const [doctors, patients, appointments, completedAppointments] = await Promise.all([
            prisma.doctor.count(),
            prisma.patient.count(),
            prisma.appointment.count(),
            prisma.appointment.count({ where: { status: 'COMPLETED' } }),
        ])

        return res.status(200).json({
            doctors,
            patients,
            appointments,
            completedAppointments,
        })
    } catch (error) {
        console.error('Failed to fetch stats:', error)
        return res.status(500).json({ message: 'Failed to fetch stats' })
    }
}


