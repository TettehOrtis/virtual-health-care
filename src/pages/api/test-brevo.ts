import { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/email';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { to, subject = 'Test Email from MediCloudHub' } = req.body;
    
    if (!to) {
      return res.status(400).json({ message: 'Email recipient is required' });
    }

    // Read the HTML template file
    const templatePath = path.join(process.cwd(), 'src', 'lib', 'email', 'templates', 'test-email.html');
    const template = await fs.readFile(templatePath, 'utf8');

    console.log('Sending test email to:', to);
    
    const emailResult = await sendEmail({
      to,
      subject,
      htmlContent: template,
      variables: {
        email: to,
        timestamp: new Date().toISOString(),
        currentYear: new Date().getFullYear()
      }
    });

    console.log('Test email sent successfully with result:', emailResult);
    return res.status(200).json({ 
      message: 'Test email sent successfully',
      details: {
        ...emailResult,
        to,
        subject
      }
    });
  } catch (error) {
    console.error('Failed to send test email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Format error response
    const errorResponse = {
      message: errorMessage,
      name: error instanceof Error ? error.name : undefined,
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    };

    return res.status(500).json({ 
      message: 'Failed to send test email',
      error: errorResponse
    });
  }
}
