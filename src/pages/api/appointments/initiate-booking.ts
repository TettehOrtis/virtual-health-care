import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { AppointmentNotificationService } from '@/lib/email/appointment-notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // TODO: Add authentication and get userId from session
    const { doctorId, patientId, date, time, reason, amount, description, appointmentType } = req.body;
    if (!doctorId || !patientId || !date || !amount || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Create pending appointment
        const appointment = await prisma.appointment.create({
            data: {
                doctorId,
                patientId,
                date: new Date(date),
                time,
                notes: reason,
                status: 'PENDING',
                type: appointmentType || 'IN_PERSON',
            },
            include: {
                doctor: {
                    include: { user: true }
                },
                patient: {
                    include: { user: true }
                }
            }
        });

        // 2. Send immediate notification emails for pending appointment
        try {
            // Convert Prisma appointment to match Appointment interface
            const appointmentForEmail = {
                ...appointment,
                date: appointment.date.toISOString(),
                time: appointment.time || null,
                notes: appointment.notes || undefined
            };

            await AppointmentNotificationService.sendNotification({
                appointment: appointmentForEmail,
                patientName: appointment.patient.user.fullName,
                doctorName: appointment.doctor.user.fullName,
                type: 'BOOKING'
            });
            console.log('Booking notification emails sent successfully');
        } catch (emailError) {
            console.error('Error sending booking notification emails:', emailError);
            // Don't fail the request if emails fail
        }

        // 3. Fetch the Patient and their User
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            include: { user: true },
        });
        if (!patient || !patient.user) {
            return res.status(400).json({ error: 'Invalid patientId or user not found' });
        }
        const userId = patient.user.id;

        // 4. Call internal payment initialize API
        const paymentRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/initialize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount,
                currency: 'GHS',
                appointmentId: appointment.id,
                description,
                userId,
            }),
        });
        const paymentData = await paymentRes.json();
        if (!paymentData.success) {
            return res.status(500).json({ error: 'Payment initialization failed', details: paymentData });
        }

        // 5. Return Paystack payment URL and reference
        return res.status(200).json({
            success: true,
            authorizationUrl: paymentData.authorizationUrl,
            reference: paymentData.reference,
            appointmentId: appointment.id,
            paymentId: paymentData.paymentId,
        });
    } catch (error) {
        console.error('Initiate booking error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
