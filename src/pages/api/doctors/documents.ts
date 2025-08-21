import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/middleware/auth'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const user = verifyToken(req) as { role?: string; supabaseId?: string }
        if (!user || user.role !== 'DOCTOR') {
            return res.status(403).json({ message: 'Access denied' })
        }

        const doctor = await prisma.doctor.findUnique({
            where: { supabaseId: user.supabaseId }
        })

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' })
        }

        switch (req.method) {
            case 'GET': {
                const documents = await prisma.doctorDocument.findMany({
                    where: { doctorId: doctor.id },
                    orderBy: { uploadedAt: 'desc' }
                })

                const docsWithUrls = documents.map(doc => {
                    const pathInBucket = doc.fileUrl.replace(/^doctor-documents\//, '')
                    const { data } = supabase.storage
                        .from('doctor-documents')
                        .getPublicUrl(pathInBucket)
                    return {
                        ...doc,
                        publicUrl: data.publicUrl,
                    }
                })

                return res.status(200).json({ documents: docsWithUrls })
            }

            case 'POST': {
                const { title, fileUrl, fileType, fileName, size } = req.body

                if (!title || !fileUrl || !fileType || !fileName || !size) {
                    return res.status(400).json({ message: 'Missing required fields' })
                }

                const newDocument = await prisma.doctorDocument.create({
                    data: {
                        doctorId: doctor.id,
                        title,
                        fileUrl,
                        fileType,
                        fileName,
                        size: parseInt(size),
                        status: 'PENDING'
                    }
                })

                const pathInBucket = newDocument.fileUrl.replace(/^doctor-documents\//, '')
                const { data } = supabase.storage
                    .from('doctor-documents')
                    .getPublicUrl(pathInBucket)

                return res.status(201).json({
                    message: 'Document uploaded successfully',
                    document: { ...newDocument, publicUrl: data.publicUrl }
                })
            }

            default:
                res.setHeader('Allow', ['GET', 'POST'])
                return res.status(405).json({ message: 'Method not allowed' })
        }
    } catch (error) {
        console.error('Error in doctor documents API:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}
