import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AppointmentNotificationService } from '@/lib/email/appointment-notifications';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // TODO: Add authentication and get userId from session
    const { reference } = req.query;
    if (!reference || typeof reference !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid reference' });
    }

    try {
        // 1. Call Paystack verify API
        const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        const paystackData = await paystackRes.json();
        if (!paystackData.status) {
            return res.status(500).json({ error: 'Paystack error', details: paystackData });
        }

        // 2. Find Payment record by ID (Paystack reference matches payment ID)
        const payment = await prisma.payment.findUnique({
            where: { id: reference },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            include: { user: true }
                        },
                        patient: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // 3. Update Payment record
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: paystackData.data.status === 'success' ? 'SUCCESS' : 'FAILED',
                paystackRef: paystackData.data.reference,
            },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            include: { user: true }
                        },
                        patient: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        // 4. If payment successful, DON'T automatically approve appointment - let doctor do it manually
        if (paystackData.data.status === 'success' && updatedPayment.appointment) {
            // Payment successful but appointment stays PENDING for doctor approval
            console.log('Payment successful. Appointment remains PENDING for doctor approval.');
            
            // No need to send confirmation email yet - wait for doctor approval
            // The doctor will approve the appointment and send confirmation email with video link
        }

        // 5. Return payment status
        return res.status(200).json({
            success: true,
            status: updatedPayment.status,
            payment: updatedPayment,
            paystack: paystackData.data,
        });
    } catch (error) {
        console.error('Payment verify error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
