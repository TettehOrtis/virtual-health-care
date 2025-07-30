import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'
import { prisma } from '../../../lib/prisma'
import formidable from 'formidable'
import fs from 'fs/promises'
import { verifyToken } from '../../../middleware/auth'
import crypto from 'crypto'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface UploadResponse {
  message: string
  recordId?: string
  url?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  // Verify method
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Verify authentication
  let user;
  try {
    user = verifyToken(req)
    console.log('Authenticated user:', { id: user.sub, role: user.role, supabaseId: user.supabaseId })
    if (!user || user.role !== 'PATIENT') {
      return res.status(403).json({ message: 'Access Denied' })
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({ message: 'Unauthorized' })
  }

  // Parse form data
  const form = formidable({
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    keepExtensions: true,
    filter: (part) => {
      return !!(
        part.name === 'file' && 
        (part.mimetype?.includes('application/pdf') ||
        part.mimetype?.includes('image/') ||
        part.mimetype?.includes('text/') ||
        part.mimetype?.includes('application/msword') ||
        part.mimetype?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      )
      )
    }
  })

  try {
    console.log('Parsing form data...')
    const [fields, files] = await new Promise<any>((resolve, reject) => {
      form.parse(req, (err: any, fields: any, files: any) => {
        if (err) {
          console.error('Form parsing error:', err)
          reject(err)
        } else {
          console.log('Form parsed successfully:', { fields: Object.keys(fields), files: Object.keys(files) })
          resolve([fields, files])
        }
      })
    })

    // Get patient from database using authenticated user
    console.log('Looking for patient with supabaseId:', user.supabaseId)
    const patient = await prisma.patient.findUnique({
      where: { supabaseId: user.supabaseId },
      include: { user: true }
    })

    if (!patient) {
      console.error('Patient not found for supabaseId:', user.supabaseId)
      return res.status(404).json({ message: 'Patient profile not found' })
    }
    
    console.log('Found patient:', { id: patient.id, name: patient.user.fullName })

    // Handle file data - formidable v1.x structure
    const fileData = files.file
    if (!fileData) {
      return res.status(400).json({ message: 'No file provided' })
    }

    // Handle both single file and array of files
    const file = Array.isArray(fileData) ? fileData[0] : fileData
    if (!file) {
      return res.status(400).json({ message: 'No valid file provided' })
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path
    })

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' })
    }

    // Get form data
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description

    if (!title) {
      return res.status(400).json({ message: 'Title is required' })
    }

    // Generate unique filename
    const fileExt = file.name?.split('.').pop() || 'pdf'
    const uniqueId = crypto.randomUUID()
    const filePath = `medical-records/${patient.id}/${uniqueId}.${fileExt}`

    // Read file content
    if (!file.path) {
      console.error('No path found in file object:', file)
      return res.status(400).json({ message: 'Invalid file data received' })
    }

    console.log('Reading file from path:', file.path)
    const fileContent = await fs.readFile(file.path)
    console.log('File content read successfully, size:', fileContent.length)

    // Upload to Supabase Storage
    console.log('Uploading to Supabase:', { filePath, contentType: file.type || 'application/octet-stream' })
    const { error: uploadError } = await supabase.storage
      .from('medical-records')
      .upload(filePath, fileContent, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      throw new Error(`Supabase upload failed: ${uploadError.message}`)
    }

    console.log('File uploaded successfully to Supabase')

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('medical-records')
      .getPublicUrl(filePath)

    // Create medical record in database
    console.log('Creating medical record in database')
    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        id: uniqueId,
        patientId: patient.id,
        title: title,
        description: description || null,
        fileUrl: publicUrl,
        fileType: file.type || 'application/octet-stream',
        fileName: file.name,
        size: file.size,
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    console.log('Medical record created successfully:', medicalRecord.id)

    // Clean up temp file
    try {
      if (file.path) {
        await fs.unlink(file.path)
        console.log('Temp file cleaned up successfully')
      }
    } catch (cleanupError) {
      console.error('Temp file cleanup failed:', cleanupError)
    }

    return res.status(200).json({
      message: 'Medical record uploaded successfully',
      recordId: medicalRecord.id,
      url: publicUrl
    })

  } catch (error: any) {
    console.error('Upload failed:', error)

    // Specific error messages for client
    const message = error.message.includes('Supabase')
      ? 'Storage service error'
      : error.message.includes('Database')
        ? 'Record creation failed'
        : 'File processing error'

    return res.status(500).json({
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 