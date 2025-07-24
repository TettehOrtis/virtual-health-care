import nodemailer from 'nodemailer';
import { emailConfig } from './email/config';


interface SendEmailOptions {
  to: string | string[];
  subject: string;
  htmlContent: string;
  variables?: Record<string, any>;
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: emailConfig.service,
  auth: emailConfig.auth
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function sendEmail({ to, subject, htmlContent, variables }: SendEmailOptions) {
  // Replace variables in template
  let processedHtml = htmlContent;
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedHtml = processedHtml.replace(regex, value);
    }
  }

  const mailOptions = {
    from: emailConfig.sender,
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    html: processedHtml
  };

  let lastError: any;
  
  // Retry logic
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }

  throw new Error(`Failed to send email after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`);
}

// Rest of your code remains the same...