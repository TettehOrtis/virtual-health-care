import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '@/lib/auth';
import { Role } from '@prisma/client';

interface AuthRequestBody {
  email: string;
  password: string;
  fullName: string;
  role: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  medicalHistory?: string;
  specialization?: string;
}

const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest & { body: AuthRequestBody },
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { email, password, fullName, role, ...metadata } = req.body as AuthRequestBody;

      // 1. Sign up with Supabase
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName: fullName || '',
            role: role || 'PATIENT',
            ...metadata
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // 2. Create our User record with supabaseId
      if (!user || !user.id) {
        throw new Error('Failed to create Supabase user');
      }

      const createdUser = await prisma.user.create({
        data: {
          supabaseId: user.id,
          fullName: fullName || '',
          role: role as Role,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 3. Create Patient/Doctor record based on role
      if (role === 'PATIENT') {
        await prisma.patient.create({
          data: {
            supabaseId: createdUser.supabaseId,
            dateOfBirth: metadata.dateOfBirth || new Date(),
            gender: metadata.gender || '',
            phone: metadata.phone || '',
            address: metadata.address || '',
            medicalHistory: metadata.medicalHistory || '',
          }
        });
      } else if (role === 'DOCTOR') {
        await prisma.doctor.create({
          data: {
            supabaseId: createdUser.supabaseId,
            specialization: metadata.specialization || '',
            phone: metadata.phone || '',
            address: metadata.address || '',
          }
        });
      }

      // 4. Generate our JWT token
      const token = generateToken({
        id: createdUser.id,
        email: email || '',
        role: role as Role
      });

      res.status(200).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
          id: createdUser.id,
          fullName: fullName || '',
          role: role as Role,
          email: email || ''
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'An unexpected error occurred',
          error: String(error)
        });
      }
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
}
