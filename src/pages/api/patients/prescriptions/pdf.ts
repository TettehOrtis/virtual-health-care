import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/middleware/auth';
// @ts-ignore - using require to avoid type issues during lint before deps install
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

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

        // Find patient first by supabaseId to get internal id and user details
        const patient = await prisma.patient.findUnique({ where: { supabaseId: user.supabaseId }, include: { user: true } });
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

        // Styled PDF using pdfkit
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription-${id}.pdf`);

        const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
        // @ts-ignore piping Next.js response
        doc.pipe(res);

        // Brand header (MediCloudHub + simple cross logo)
        drawLogo(doc, 50, 50);
        doc
            .fontSize(22)
            .fillColor('#111827')
            .text('MediCloudHub', 90, 52, { continued: true })
            .fontSize(12)
            .fillColor('#6B7280')
            .text('  ONLINE CLINIC');

        // Contact/info at top-right from doctor profile
        const topRightX = 360;
        doc.fontSize(10).fillColor('#111827');
        doc.text(`Doctor: Dr. ${prescription.doctor.user.fullName}`, topRightX, 52, { align: 'left' });
        if (prescription.doctor.specialization) doc.text(`${prescription.doctor.specialization}`, topRightX);
        if (prescription.doctor.phone) doc.text(`${prescription.doctor.phone}`, topRightX);
        if (prescription.doctor.address) doc.text(`${prescription.doctor.address}`, topRightX);
        if (prescription.doctor.user.email) doc.text(`${prescription.doctor.user.email}`, topRightX);

        doc.moveDown(1.4);
        drawDivider(doc);

        // Patient + meta panel
        const created = formatDate(prescription.createdAt as unknown as Date);
        const dob = patient?.dateOfBirth ? formatDate(patient.dateOfBirth as unknown as Date) : 'N/A';
        const patientName = patient?.user?.fullName || 'N/A';
        const patientAddress = patient?.address || 'N/A';
        const leftX = 50; const rightX = 330; let y = doc.y + 14;
        y = printRow(doc, leftX, y, 'Patient', patientName);
        y = printRow(doc, leftX, y + 6, 'Date of birth', dob);
        y = printRow(doc, leftX, y + 6, 'Address', patientAddress, rightX);
        y = printRow(doc, leftX, y + 6, 'Date of issue', created);
        y = printRow(doc, leftX, y + 6, 'Prescription ID', prescription.id);

        // Medication details
        doc.moveDown(0.8);
        drawSectionTitle(doc, 'Prescription');
        doc.moveDown(0.4);
        doc.fontSize(12).fillColor('#111827').text(`Medication: ${prescription.medication}`);
        doc.fontSize(12).fillColor('#111827').text(`Dosage: ${prescription.dosage}`);
        doc.moveDown(0.2);
        drawSubtleLabel(doc, 'Directions for use');
        doc.fontSize(12).fillColor('#111827').text(prescription.instructions, { width: 500 });

        doc.moveDown(0.8);
        doc.fontSize(12).fillColor('#111827').text('Duration');
        doc.fontSize(12).fillColor('#111827').text('5 days');
        doc.moveDown(0.6);
        doc.fontSize(12).fillColor('#111827').text('Complete full course even if symptoms improve');

        // Signature line
        doc.moveDown(1.6);
        doc.fontSize(16).fillColor('#111827').text(prescription.doctor.user.fullName);
        doc.fontSize(12).fillColor('#111827').text(`Dr. ${prescription.doctor.user.fullName}`);
        doc.fontSize(10).fillColor('#6B7280').text('Signature');

        doc.end();
    } catch (error: any) {
        console.error('PDF generation error:', error);
        return res.status(500).json({ message: 'Failed to generate PDF' });
    }
}

function drawDivider(doc: any) {
    const x = 50; const width = 512; const y = doc.y;
    doc.moveTo(x, y).lineTo(x + width, y).lineWidth(1).strokeColor('#E5E7EB').stroke();
}

function printRow(doc: any, leftX: number, y: number, label: string, value: string, valueX = 320) {
    doc.fontSize(12).fillColor('#111827').text(label, leftX, y);
    if (value) doc.fontSize(12).fillColor('#111827').text(value, valueX, y, { align: 'left' });
    return y + 18;
}

function formatDate(date: Date): string {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
}

function drawLogo(doc: any, x: number, y: number) {
    // Simple cross logo using vector shapes to avoid external image dependency
    const size = 18;
    const thickness = 6;
    const half = size / 2;
    doc.save();
    doc.fillColor('#10B981'); // teal/green
    // vertical bar
    doc.roundedRect(x + half - thickness / 2, y, thickness, size, 1).fill();
    // horizontal bar
    doc.roundedRect(x, y + half - thickness / 2, size, thickness, 1).fill();
    doc.restore();
}

function drawSectionTitle(doc: any, title: string) {
    doc.fontSize(13).fillColor('#111827').text(title, { underline: false });
}

function drawSubtleLabel(doc: any, text: string) {
    doc.fontSize(11).fillColor('#6B7280').text(text);
}