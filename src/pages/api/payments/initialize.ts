import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // TODO: Add authentication and get userId from session
    const userId = req.body.userId || 'test-user-id'; // TEMP: Replace with real user
    const { amount, currency = 'NGN', appointmentId, description } = req.body;

    console.log('[INIT PAY] Input:', { userId, amount, currency, appointmentId, description });

    if (!amount || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Create payment record first
        const payment = await prisma.payment.create({
            data: {
                userId,
                appointmentId,
                amount,
                currency,
                method: 'CARD', // Default to CARD for now
                status: 'PENDING',
                description,
            },
        });
        console.log('[INIT PAY] Payment created:', payment);

        // 2. Call Paystack API with the payment ID as reference
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(Number(amount) * 100), // Paystack expects kobo
                email: 'test@example.com', // TODO: Use real user email
                reference: payment.id, // Use payment ID as reference
                currency,
                callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/callback`,
            }),
        });
        const paystackData = await paystackRes.json();
        console.log('[INIT PAY] Paystack response:', paystackData);
        if (!paystackData.status) {
            return res.status(500).json({ error: 'Paystack error', details: paystackData });
        }

        // 3. Update payment record with Paystack reference
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                paystackRef: paystackData.data.reference,
            },
        });

        // 4. Return payment URL
        return res.status(200).json({
            success: true,
            authorizationUrl: paystackData.data.authorization_url,
            reference: paystackData.data.reference,
            accessCode: paystackData.data.access_code,
            paymentId: payment.id,
        });
    } catch (error) {
        console.error('[INIT PAY] Payment init error:', error);
        if (error instanceof Error) {
            return res.status(500).json({ error: error.message, stack: error.stack });
        }
        return res.status(500).json({ error: 'Internal server error', details: error });
    }
}
