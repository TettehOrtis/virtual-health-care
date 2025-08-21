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

        const { documentId } = req.query
        const { status } = req.body as { status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' }

        if (!documentId || typeof documentId !== 'string') {
            return res.status(400).json({ message: 'Document ID is required' })
        }

        if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({ message: 'Valid status is required' })
        }

        const existingDoc = await prisma.doctorDocument.findUnique({ where: { id: documentId } })
        if (!existingDoc) {
            return res.status(404).json({ message: 'Document not found' })
        }

        const updated = await prisma.doctorDocument.update({
            where: { id: documentId },
            data: { status },
        })

        return res.status(200).json({
            message: 'Document status updated successfully',
            document: {
                id: updated.id,
                status: updated.status,
                doctorId: updated.doctorId,
                title: updated.title,
            }
        })
    } catch (error) {
        console.error('Failed to update document status:', error)
        return res.status(500).json({ message: 'Failed to update document status' })
    }
}
