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

        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { fullName: true, email: true } } }
        })

        const results = notifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            read: n.read,
            createdAt: n.createdAt,
            user: { name: n.user?.fullName || '', email: n.user?.email || '' },
        }))

        return res.status(200).json({ notifications: results })
    } catch (error) {
        console.error('Failed to fetch notifications:', error)
        return res.status(500).json({ message: 'Failed to fetch notifications' })
    }
}


