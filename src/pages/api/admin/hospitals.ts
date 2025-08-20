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

        const hospitals = await prisma.hospital.findMany({
            orderBy: { createdAt: 'desc' },
        })

        const results = hospitals.map((h) => ({
            id: h.id,
            name: h.name,
            location: h.location,
            services: h.services,
            licenseNo: h.licenseNo,
            status: h.status,
            createdAt: h.createdAt,
            stats: {
                doctors: 0,
                documents: 0,
                reports: 0,
            },
        }))

        return res.status(200).json({ hospitals: results })
    } catch (error) {
        console.error('Failed to fetch hospitals:', error)
        return res.status(500).json({ message: 'Failed to fetch hospitals' })
    }
}


