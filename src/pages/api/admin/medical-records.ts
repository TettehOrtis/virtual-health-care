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

        const records = await prisma.medicalRecord.findMany({
            orderBy: { uploadedAt: 'desc' },
            include: {
                Patient: {
                    include: { user: { select: { fullName: true } } }
                }
            }
        })

        return res.status(200).json({
            records: records.map((r) => ({
                id: r.id,
                title: r.title,
                fileType: r.fileType,
                fileName: r.fileName,
                uploadedAt: r.uploadedAt,
                patientName: r.Patient?.user?.fullName || 'Unknown'
            }))
        })
    } catch (error) {
        console.error('Failed to fetch medical records:', error)
        return res.status(500).json({ message: 'Failed to fetch medical records' })
    }
}


