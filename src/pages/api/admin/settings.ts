import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const user = verifyToken(req) as { role?: string };
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (req.method === 'GET') {
            // Get settings from database or return defaults
            const settings = await prisma.systemSettings.findFirst();

            const defaultSettings = {
                system: {
                    platformName: 'Virtual Healthcare Platform',
                    platformDescription: 'A comprehensive healthcare management system',
                    supportEmail: 'support@healthcare.com',
                    supportPhone: '+1-800-HEALTH',
                    maxFileSize: 10,
                    allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
                    emailNotifications: true,
                    smsNotifications: false,
                    maintenanceMode: false,
                    autoBackup: true,
                    backupFrequency: 'daily',
                    sessionTimeout: 30,
                    maxLoginAttempts: 5,
                    passwordMinLength: 8,
                    requireEmailVerification: true,
                    allowSelfRegistration: true,
                    defaultUserRole: 'PATIENT',
                    apiRateLimit: 1000,
                    logRetentionDays: 30
                },
                security: {
                    twoFactorAuth: false,
                    passwordExpiry: 90,
                    sessionTimeout: 30,
                    ipWhitelist: [],
                    allowedDomains: [],
                    encryptionLevel: 'AES-256',
                    auditLogging: true
                }
            };

            return res.status(200).json(settings?.data || defaultSettings);
        }

        if (req.method === 'POST') {
            const { system, security } = req.body;

            // Update or create settings
            await prisma.systemSettings.upsert({
                where: { id: 'default' },
                update: {
                    data: { system, security },
                    updatedAt: new Date()
                },
                create: {
                    id: 'default',
                    data: { system, security },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            return res.status(200).json({ message: 'Settings saved successfully' });
        }

        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Settings API error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
