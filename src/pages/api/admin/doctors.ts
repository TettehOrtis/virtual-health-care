import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/middleware/auth'
import { supabase } from '@/lib/supabase'

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
                documents: { orderBy: { uploadedAt: 'desc' } },
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
                    status: doctor.status,
                    createdAt: doctor.createdAt,
                    updatedAt: doctor.updatedAt,
                    stats: {
                        appointmentCount,
                        prescriptionCount,
                        documentCount: doctor.documents.length,
                    },
                    documents: doctor.documents.map(doc => {
                        const pathInBucket = doc.fileUrl.replace(/^doctor-documents\//, '')
                        const { data } = supabase.storage
                            .from('doctor-documents')
                            .getPublicUrl(pathInBucket)
                        return {
                            id: doc.id,
                            title: doc.title,
                            fileName: doc.fileName,
                            fileType: doc.fileType,
                            status: doc.status,
                            uploadedAt: doc.uploadedAt,
                            publicUrl: data.publicUrl,
                            size: doc.size,
                        }
                    }),
                }
            })
        )

        return res.status(200).json({ doctors: results })
    } catch (error) {
        console.error('Failed to fetch doctors:', error)
        return res.status(500).json({ message: 'Failed to fetch doctors' })
    }
}


