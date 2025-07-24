import { sendEmail } from '../email';
import { Appointment } from '@/types/appointment';

export interface AppointmentNotificationData {
  appointment: Appointment;
  patientName: string;
  doctorName: string;
  type: 'BOOKING' | 'CONFIRMATION' | 'REMINDER' | 'CANCELLATION' | 'RESCHEDULE';
  oldAppointmentDate?: string;
  oldAppointmentTime?: string;
}

export class AppointmentNotificationService {
  private static readonly templates = {
    BOOKING: `
      <h2>Appointment Booking Confirmation</h2>
      <p>Dear {{patientName}},</p>
      <p>Your appointment with {{doctorName}} has been successfully booked:</p>
      <ul>
        <li><strong>Date:</strong> {{appointmentDate}}</li>
        <li><strong>Time:</strong> {{appointmentTime}}</li>
        <li><strong>Type:</strong> {{appointmentType}}</li>
      </ul>
      <p>We look forward to seeing you!</p>
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
      </ul>
      <p>We apologize for any inconvenience.</p>
      <p>Best regards,</p>
      <p>MediCloudHub Team</p>
    `
  };

  public static async sendNotification(data: AppointmentNotificationData) {
    const template = this.templates[data.type];
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
      await sendEmail({
        to: data.appointment.doctor.user.email,
        subject: this.getSubject(data.type, true),
        htmlContent: template,
        variables: {
          ...variables,
          patientName: data.patientName,
          doctorName: data.doctorName
        }
      });
    }
  }

  private static getVariables(data: AppointmentNotificationData) {
    const appointmentDate = new Date(data.appointment.date).toLocaleDateString();
    const appointmentTime = new Date(data.appointment.date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    const appointmentType = data.appointment.type?.toUpperCase() || 'IN-PERSON';

    // For reschedule notifications, we need to show both old and new times
    const variables = {
      patientName: data.patientName,
      doctorName: data.doctorName,
      appointmentDate,
      appointmentTime,
      appointmentType
    };

    if (data.type === 'RESCHEDULE') {
      const oldDate = new Date(data.appointment.date).toLocaleDateString();
      const oldTime = new Date(data.appointment.date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      return {
        ...variables,
        oldAppointmentDate: oldDate,
        oldAppointmentTime: oldTime
      };
    }

    return variables;
  }

  private static getSubject(type: string, isDoctor = false) {
    const baseSubjects = {
      BOOKING: 'Appointment Booking Confirmation',
      CONFIRMATION: 'New Appointment Confirmation',
      REMINDER: 'Upcoming Appointment Reminder',
      CANCELLATION: 'Appointment Cancellation',
      RESCHEDULE: 'Appointment Rescheduled'
    };

    const baseSubject = baseSubjects[type as keyof typeof baseSubjects] || 'Appointment Notification';
    return isDoctor ? `${baseSubject} - Doctor Copy` : baseSubject;
  }
}
