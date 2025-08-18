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
    maxFileSize: 5 * 1024 * 1024, // 5MB
    keepExtensions: true,
    filter: (part: any) => {
      return !!(
        part.name === 'file' &&
        (part.mimetype?.includes('image/jpeg') ||
          part.mimetype?.includes('image/png') ||
          part.mimetype?.includes('image/gif') ||
          part.mimetype?.includes('image/webp')
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
      return res.status(400).json({ message: 'No valid image file provided' })
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path
    })

    // Generate unique filename
    const fileExt = file.name?.split('.').pop() || 'jpg'
    const uniqueId = crypto.randomUUID()
    const filePath = `profile-pictures/${uniqueId}.${fileExt}`

    // Read file content
    if (!file.path) {
      console.error('No path found in file object:', file)
      return res.status(400).json({ message: 'Invalid file data received' })
    }

    console.log('Reading file from path:', file.path)
    const fileContent = await fs.readFile(file.path)
    console.log('File content read successfully, size:', fileContent.length)

    // Upload to Supabase Storage
    console.log('Uploading to Supabase:', { filePath, contentType: file.type || 'image/jpeg' })
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, fileContent, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      throw new Error(`Supabase upload failed: ${uploadError.message}`)
    }

    console.log('File uploaded successfully to Supabase')

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)

    // Update patient record using Prisma
    console.log('Updating patient profile with new image URL')
    const updatedPatient = await prisma.patient.update({
      where: { id: patient.id },
      data: { profile_picture_url: publicUrl }
    })

    if (!updatedPatient) {
      throw new Error('Failed to update patient profile')
    }

    console.log('Patient profile updated successfully')

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
      message: 'Profile picture uploaded successfully',
      url: publicUrl
    })

  } catch (error: any) {
    console.error('Upload failed:', error)

    // Specific error messages for client
    const message = error.message.includes('Supabase')
      ? 'Storage service error'
      : error.message.includes('Database')
        ? 'Profile update failed'
        : 'File processing error'

    return res.status(500).json({
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}