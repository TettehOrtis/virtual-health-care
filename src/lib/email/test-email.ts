import { sendEmail } from '../email';

export async function testAppointmentEmail(to: string) {
  const subject = 'Test Appointment Notification';
  const htmlContent = `
    <h2>Test Appointment Notification</h2>
    <p>This is a test email to verify the appointment notification system is working.</p>
    <p>Features:</p>
    <ul>
      <li>Gmail SMTP service</li>
      <li>App Password authentication</li>
      <li>HTML formatting</li>
      <li>Retry mechanism</li>
    </ul>
    <p>If you received this email, the system is configured correctly!</p>
  `;

  try {
    const result = await sendEmail({
      to,
      subject,
      htmlContent
    });
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send test email:', error);
    throw error;
  }
}
