# Virtual Healthcare Platform PRD

## Purpose
A modern, digital healthcare platform that connects patients with healthcare providers through an intuitive web interface, enabling virtual consultations, appointment scheduling, and medical record management.

## Technical Architecture

### Frontend Architecture
- Next.js 15.2.2 with TypeScript
- React 19
- Tailwind CSS for styling
- Shadcn UI components
- React Query for data fetching
- NextAuth.js for authentication
- Radix UI for accessible components

### Backend Architecture
- Next.js API routes
- PostgreSQL database with Prisma ORM
- JWT for authentication
- Axios for HTTP requests
- Brevo (Sendinblue) for email service

### Email Service Implementation
- Gmail App password
- Email templates stored in `/src/lib/email/templates/`
- Supports HTML templates with variable interpolation
- Implements retry mechanism (3 attempts)
- Handles rate limiting and API errors gracefully
- Default sender: tettehortis005@gmail.com, name: MediCloudHub

### API Structure
```
/api/
├── admin.ts          # Admin-specific endpoints
├── auth/            # Authentication endpoints
├── appointments/    # Appointment management
├── doctors/         # Doctor-related endpoints
├── patients/       # Patient-related endpoints
├── prescriptions/  # Prescription management
├── test-brevo.ts   # Email service testing
└── test-email.ts   # Email template testing
```

## Implemented Features

### Authentication & User Management
- [x] User registration with Supabase
- [x] Login/logout functionality
- [x] Role-based access control
- [x] Profile management with Prisma
- [x] Email verification through Brevo

### Patient Features

#### Search & Discovery
- [x] Doctor search by specialty
- [x] Doctor profile viewing
- [x] Availability filtering
- [x] Price filtering
- [x] Doctor ratings

#### Appointment Management
- [x] Doctor availability calendar
- [x] Appointment booking
- [x] Appointment rescheduling with email notifications
- [x] Appointment cancellation
- [x] 24-hour appointment reminders
- [x] Appointment confirmation emails
- [x] Appointment reschedule notifications

#### Medical Records
- [x] Personal medical history
- [x] Consultation history
- [x] Digital prescription management
- [x] Medical record encryption

#### Consultation
- [x] Video consultation integration
- [x] Secure messaging system
- [x] Consultation notes
- [x] Prescription issuance

### Doctor Features

#### Dashboard
- [x] Upcoming appointments
- [x] Schedule management
- [x] Patient history
- [x] Appointment status tracking

#### Consultation
- [x] Video consultation
- [x] Digital prescriptions
- [x] Consultation notes
- [x] Patient messaging

#### Practice Management
- [x] Availability management
- [x] Patient ratings
- [x] Profile management
- [x] Appointment scheduling

### Admin Features

#### User Management
- [x] Doctor registrations
- [x] User activity monitoring
- [x] Complaint handling
- [x] User permissions

#### Platform Management
- [x] System settings
- [x] Performance monitoring
- [x] Content management
- [x] Feature configuration

## Technical Implementation Details

### Email Service
- Uses Brevo (Sendinblue) API v3
- Configured with environment variables
- Default sender: tettehortis005@gmail.com
- Templates stored in `/src/lib/email/templates/`
- Supports HTML templates with variable interpolation
- Implements retry mechanism (3 attempts)
- Handles rate limiting and API errors gracefully
- Response time ~700-1200ms for email sends

### Database Structure
- PostgreSQL with Prisma ORM
- Tables:
  - users
  - doctors
  - patients
  - appointments
  - prescriptions
  - medical_records
  - consultations
  - messages

### Security Features
- JWT-based authentication
- Role-based access control
- Email verification
- Medical record encryption
- Secure messaging
- Rate limiting

## Current Status
- ✅ Complete authentication system
- ✅ Appointment management with email notifications
- ✅ Prescription management
- ✅ Video consultation integration
- ✅ Medical record management
- ✅ Email service implementation
- ✅ Appointment rescheduling
- ✅ gmail App password email integration
- 🔲 Advanced analytics
- 🔲 Mobile app integration
- 🔲 AI symptom checker
