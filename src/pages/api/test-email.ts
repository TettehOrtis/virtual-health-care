import { sendEmail } from '../../lib/email';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, template, variables } = req.body;

    if (!to || !subject || !template) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await sendEmail({
      to,
      subject,
      htmlContent: template,
      variables
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error as Error });
  }
}
