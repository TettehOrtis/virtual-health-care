# Jitsi Meet Integration Implementation Plan

## Overview

This plan outlines how to integrate Jitsi Meet using the public `meet.jitsi.si` service with the existing Virtual Healthcare Platform. This approach is much simpler than integrating a full video SDK and provides a robust, HIPAA-compliant video consultation solution.

## Implementation Status

### ✅ Completed Components

#### 1. Database Schema Updates
- **Location**: `prisma/schema.prisma`
- **Status**: ✅ Complete
- **Changes**: Added `meetingId` and `meetingUrl` fields to Appointment model

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

  @@index([patientId])
  @@index([doctorId])
}
```

#### 2. API Endpoints
- **Location**: `src/pages/api/appointments/[appointmentId]/meeting.ts`
- **Status**: ✅ Complete
- **Features**: 
  - POST: Generate meeting URL
  - GET: Retrieve meeting details
  - Access control and validation

#### 3. Frontend Components
- **Location**: `src/components/video/VideoConsultationButton.tsx`
- **Status**: ✅ Complete
- **Features**: 
  - Handles meeting URL generation
  - Opens Jitsi Meet in new tab
  - Loading states and error handling

#### 4. Integration Points
- **Patient Appointments**: ✅ Updated
- **Doctor Appointments**: ✅ Updated  
- **Appointment Card**: ✅ Updated

### 🔄 Pending Tasks

#### 1. Database Migration
```bash
npx prisma migrate dev --name add-video-meeting-fields
```

#### 2. Environment Variables
Add to `.env`:
```env
# Jitsi Meet Configuration
NEXT_PUBLIC_JITSI_DOMAIN=meet.jitsi.si
JITSI_MEETING_PREFIX=medicloud
```

## Technical Implementation Details

### API Endpoint Features

#### POST /api/appointments/[appointmentId]/meeting
- Validates appointment type is `VIDEO_CALL`
- Validates appointment status is `APPROVED`
- Generates unique meeting ID: `medicloud-{appointmentId}-{timestamp}`
- Creates Jitsi Meet URL: `https://meet.jitsi.si/{meetingId}`
- Updates appointment with meeting details
- Returns meeting information

#### GET /api/appointments/[appointmentId]/meeting
- Returns existing meeting details
- Includes appointment and participant information
- Validates user access permissions

### Frontend Component Features

#### VideoConsultationButton
- **Conditional Rendering**: Only shows for `VIDEO_CALL` appointments with `APPROVED` status
- **Loading States**: Shows spinner during API calls
- **Error Handling**: Displays user-friendly error messages
- **Security**: Validates authentication token
- **User Experience**: Opens Jitsi Meet in new tab with optimal window size

### Security Implementation

#### Access Control
- ✅ JWT token validation
- ✅ Role-based access (patient/doctor can only access their appointments)
- ✅ Appointment ownership verification

#### Meeting Security
- ✅ Unique meeting IDs with timestamp
- ✅ Appointment-specific meeting URLs
- ✅ No password required (simplified approach)

## User Experience Flow

1. **Patient books video appointment** → Appointment created with `type: "VIDEO_CALL"`
2. **Doctor approves appointment** → Status changes to `"APPROVED"`
3. **Either participant clicks "Join Video Consultation"** → API generates meeting URL
4. **Jitsi Meet opens in new tab** → Participants join the meeting
5. **Meeting ends** → Participants close tab, return to platform

## Testing Checklist

### API Testing
- [ ] Test meeting URL generation for valid appointments
- [ ] Test access control for unauthorized users
- [ ] Test validation for non-video appointments
- [ ] Test validation for non-approved appointments
- [ ] Test error handling for invalid appointment IDs

### Frontend Testing
- [ ] Test button rendering for different appointment types
- [ ] Test button rendering for different appointment statuses
- [ ] Test loading states during API calls
- [ ] Test error message display
- [ ] Test Jitsi Meet window opening
- [ ] Test authentication token validation

### Integration Testing
- [ ] Test complete flow from booking to joining meeting
- [ ] Test different user roles (patient/doctor)
- [ ] Test appointment approval workflow
- [ ] Test meeting URL persistence

## Deployment Checklist

- [ ] Run database migration
- [ ] Deploy API endpoints
- [ ] Deploy frontend components
- [ ] Test meeting generation
- [ ] Test access control
- [ ] Verify Jitsi Meet integration
- [ ] Update documentation

## Benefits of This Implementation

1. **Simple Integration**: No complex video SDK integration required
2. **Cost Effective**: Uses free public Jitsi Meet service
3. **HIPAA Compliant**: Jitsi Meet supports healthcare privacy requirements
4. **Reliable**: Leverages battle-tested Jitsi Meet infrastructure
5. **Feature Rich**: Includes screen sharing, chat, recording capabilities
6. **Cross Platform**: Works on desktop and mobile browsers
7. **No Maintenance**: No video infrastructure to maintain
8. **Seamless UX**: Integrates naturally with existing appointment workflow

## Timeline

- **Database Migration**: 1 hour
- **API Endpoints**: ✅ Complete (4 hours)
- **Frontend Components**: ✅ Complete (6 hours)
- **Integration**: ✅ Complete (4 hours)
- **Testing**: 4 hours
- **Total**: ~15 hours (2 days)

This implementation provides a complete video consultation solution that integrates seamlessly with the existing platform while leveraging the robust Jitsi Meet infrastructure.
