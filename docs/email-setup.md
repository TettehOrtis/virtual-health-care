# Email Setup Guide

This guide explains how to set up email sending using Nodemailer with Gmail SMTP.

## Prerequisites

1. A Gmail account
2. 2-Step Verification enabled on your Gmail account
3. App Password generated from your Google Account settings

## Setup Instructions

1. Enable 2-Step Verification on your Gmail account:
   - Go to your Google Account settings
   - Navigate to Security > 2-Step Verification
   - Follow the prompts to set it up

2. Generate an App Password:
   - Go to your Google Account settings
   - Navigate to Security > 2-Step Verification
   - Scroll down to "App passwords"
   - Select "Mail" as the app and "Other" as the device
   - Copy the 16-character password that's generated

3. Update your `.env` file with the following variables:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password-here
```

## Usage

The email system supports:
- Sending emails to single or multiple recipients
- HTML templates with variable interpolation
- Retry mechanism (3 attempts)
- Error handling and logging

### Example Usage

```typescript
// Send a simple email
await sendEmail({
  to: 'recipient@example.com',
  subject: 'Test Email',
  htmlContent: '<h1>Hello!</h1><p>This is a test email.</p>'
});

// Send email with variables
await sendEmail({
  to: 'recipient@example.com',
  subject: 'Welcome {{name}}',
  htmlContent: '<p>Hello {{name}}, welcome to our platform!</p>',
  variables: {
    name: 'John'
  }
});
```

## Testing

You can test the email functionality by visiting `/test-email` in your browser. This page provides a form where you can:
- Enter recipient email
- Set subject
- Enter HTML template
- Add variables (in JSON format)

The test page will show you the result of the email send attempt, including any errors if they occur.

## Security Notes

1. Never commit your `.env` file to version control
2. Keep your App Password secure and never share it
3. If you suspect your App Password has been compromised, generate a new one
4. Consider using a dedicated Gmail account for your application's email sending
