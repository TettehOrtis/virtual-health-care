// Email configuration for appointment notifications
export const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  sender: 'MediCloudHub <noreply@medicloudhub.com>',
  // Default settings for appointment emails
  default: {
    subjectPrefix: 'Appointment Notification - MediCloudHub',
    from: 'MediCloudHub <appointments@medicloudhub.com>'
  }
};

// Setup instructions for Gmail App Password
// 1. Enable 2FA on your Gmail account
// 2. Generate an App Password from Google Account settings:
//    - Go to Google Account > Security > 2-Step Verification
//    - Scroll down to "App passwords"
//    - Select "Mail" and "Windows Computer"
//    - Copy the 16-character password
// 3. Set these environment variables in your .env file:
//    GMAIL_USER=your-email@gmail.com
//    GMAIL_APP_PASSWORD=your-16-character-app-password
