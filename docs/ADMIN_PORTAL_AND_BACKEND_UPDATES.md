## Overview
This document summarizes the recent changes made to the admin experience and backend schema. It covers schema updates, new API routes, admin UI pages, auth flows, and how to create an admin account for access.

## What changed
- Admin pages are now data-driven (no hardcoded lists). They load from backend API routes backed by Prisma (Supabase Postgres).
- Admin pages are wrapped with a consistent layout and navigation:
  - `src/components/admin/AdminLayout.tsx`
  - `src/components/admin/AdminSidebar.tsx`
- Prisma schema simplified and aligned with current product scope.

## Schema updates (Prisma)
- Appointment enums aligned with app usage:
  - `AppointmentType`: IN_PERSON, ONLINE, VIDEO_CALL
  - `AppointmentStatus`: PENDING, APPROVED, REJECTED, COMPLETED, CANCELED
- Removed unused models/enums and relations that were not used anywhere in the application:
  - Models removed: `Transaction`, `Document`, `Pharmacy`, `HospitalDoctor`
  - Enums removed: `ReportTarget`, `ReportStatus`
- Simplifications/fixes:
  - `Report.type` is now `String`
  - Added back-relation `User.notifications: Notification[]`
  - `Hospital` model simplified to basic fields: `name`, `location`, `services?`, `licenseNo`, `status`, `createdAt`

Apply migrations after pulling code:
```bash
npx prisma migrate dev --name admin_portal_and_schema_updates
npx prisma generate
```

## Admin API routes
All admin API routes require `Authorization: Bearer <JWT>` for a user with role `ADMIN`.

- `GET /api/admin/stats`
  - Returns counts: `doctors`, `patients`, `appointments`, `completedAppointments`

- `GET /api/admin/doctors`
  - Returns each doctor with `name`, `email`, `specialization`, and `stats`:
    - `stats.appointmentCount`, `stats.prescriptionCount`

- `GET /api/admin/patients`
  - Returns each patient with `name`, `email`, `phone`, and `stats`:
    - `stats.appointmentCount`, `stats.prescriptionCount`, `stats.medicalRecordCount`

- `GET /api/admin/hospitals`
  - Returns hospitals from simplified `Hospital` model with placeholder `stats` (set to 0 for now)

- `GET /api/admin/notifications`
  - Returns notifications with user info (`name`, `email`)

- `GET /api/admin/medical-records`
  - Returns medical records with `title`, `fileType`, `fileName`, `uploadedAt`, and patient name

Example request:
```bash
curl -H "Authorization: Bearer <admin_jwt>" http://localhost:3000/api/admin/stats
```

## Admin UI pages
- Wrapped with `AdminLayout` and `AdminSidebar` for a consistent layout and navigation.
- Pages and data sources:
  - `src/pages/Admin/adminDashboard.tsx` → `/api/admin/stats`
  - `src/pages/Admin/doctors.tsx` → `/api/admin/doctors`
  - `src/pages/Admin/patients.tsx` → `/api/admin/patients`
  - `src/pages/Admin/hospital.tsx` → `/api/admin/hospitals`
  - `src/pages/Admin/pharmacy.tsx` → `/api/admin/hospitals` (repurposed; `Pharmacy` model removed)
  - `src/pages/Admin/document.tsx` → `/api/admin/medical-records`
  - `src/pages/Admin/notification.tsx` → `/api/admin/notifications`

Navigation links are in `src/components/admin/AdminSidebar.tsx`.

## Authentication/Authorization
- The login API (`/api/auth/login`) now returns a role-aware `redirectUrl`:
  - `ADMIN` → `/Admin/adminDashboard`
  - `DOCTOR` → `/doctor-frontend/<doctorId>/dashboard`
  - `PATIENT` → `/patient-frontend/<patientId>/dashboard`
- The login form (`src/components/auth/authform.tsx`) uses the server-provided `redirectUrl` when present.
- Admin API routes use `verifyToken` from `src/middleware/auth.ts` and reject non-admin users.

## Creating an admin account
There is no public signup for admin. Create via one of these approaches:

### Option A: Supabase Dashboard + Prisma Studio
1. Supabase Dashboard → Authentication → Add user (set email, password) and confirm email
2. Copy the new Supabase user `id` (UUID)
3. Run `npx prisma studio` and add a row to `User`:
   - `supabaseId`: the UUID copied above
   - `email`: same email
   - `fullName`: e.g., "Admin"
   - `role`: `ADMIN`

### Option B: One-time script (server-side)
Create `scripts/create-admin.js` (uses service role key) to add Supabase auth user and a Prisma `User` row with role `ADMIN`.
```bash
node scripts/create-admin.js admin@example.com StrongPass123 "Admin User"
```

## Setup and run
1. Configure environment variables in `.env`:
   - `DATABASE_URL`, `DIRECT_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side usage only)
2. Apply migrations and generate client:
   - `npx prisma migrate dev`
   - `npx prisma generate`
3. Start the app:
   - `npm run dev`

## Testing checklist
- Login as an ADMIN and verify redirect to `/Admin/adminDashboard`
- Admin pages load data (Doctors, Patients, Hospitals, Documents, Notifications)
- Admin API endpoints return 200 with expected payload shape
- Non-admin access to admin APIs returns 403

## Breaking changes
- Removed models: `Pharmacy`, `Document`, `HospitalDoctor`, `Transaction`. Any code referencing them was removed or repurposed.
- Appointment status uses `CANCELED` (American spelling). Update any references to `CANCELLED`.
- `NotificationType` pruned to: `APPOINTMENT`, `PRESCRIPTION`, `MESSAGE`, `SYSTEM`.

## Future improvements
- Add management actions to admin pages (approve/reject, edit entities)
- Implement metrics for hospitals (counts) once relations are reintroduced
- Add pagination and filters for large datasets

