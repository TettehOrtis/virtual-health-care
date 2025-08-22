import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

function verifyPaystackSignature(req: NextApiRequest) {
    const signature = req.headers['x-paystack-signature'] as string;
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY!).update(JSON.stringify(req.body)).digest('hex');
    return signature === hash;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Verify signature
    if (!verifyPaystackSignature(req)) {
        return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('Paystack webhook event:', event.event, event.data?.reference);

    try {
        if (event.event === 'charge.success') {
            const reference = event.data.reference;

            // Find payment by paystackRef
            const payment = await prisma.payment.findFirst({
                where: { paystackRef: reference },
                include: {
                    appointment: true
                }
            });

            if (payment) {
                // Update payment status
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'SUCCESS',
                        paystackRef: reference,
                    },
                });

                // Payment successful but appointment stays PENDING for doctor approval
                console.log('Payment successful via webhook. Appointment remains PENDING for doctor approval.');
            }
        }
        // Add more event types as needed
        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
