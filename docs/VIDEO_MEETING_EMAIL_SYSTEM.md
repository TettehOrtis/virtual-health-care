# Video Meeting Email System

## Overview

The Video Meeting Email System automatically sends meeting URLs to both patients and doctors when video consultation appointments are approved and meeting URLs are generated. This ensures that all participants have easy access to join their video consultations.

## System Components

### 1. Email Templates

#### Video Meeting Template (`VIDEO_MEETING`)
- **Purpose**: Sent when a meeting URL is generated for a video consultation
- **Recipients**: Both patient and doctor
- **Content**: 
  - Meeting details (patient, doctor, date, time)
  - Clickable meeting link
  - Step-by-step instructions
  - Technical requirements
  - Support information

#### Enhanced Reminder Template (`REMINDER`)
- **Purpose**: 24-hour appointment reminders
- **Feature**: Automatically includes meeting URL for video consultations
- **Content**: Standard reminder information + meeting link when applicable

#### Enhanced Booking Templates
- **Purpose**: Initial appointment confirmations
- **Feature**: Notes about video consultation meeting links being sent later
- **Content**: Standard booking info + video consultation expectations

### 2. API Endpoints

#### Meeting Generation (`POST /api/appointments/[appointmentId]/meeting`)
- Generates unique meeting ID and Jitsi Meet URL
- Updates appointment with meeting details
- **Automatically sends email notifications** to both participants
- Includes error handling for email failures

#### Appointment Reminders (`POST /api/appointments/reminders`)
- Finds appointments scheduled for tomorrow
- Sends reminder emails with meeting URLs for video consultations
- Designed for daily cron job execution
- Comprehensive error handling and logging

### 3. Email Service Integration

#### AppointmentNotificationService
- **New method**: `sendVideoMeetingNotification()`
- **Enhanced templates**: Support for meeting URLs and video call indicators
- **Automatic sending**: Triggers when meeting URLs are generated
- **Dual recipients**: Sends to both patient and doctor

## User Experience Flow

### 1. Patient Books Video Appointment
```
Patient → Books VIDEO_CALL appointment → Receives booking confirmation
↓
Note: "You will receive a meeting link once the doctor approves your appointment"
```

### 2. Doctor Approves Appointment
```
Doctor → Approves appointment → Meeting URL automatically generated
↓
Both patient and doctor receive emails with meeting link
```

### 3. 24-Hour Reminder
```
System → Daily reminder check → Sends reminders for tomorrow's appointments
↓
Video consultations include meeting links in reminders
```

### 4. Join Consultation
```
Participant → Clicks meeting link → Opens Jitsi Meet in new tab
↓
Video consultation begins
```

## Email Templates

### Video Meeting Email
```html
<h2>Video Consultation Meeting Link</h2>
<p>Dear {{recipientName}},</p>
<p>Your video consultation meeting link has been generated:</p>
<ul>
  <li><strong>Patient:</strong> {{patientName}}</li>
  <li><strong>Doctor:</strong> {{doctorName}}</li>
  <li><strong>Date:</strong> {{appointmentDate}}</li>
  <li><strong>Time:</strong> {{appointmentTime}}</li>
  <li><strong>Meeting Link:</strong> <a href="{{meetingUrl}}">Click here to join</a></li>
</ul>
<p><strong>Instructions:</strong></p>
<ol>
  <li>Click the meeting link above at your scheduled appointment time</li>
  <li>Allow camera and microphone access when prompted</li>
  <li>Wait for the other participant to join</li>
  <li>Your video consultation will begin once both parties are present</li>
</ol>
<p><strong>Technical Requirements:</strong></p>
<ul>
  <li>Stable internet connection</li>
  <li>Webcam and microphone</li>
  <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
</ul>
```

### Enhanced Reminder Email
```html
<h2>Appointment Reminder</h2>
<p>Dear {{patientName}},</p>
<p>This is a reminder for your upcoming appointment:</p>
<ul>
  <li><strong>Doctor:</strong> {{doctorName}}</li>
  <li><strong>Date:</strong> {{appointmentDate}}</li>
  <li><strong>Time:</strong> {{appointmentTime}}</li>
  <li><strong>Type:</strong> {{appointmentType}}</li>
  {{#if meetingUrl}}
  <li><strong>Meeting Link:</strong> <a href="{{meetingUrl}}">Click here to join video consultation</a></li>
  {{/if}}
</ul>
```

## Technical Implementation

### Database Schema
```prisma
model Appointment {
  id        String            @id @default(uuid())
  patientId String
  doctorId  String
  date      DateTime
  time      String?
  type      AppointmentType   @default(IN_PERSON)
  notes     String?
  status    AppointmentStatus @default(PENDING)
  meetingId String?           // Unique meeting identifier
  meetingUrl String?          // Jitsi Meet URL
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  doctor    Doctor            @relation(fields: [doctorId], references: [id])
  patient   Patient           @relation(fields: [patientId], references: [id])
}
```

### Meeting URL Generation
```typescript
// Generate unique meeting ID
const meetingId = `medicloud-${appointmentId}-${Date.now()}`;

// Create Jitsi Meet URL
const meetingUrl = `https://meet.jit.si/${meetingId}`;

// Update appointment and send emails
const updatedAppointment = await prisma.appointment.update({
  where: { id: appointmentId },
  data: { meetingId, meetingUrl },
  include: { doctor: { include: { user: true } }, patient: { include: { user: true } } }
});

// Send email notifications
await AppointmentNotificationService.sendVideoMeetingNotification(updatedAppointment, meetingUrl);
```

### Error Handling
- Email failures don't prevent meeting URL generation
- Comprehensive logging for debugging
- Graceful degradation when email service is unavailable

## Testing

### Test Endpoints
1. **`/test-video-meeting-email`** - Test video meeting email functionality
2. **`/test-reminders`** - Test appointment reminder system

### Test Scenarios
1. **Video Meeting Email**: Send test email with meeting URL
2. **Reminder System**: Process reminders for tomorrow's appointments
3. **Template Variables**: Verify all variables are properly replaced
4. **Error Handling**: Test with invalid data and network failures

## Production Deployment

### Cron Job Setup
```bash
# Daily at 9:00 AM - Send appointment reminders
0 9 * * * curl -X POST https://yourdomain.com/api/appointments/reminders
```

### Environment Variables
```env
# Email Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Jitsi Meet Configuration
NEXT_PUBLIC_JITSI_DOMAIN=meet.jitsi.si
JITSI_MEETING_PREFIX=medicloud
```

### Monitoring
- Email delivery success rates
- Meeting URL generation logs
- Reminder system execution logs
- Error rates and types

## Security Considerations

### Meeting URL Security
- Unique meeting IDs with timestamps
- No password required (simplified approach)
- Appointment-specific URLs
- Access control through appointment ownership

### Email Security
- HTTPS-only communication
- No sensitive data in email content
- Secure SMTP authentication
- Rate limiting and retry mechanisms

## Benefits

### For Patients
- **Immediate Access**: Meeting links sent automatically upon approval
- **Clear Instructions**: Step-by-step guidance for joining consultations
- **Technical Requirements**: Clear system requirements upfront
- **Reminder Integration**: Meeting links included in appointment reminders

### For Doctors
- **Automated Notifications**: No manual meeting link sharing required
- **Professional Communication**: Consistent, branded email templates
- **Patient Preparation**: Patients arrive prepared with meeting access
- **Reduced No-Shows**: Clear instructions and easy access

### For Platform
- **Improved UX**: Seamless video consultation experience
- **Reduced Support**: Clear instructions reduce technical support requests
- **Professional Image**: Consistent, professional communication
- **Automation**: Reduces manual administrative tasks

## Future Enhancements

### Planned Features
1. **Meeting Password Protection**: Optional password for enhanced security
2. **Calendar Integration**: Add meeting links to calendar invites
3. **SMS Notifications**: Text message reminders with meeting links
4. **Custom Meeting Settings**: Doctor-configurable meeting parameters
5. **Analytics Dashboard**: Track meeting join rates and success metrics

### Integration Opportunities
1. **Calendar Systems**: Google Calendar, Outlook, Apple Calendar
2. **Communication Platforms**: Slack, Microsoft Teams
3. **Mobile Apps**: Push notifications with meeting links
4. **Patient Portals**: Direct meeting access from patient dashboard

## Troubleshooting

### Common Issues

#### Email Not Sent
- Check Gmail App Password configuration
- Verify environment variables
- Check email service logs
- Ensure appointment has valid email addresses

#### Meeting URL Not Generated
- Verify appointment type is `VIDEO_CALL`
- Ensure appointment status is `APPROVED`
- Check appointment ownership and permissions
- Verify database connection

#### Reminder System Not Working
- Check cron job configuration
- Verify API endpoint accessibility
- Check appointment data integrity
- Review system logs for errors

### Debug Commands
```bash
# Test email service
curl -X POST https://yourdomain.com/api/test-email

# Test video meeting email
curl -X POST https://yourdomain.com/api/test-video-meeting-email

# Test reminder system
curl -X POST https://yourdomain.com/api/appointments/reminders

# Check logs
tail -f /var/log/your-app/app.log
```

## Conclusion

The Video Meeting Email System provides a comprehensive, automated solution for managing video consultation communications. By automatically sending meeting URLs and integrating them into the existing notification system, it ensures a seamless experience for both patients and doctors while maintaining professional communication standards.

The system is designed to be reliable, secure, and scalable, with comprehensive error handling and monitoring capabilities. It significantly reduces administrative overhead while improving the overall user experience for video consultations.
