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

        const doctors = await prisma.doctor.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { fullName: true, email: true } },
            },
        })

        const results = await Promise.all(
            doctors.map(async (doctor) => {
                const [appointmentCount, prescriptionCount] = await Promise.all([
                    prisma.appointment.count({ where: { doctorId: doctor.id } }),
                    prisma.prescription.count({ where: { doctorId: doctor.id } }),
                ])

                return {
                    id: doctor.id,
                    supabaseId: doctor.supabaseId,
                    name: doctor.user?.fullName || '',
                    email: doctor.user?.email || '',
                    specialization: doctor.specialization,
                    phone: doctor.phone,
                    address: doctor.address,
                    createdAt: doctor.createdAt,
                    updatedAt: doctor.updatedAt,
                    stats: {
                        appointmentCount,
                        prescriptionCount,
                    },
                }
            })
        )

        return res.status(200).json({ doctors: results })
    } catch (error) {
        console.error('Failed to fetch doctors:', error)
        return res.status(500).json({ message: 'Failed to fetch doctors' })
    }
}


