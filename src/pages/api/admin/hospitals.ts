import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Hospitals API called with method:', req.method);

    const user = verifyToken(req) as { role?: string };
    console.log('User from token:', user);

    if (!user || user.role !== 'ADMIN') {
      console.log('Access denied - user role:', user?.role);
      return res.status(403).json({ message: 'Access denied' });
    }

    switch (req.method) {
      case 'GET':
        console.log('Processing GET request');
        const hospitals = await prisma.hospital.findMany({
          orderBy: { createdAt: 'desc' },
        });

        console.log('Found hospitals:', hospitals.length);

        // Since doctors don't have hospitalId in current schema, we'll return placeholder stats
        const results = hospitals.map((hospital) => {
          return {
            id: hospital.id,
            name: hospital.name,
            location: hospital.location,
            services: hospital.services,
            licenseNo: hospital.licenseNo,
            status: hospital.status,
            createdAt: hospital.createdAt,
            stats: {
              doctors: 0, // Placeholder - no hospital relationship in current schema
              documents: 0, // Placeholder - no hospital relationship in current schema
              reports: 0, // Placeholder for future reports
            },
          };
        });

        return res.status(200).json({ hospitals: results });

      case 'POST':
        console.log('Processing POST request');
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);

        if (!req.body) {
          console.log('No request body found');
          return res.status(400).json({ message: 'Request body is required' });
        }

        const { name, location, services, licenseNo } = req.body;

        console.log('Extracted fields:', { name, location, services, licenseNo });

        // Validate each field individually
        if (!name || typeof name !== 'string' || name.trim() === '') {
          console.log('Invalid name:', name);
          return res.status(400).json({ message: 'Valid name is required' });
        }

        if (!location || typeof location !== 'string' || location.trim() === '') {
          console.log('Invalid location:', location);
          return res.status(400).json({ message: 'Valid location is required' });
        }

        if (!licenseNo || typeof licenseNo !== 'string' || licenseNo.trim() === '') {
          console.log('Invalid licenseNo:', licenseNo);
          return res.status(400).json({ message: 'Valid license number is required' });
        }

        console.log('All validations passed');

        const existingHospital = await prisma.hospital.findFirst({
          where: { licenseNo: licenseNo.trim() },
        });

        if (existingHospital) {
          console.log('Hospital with license number already exists:', licenseNo);
          return res.status(400).json({ message: 'Hospital with this license number already exists' });
        }

        console.log('Creating new hospital with data:', {
          name: name.trim(),
          location: location.trim(),
          services: services?.trim() || null,
          licenseNo: licenseNo.trim(),
          status: 'PENDING'
        });

        const newHospital = await prisma.hospital.create({
          data: {
            name: name.trim(),
            location: location.trim(),
            services: services?.trim() || null,
            licenseNo: licenseNo.trim(),
            status: 'PENDING',
          },
        });

        console.log('Hospital created successfully:', newHospital);

        return res.status(201).json({
          message: 'Hospital created successfully',
          hospital: newHospital,
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in hospitals API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


