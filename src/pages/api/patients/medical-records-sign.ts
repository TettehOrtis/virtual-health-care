import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@/middleware/auth'
import { prisma } from '@/lib/prisma'
import { supabaseServer } from '@/lib/supabaseServer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    try {
        const user = verifyToken(req)
        if (!user || user.role !== 'PATIENT') {
            return res.status(403).json({ message: 'Access Denied' })
        }

        const { recordId, downloadName } = req.query
        if (!recordId || typeof recordId !== 'string') {
            return res.status(400).json({ message: 'recordId is required' })
        }

        // Ensure the record belongs to this patient
        const patient = await prisma.patient.findUnique({ where: { supabaseId: user.supabaseId } })
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' })

        const record = await prisma.medicalRecord.findFirst({
            where: { id: recordId, patientId: patient.id },
        })
        if (!record) return res.status(404).json({ message: 'Medical record not found' })

        const objectKey = record.fileUrl.startsWith('http')
            ? deriveStoragePath(record.fileUrl)
            : record.fileUrl

        const { data, error } = await supabaseServer.storage
            .from('medical-records')
            .createSignedUrl(objectKey, 60 * 5, {
                download: true,
                downloadName: typeof downloadName === 'string' ? downloadName : record.fileName,
            })

        if (error || !data?.signedUrl) {
            return res.status(500).json({ message: 'Failed to generate signed URL' })
        }

        return res.status(200).json({ url: data.signedUrl })
    } catch (err: any) {
        return res.status(500).json({ message: 'Internal Server Error', error: err?.message })
    }
}

const deriveStoragePath = (fileUrl: string): string => {
    const markers = [
        '/storage/v1/object/public/medical-records/',
        '/storage/v1/object/sign/medical-records/',
    ]
    for (const marker of markers) {
        const idx = fileUrl.indexOf(marker)
        if (idx !== -1) return fileUrl.substring(idx + marker.length)
    }
    const genericIdx = fileUrl.lastIndexOf('/medical-records/')
    if (genericIdx !== -1) return fileUrl.substring(genericIdx + '/medical-records/'.length)
    return fileUrl
}


