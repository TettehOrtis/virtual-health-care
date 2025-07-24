import { prisma } from "./prisma";
import { AppointmentNotificationService } from "./email/appointment-notifications";
import { Appointment } from "@/types/appointment";

interface AppointmentNotificationData {
  doctorName: string;
  oldDate: Date;
  newDate: Date;
  type: 'VIDEO' | 'IN_PERSON';
  patientId: string;
  appointmentId: string;
}

export const sendAppointmentRescheduledNotification = async ({
  doctorName,
  oldDate,
  newDate,
  type,
  patientId,
  appointmentId,
}: AppointmentNotificationData) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true,
      },
    });

    if (!patient || !patient.user) {
      throw new Error("Patient not found");
    }

    const appointmentData = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        type: true,
        notes: true,
        patient: {
          include: { user: true },
        },
        doctor: {
          include: { user: true },
        },
      },
    });

    if (!appointmentData) {
      throw new Error("Appointment not found");
    }

    const appointment: Appointment = {
      ...appointmentData,
      date: appointmentData.date.toISOString().split('T')[0],
      notes: appointmentData.notes ?? '',
      time: appointmentData.time,
    };

    await AppointmentNotificationService.sendNotification({
      appointment,
      patientName: patient.user.fullName,
      doctorName,
      type: 'RESCHEDULE',
      oldAppointmentDate: oldDate.toLocaleDateString(),
      oldAppointmentTime: oldDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  } catch (error) {
    console.error("Error sending appointment rescheduled notification:", error);
    throw error;
  }
};
