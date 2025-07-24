import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours

export interface VerificationTokenPayload {
  userId: string;
  email: string;
}

export const generateVerificationToken = (userId: string, email: string): string => {
  const payload: VerificationTokenPayload = {
    userId,
    email,
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: VERIFICATION_TOKEN_EXPIRY,
    }
  );
};

export const verifyToken = async (token: string): Promise<VerificationTokenPayload> => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as VerificationTokenPayload;

    // Validate token against database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true },
    });

    if (!user || user.email !== decoded.email) {
      throw new Error('Invalid verification token');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired verification token');
  }
};

export const verifyEmail = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });
};

export const isEmailVerified = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isEmailVerified: true },
  });

  return user?.isEmailVerified || false;
};
