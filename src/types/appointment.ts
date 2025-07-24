export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface Doctor {
  id: string;
  specialization: string;
  user: User;
}

export interface Patient {
  id: string;
  user: User;
}

export interface Appointment {
  id: string;
  date: string;
  time: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELED';
  type?: 'IN_PERSON' | 'ONLINE' | 'VIDEO_CALL';
  notes?: string;
  patient: Patient;
  doctor: Doctor;
}
