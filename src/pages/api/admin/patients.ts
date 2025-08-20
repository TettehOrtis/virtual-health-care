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

        const patients = await prisma.patient.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { fullName: true, email: true } },
            },
        })

        const results = await Promise.all(
            patients.map(async (patient) => {
                const [appointmentCount, prescriptionCount, medicalRecordCount] = await Promise.all([
                    prisma.appointment.count({ where: { patientId: patient.id } }),
                    prisma.prescription.count({ where: { patientId: patient.id } }),
                    prisma.medicalRecord.count({ where: { patientId: patient.id } }),
                ])

                return {
                    id: patient.id,
                    supabaseId: patient.supabaseId,
                    name: patient.user?.fullName || '',
                    email: patient.user?.email || '',
                    phone: patient.phone,
                    address: patient.address,
                    createdAt: patient.createdAt,
                    updatedAt: patient.updatedAt,
                    stats: {
                        appointmentCount,
                        prescriptionCount,
                        medicalRecordCount,
                    },
                }
            })
        )

        return res.status(200).json({ patients: results })
    } catch (error) {
        console.error('Failed to fetch patients:', error)
        return res.status(500).json({ message: 'Failed to fetch patients' })
    }
}


