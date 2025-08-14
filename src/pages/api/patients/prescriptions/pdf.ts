import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const user = verifyToken(req);
        if (!user || user.role !== 'PATIENT') {
            return res.status(403).json({ message: 'Access Denied' });
        }

        const { id } = req.query;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Prescription ID is required' });
        }

        // Find patient first by supabaseId to get internal id
        const patient = await prisma.patient.findUnique({ where: { supabaseId: user.supabaseId } });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const prescription = await prisma.prescription.findFirst({
            where: { id, patientId: patient.id },
            include: { doctor: { include: { user: true } } },
        });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Minimal PDF without external deps: return a text/pdf response
        const content = `Prescription\n\nMedication: ${prescription.medication}\nDosage: ${prescription.dosage}\nInstructions: ${prescription.instructions}\n\nDoctor: ${prescription.doctor.user.fullName}`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription-${id}.pdf`);

        // Very basic PDF structure (not pretty, but valid enough for many viewers)
        const pdf = `%PDF-1.3\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj\n4 0 obj <</Length ${content.length + 91}>> stream\nBT /F1 12 Tf 72 720 Td (${content.replace(/\\n/g, ') Tj T* (')}) Tj ET\nendstream endobj\n5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000068 00000 n \n0000000124 00000 n \n0000000325 00000 n \n0000000532 00000 n \ntrailer <</Size 6 /Root 1 0 R>>\nstartxref\n640\n%%EOF`;

        res.status(200).send(Buffer.from(pdf));
    } catch (error: any) {
        console.error('PDF generation error:', error);
        return res.status(500).json({ message: 'Failed to generate PDF' });
    }
}