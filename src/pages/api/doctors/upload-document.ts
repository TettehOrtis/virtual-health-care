import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/middleware/auth'
import { supabaseServer } from '@/lib/supabaseServer'
import { v4 as uuidv4 } from 'uuid'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import formidable from 'formidable'
import fs from 'fs'

export const config = {
    api: {
        bodyParser: false,
    },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        const user = verifyToken(req) as { role?: string; supabaseId?: string }
        if (!user || user.role !== 'DOCTOR') {
            return res.status(403).json({ message: 'Access denied' })
        }

        const doctor = await prisma.doctor.findUnique({ where: { supabaseId: user.supabaseId } })
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' })
        }

        const form = formidable({
            maxFileSize: 10 * 1024 * 1024,
            filter: (part: any) => {
                const mimetype: string | null | undefined = part?.mimetype
                return !!mimetype && (
                    mimetype.includes('pdf') ||
                    mimetype.includes('image') ||
                    mimetype.includes('document') ||
                    mimetype.includes('text')
                )
            },
            multiples: false,
        })

        const { fields, files } = await new Promise<any>((resolve, reject) => {
            form.parse(req, (err: any, fields: any, files: any) => {
                if (err) reject(err)
                else resolve({ fields, files })
            })
        })

        const title: string | undefined = Array.isArray(fields.title) ? fields.title[0] : fields.title
        const uploaded = (files.file && (Array.isArray(files.file) ? files.file[0] : files.file)) as any

        if (!title || !uploaded) {
            return res.status(400).json({ message: 'File and title are required' })
        }

        const bucketName = 'doctor-documents'
        // Ensure bucket exists; create if missing
        const { data: existingBucket, error: getBucketError } = await supabaseServer.storage.getBucket(bucketName)
        if (getBucketError && getBucketError.message && !existingBucket) {
            // Try to create bucket
            const { error: createError } = await supabaseServer.storage.createBucket(bucketName, {
                public: true,
                fileSizeLimit: 10 * 1024 * 1024,
                allowedMimeTypes: ['image/*', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            })
            if (createError) {
                console.error('Failed to create bucket:', createError)
                return res.status(500).json({ message: 'Storage bucket is missing and could not be created' })
            }
        }

        const originalName: string = uploaded.originalFilename || 'document'
        const fileExt = originalName.includes('.') ? originalName.split('.').pop() : 'pdf'
        const uniqueId = uuidv4()
        const storagePath = `${doctor.id}/${uniqueId}.${fileExt}`

        const fileBuffer = fs.readFileSync(uploaded.filepath)
        const { error: uploadError } = await supabaseServer.storage
            .from(bucketName)
            .upload(storagePath, fileBuffer, {
                contentType: uploaded.mimetype || 'application/octet-stream',
                upsert: false,
            })
        if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            return res.status(500).json({ message: 'Failed to upload file' })
        }

        const { data: pub } = await supabaseServer.storage
            .from(bucketName)
            .getPublicUrl(storagePath)

        const document = await (prisma as any).doctorDocument.create({
            data: {
                doctorId: doctor.id,
                title,
                fileUrl: `${bucketName}/${storagePath}`,
                fileType: uploaded.mimetype || 'application/octet-stream',
                fileName: originalName,
                size: uploaded.size || 0,
                status: 'PENDING',
            }
        })

        try {
            fs.unlinkSync(uploaded.filepath)
        } catch { }

        return res.status(201).json({
            message: 'Document uploaded successfully',
            document: { ...document, publicUrl: pub?.publicUrl }
        })
    } catch (error) {
        console.error('Error uploading document:', error)
        return res.status(500).json({ message: 'Failed to upload document' })
    }
}
