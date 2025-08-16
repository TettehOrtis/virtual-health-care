import { sendEmail } from '../email';
import { Appointment } from '@/types/appointment';

export interface AppointmentNotificationData {
  appointment: Appointment;
  patientName: string;
  doctorName: string;
  type: 'BOOKING' | 'CONFIRMATION' | 'REMINDER' | 'CANCELLATION' | 'RESCHEDULE' | 'VIDEO_MEETING';
  oldAppointmentDate?: string;
  oldAppointmentTime?: string;
  meetingUrl?: string;
}

export class AppointmentNotificationService {
  private static readonly templates = {
    BOOKING: `
      <h2>Appointment Booking Confirmation</h2>
      <p>Dear {{patientName}},</p>
      <p>Your appointment with Dr. {{doctorName}} has been successfully booked:</p>
      <ul>
        <li><strong>Date:</strong> {{appointmentDate}}</li>
        <li><strong>Time:</strong> {{appointmentTime}}</li>
        <li><strong>Type:</strong> {{appointmentType}}</li>
        {{#if isVideoCall}}
        <li><strong>Note:</strong> This is a video consultation. You will receive a meeting link once the doctor approves your appointment.</li>
        {{/if}}
      </ul>
      <p>We look forward to seeing you!</p>
      <p>Best regards,</p>
      <p>MediCloudHub Team</p>
    `,
    BOOKING_DOCTOR: `
      <h2>New Appointment Booked</h2>
      <p>Dear Dr. {{doctorName}},</p>
      <p>You have a new appointment booked with patient {{patientName}}:</p>
      <ul>
        <li><strong>Date:</strong> {{appointmentDate}}</li>
        <li><strong>Time:</strong> {{appointmentTime}}</li>
        <li><strong>Type:</strong> {{appointmentType}}</li>
        {{#if isVideoCall}}
        <li><strong>Note:</strong> This is a video consultation. You will need to approve the appointment and generate a meeting link.</li>
        {{/if}}
      </ul>
      <p>Please review and approve the appointment in your dashboard.</p>
      <p>Best regards,</p>
      <p>MediCloudHub Team</p>
    `,
    CONFIRMATION: `
      <h2>Appointment Confirmed</h2>
      <p>Dear {{doctorName}},</p>
      <p>You have a new appointment booked:</p>
      <ul>
        <li><strong>Patient:</strong> {{patientName}}</li>
        <li><strong>Date:</strong> {{appointmentDate}}</li>
        <li><strong>Time:</strong> {{appointmentTime}}</li>
        <li><strong>Type:</strong> {{appointmentType}}</li>
        {{#if isVideoCall}}
        <li><strong>Note:</strong> This is a video consultation. You will receive a meeting link once you approve the appointment.</li>
        {{/if}}
      </ul>
      <p>Best regards,</p>
      <p>MediCloudHub Team</p>
    `,
    REMINDER: `
      <h2>Appointment Reminder</h2>
      <p>Dear {{patientName}},</p>
      <p>This is a reminder for your upcoming appointment:</p>
      <ul>
        <li><strong>Doctor:</strong> {{doctorName}}</li>
        <li><strong>Date:</strong> {{appointmentDate}}</li>
        <li><strong>Time:</strong> {{appointmentTime}}</li>
        <li><strong>Type:</strong> {{appointmentType}}</li>
        {{#if meetingUrl}}
        <li><strong>Meeting Link:</strong> <a href="{{meetingUrl}}" target="_blank" style="color: #2563eb; text-decoration: underline;">Click here to join video consultation</a></li>
        {{/if}}
      </ul>
      <p>Best regards,</p>
      <p>MediCloudHub Team</p>
    `,
    CANCELLATION: `
      <h2>Appointment Cancellation</h2>
      <p>Dear {{patientName}},</p>
      <p>Your appointment with {{doctorName}} has been cancelled:</p>
      <ul>
        <li><strong>Date:</strong> {{appointmentDate}}</li>
        <li><strong>Time:</strong> {{appointmentTime}}</li>
      </ul>
      <p>We apologize for any inconvenience.</p>
      <p>Best regards,</p>
      <p>MediCloudHub Team</p>
    `,
    RESCHEDULE: `
      <h2>Appointment Rescheduled</h2>
      <p>Dear {{patientName}},</p>
      <p>Your appointment with {{doctorName}} has been rescheduled:</p>
      <ul>
        <li><strong>Previous Date:</strong> {{appointmentDate}}</li>
        <li><strong>New Date:</strong> {{newAppointmentDate}}</li>
        <li><strong>Previous Time:</strong> {{appointmentTime}}</li>
        <li><strong>New Time:</strong> {{newAppointmentTime}}</li>
        <li><strong>Type:</strong> {{appointmentType}}</li>
        {{#if isVideoCall}}
        <li><strong>Note:</strong> This is a video consultation. You will receive a new meeting link once the doctor approves the rescheduled appointment.</li>
        {{/if}}
      </ul>
      <p>We apologize for any inconvenience.</p>
      <p>Best regards,</p>
      <p>MediCloudHub Team</p>
    `,
    VIDEO_MEETING_PATIENT: `
      <h2>Video Consultation Meeting Link</h2>
      <p>Dear {{patientName}},</p>
      <p>Your video consultation meeting with Dr. {{doctorName}} has been scheduled. Please use the link below to join at your appointment time:</p>
      <ul>
        <li><strong>Date:</strong> {{appointmentDate}}</li>
        <li><strong>Time:</strong> {{appointmentTime}}</li>
        <li><strong>Meeting Link:</strong> <a href="{{meetingUrl}}" target="_blank" style="color: #2563eb; text-decoration: underline;">Click here to join video consultation</a></li>
      </ul>
      <p><strong>Instructions:</strong></p>
      <ol>
        <li>Click the meeting link above at your scheduled appointment time</li>
        <li>Allow camera and microphone access when prompted</li>
        <li>Wait for the doctor to join</li>
        <li>Your video consultation will begin once both parties are present</li>
      </ol>
      <p><strong>Technical Requirements:</strong></p>
      <ul>
        <li>Stable internet connection</li>
        <li>Webcam and microphone</li>
        <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
      </ul>
      <p>If you experience any technical issues, please contact our support team.</p>
      <p>Best regards,</p>
      <p>MediCloudHub Team</p>
    `,
    VIDEO_MEETING_DOCTOR: `
      <h2>Video Consultation Meeting Link</h2>
      <p>Dear Dr. {{doctorName}},</p>
      <p>Your video consultation meeting with patient {{patientName}} has been scheduled. Please use the link below to join at the appointment time:</p>
      <ul>
        <li><strong>Date:</strong> {{appointmentDate}}</li>
        <li><strong>Time:</strong> {{appointmentTime}}</li>
        <li><strong>Meeting Link:</strong> <a href="{{meetingUrl}}" target="_blank" style="color: #2563eb; text-decoration: underline;">Click here to join video consultation</a></li>
      </ul>
      <p><strong>Instructions:</strong></p>
      <ol>
        <li>Click the meeting link above at the scheduled appointment time</li>
        <li>Allow camera and microphone access when prompted</li>
        <li>Wait for the patient to join</li>
        <li>Your video consultation will begin once both parties are present</li>
      </ol>
      <p><strong>Technical Requirements:</strong></p>
      <ul>
        <li>Stable internet connection</li>
        <li>Webcam and microphone</li>
        <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
      </ul>
      <p>If you experience any technical issues, please contact our support team.</p>
      <p>Best regards,</p>
      <p>MediCloudHub Team</p>
    `
  };

  public static async sendNotification(data: AppointmentNotificationData) {
    // Only use template for non-VIDEO_MEETING types
    if (data.type === 'VIDEO_MEETING') {
      throw new Error('Use sendVideoMeetingNotification for video meeting emails');
    }
    const template = this.templates[data.type as Exclude<AppointmentNotificationData['type'], 'VIDEO_MEETING'>];
    const variables = this.getVariables(data);

    // Send to patient
    await sendEmail({
      to: data.appointment.patient.user.email,
      subject: this.getSubject(data.type),
      htmlContent: template,
      variables
    });

    // Send to doctor if it's a booking, cancellation, or reschedule
    if (data.type === 'BOOKING' || data.type === 'CANCELLATION' || data.type === 'RESCHEDULE') {
      let doctorTemplate = template;
      let doctorVariables = { ...variables };
      if (data.type === 'BOOKING') {
        doctorTemplate = this.templates.BOOKING_DOCTOR;
        doctorVariables = {
          ...variables,
          patientName: data.patientName,
          doctorName: data.doctorName
        };
      }
      await sendEmail({
        to: data.appointment.doctor.user.email,
        subject: this.getSubject(data.type, true),
        htmlContent: doctorTemplate,
        variables: doctorVariables
      });
    }
  }

  // New method specifically for sending video meeting notifications
  public static async sendVideoMeetingNotification(appointment: Appointment, meetingUrl: string) {
    // Patient email
    const patientData: AppointmentNotificationData = {
      appointment,
      patientName: appointment.patient.user.fullName,
      doctorName: appointment.doctor.user.fullName,
      type: 'VIDEO_MEETING',
      meetingUrl
    };
    const patientVariables = {
      ...this.getVariables(patientData),
      recipientName: appointment.patient.user.fullName
    };
    await sendEmail({
      to: appointment.patient.user.email,
      subject: 'MediCloudHub - Video Consultation Meeting Link',
      htmlContent: this.templates.VIDEO_MEETING_PATIENT,
      variables: patientVariables
    });

    // Doctor email
    const doctorData: AppointmentNotificationData = {
      appointment,
      patientName: appointment.patient.user.fullName,
      doctorName: appointment.doctor.user.fullName,
      type: 'VIDEO_MEETING',
      meetingUrl
    };
    const doctorVariables = {
      ...this.getVariables(doctorData),
      recipientName: appointment.doctor.user.fullName
    };
    await sendEmail({
      to: appointment.doctor.user.email,
      subject: 'MediCloudHub - Video Consultation Meeting Link',
      htmlContent: this.templates.VIDEO_MEETING_DOCTOR,
      variables: doctorVariables
    });
  }

  private static getVariables(data: AppointmentNotificationData) {
    const appointmentDate = new Date(data.appointment.date).toLocaleDateString();
    const appointmentTime = data.appointment.time || 'TBD';
    const appointmentType = data.appointment.type || 'IN_PERSON';
    const isVideoCall = appointmentType === 'VIDEO_CALL';

    const variables: Record<string, any> = {
      appointmentDate,
      appointmentTime,
      appointmentType,
      isVideoCall,
      meetingUrl: data.meetingUrl || '',
      patientName: data.patientName,
      doctorName: data.doctorName
    };

    // Add specific variables for different notification types
    if (data.type === 'RESCHEDULE' && data.oldAppointmentDate && data.oldAppointmentTime) {
      variables.newAppointmentDate = appointmentDate;
      variables.newAppointmentTime = appointmentTime;
      variables.appointmentDate = data.oldAppointmentDate;
      variables.appointmentTime = data.oldAppointmentTime;
    }

    if (data.type === 'VIDEO_MEETING') {
      variables.recipientName = data.patientName; // This will be overridden for doctor emails
    }

    return variables;
  }

  private static getSubject(type: string, isDoctor: boolean = false): string {
    const prefix = 'MediCloudHub - ';

    switch (type) {
      case 'BOOKING':
        return isDoctor ? `${prefix}New Appointment Booking` : `${prefix}Appointment Booking Confirmation`;
      case 'CONFIRMATION':
        return `${prefix}Appointment Confirmed`;
      case 'REMINDER':
        return `${prefix}Appointment Reminder`;
      case 'CANCELLATION':
        return isDoctor ? `${prefix}Appointment Cancelled` : `${prefix}Appointment Cancellation`;
      case 'RESCHEDULE':
        return isDoctor ? `${prefix}Appointment Rescheduled` : `${prefix}Appointment Rescheduled`;
      case 'VIDEO_MEETING':
        return `${prefix}Video Consultation Meeting Link`;
      default:
        return `${prefix}Appointment Notification`;
    }
  }
}
