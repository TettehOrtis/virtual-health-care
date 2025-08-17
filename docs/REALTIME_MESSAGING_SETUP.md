# Real-Time Messaging System Setup Guide

## Overview
This guide covers the complete setup and implementation of the real-time messaging system between patients and doctors using Supabase Realtime.

## What's Been Implemented

### ✅ Backend API Endpoints
- `POST /api/conversations` - Create new conversations
- `GET /api/conversations` - Fetch user conversations
- `GET /api/conversations/[conversationId]/messages` - Get messages for a conversation
- `POST /api/conversations/[conversationId]/messages` - Send new messages
- `GET /api/conversations/[conversationId]/active` - Check if chat is active
- `POST /api/appointments/create-conversation` - Auto-create conversations from completed appointments

### ✅ Frontend Components
- **Doctor Messages Page** (`/doctor-frontend/messages`)
- **Patient Messages Page** (`/patient-frontend/[patientId]/messages`)
- **ScrollArea Component** - Custom scrollable area component
- **Real-time Subscriptions** - Supabase Realtime integration

### ✅ Database Schema
- `conversations` table with patient/doctor relationships
- `messages` table for storing chat messages
- Integration with existing `appointments` table

## Setup Requirements

### 1. Supabase Configuration
Ensure your `.env.local` file contains:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

### 2. Database Tables
The following tables should already exist (from Prisma schema):
- `conversations` - Links patients and doctors
- `messages` - Stores individual chat messages
- `appointments` - Must have `endTime` field for chat window logic

### 3. Enable Supabase Realtime
In your Supabase dashboard:
1. Go to **Database** → **Replication**
2. Enable Realtime for the `messages` table
3. This allows real-time subscriptions to work

## How It Works

### Chat Access Logic
- **Chat Window**: 7 days after appointment completion
- **Access Control**: Only patient and doctor in a conversation can chat
- **Automatic Creation**: Conversations are created when appointments are completed
- **Security**: Row Level Security (RLS) enforced on all tables

### Real-time Features
- **Instant Updates**: New messages appear immediately via Supabase Realtime
- **Auto-scroll**: Chat automatically scrolls to latest messages
- **Status Indicators**: Shows remaining chat time and active status

### User Experience
- **Conversation List**: Shows all available conversations
- **Chat Interface**: Modern, responsive chat UI
- **Status Badges**: Visual indicators for chat availability
- **Empty States**: Helpful messages when no conversations exist

## Usage

### For Doctors
1. Navigate to `/doctor-frontend/messages`
2. Select a patient conversation from the left panel
3. Send and receive messages in real-time
4. View chat status and remaining time

### For Patients
1. Navigate to `/patient-frontend/[patientId]/messages`
2. Select a doctor conversation from the left panel
3. Chat with your doctor within the 7-day window
4. Book new appointments when chat expires

### Creating Conversations
Conversations are automatically created when:
- An appointment is marked as `COMPLETED`
- The `endTime` field is set on the appointment
- API endpoint `/api/appointments/create-conversation` is called

## API Endpoints Reference

### Conversations
```typescript
// Get all conversations for authenticated user
GET /api/conversations
Authorization: Bearer <token>

// Create new conversation
POST /api/conversations
Authorization: Bearer <token>
Body: { patientId: string, doctorId: string }
```

### Messages
```typescript
// Get messages for a conversation
GET /api/conversations/[conversationId]/messages
Authorization: Bearer <token>

// Send a message
POST /api/conversations/[conversationId]/messages
Authorization: Bearer <token>
Body: { content: string }
```

### Chat Status
```typescript
// Check if chat is active
GET /api/conversations/[conversationId]/active
Authorization: Bearer <token>
```

## Security Features

### Authentication
- JWT token required for all API endpoints
- User must be authenticated to access conversations
- Role-based access control (PATIENT/DOCTOR)

### Data Protection
- Row Level Security (RLS) on Supabase tables
- Users can only access their own conversations
- Messages are isolated by conversation ID

### Input Validation
- Message content validation (non-empty, trimmed)
- Conversation ID validation
- User authorization checks

## Troubleshooting

### Common Issues

1. **Messages not appearing in real-time**
   - Check if Supabase Realtime is enabled on `messages` table
   - Verify Supabase configuration in environment variables
   - Check browser console for subscription errors

2. **Chat shows as "closed"**
   - Verify appointment has `endTime` set
   - Check if appointment status is `COMPLETED`
   - Ensure 7-day window hasn't expired

3. **Conversations not loading**
   - Verify user authentication
   - Check JWT token validity
   - Ensure user has completed appointments

4. **Permission denied errors**
   - Verify user is part of the conversation
   - Check RLS policies in Supabase
   - Ensure proper user role (PATIENT/DOCTOR)

### Debug Steps
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check Supabase logs for database errors
4. Verify environment variables are loaded

## Future Enhancements

### Planned Features
- **Push Notifications**: Email/SMS alerts for new messages
- **File Attachments**: Support for images and documents
- **Group Chats**: Multi-doctor care team conversations
- **Message Search**: Search through conversation history
- **Read Receipts**: Track message read status

### Performance Optimizations
- **Message Pagination**: Load messages in chunks
- **Offline Support**: Queue messages when offline
- **Message Encryption**: End-to-end encryption
- **Caching**: Redis-based message caching

## Testing

### Manual Testing
1. Complete an appointment (set status to COMPLETED)
2. Navigate to messages page
3. Send test messages between patient and doctor
4. Verify real-time updates
5. Test chat window expiration

### API Testing
Use tools like Postman or curl to test endpoints:
```bash
# Test conversation creation
curl -X POST /api/conversations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"patientId": "uuid", "doctorId": "uuid"}'
```

## Support

For issues or questions:
1. Check this documentation
2. Review Supabase documentation
3. Check browser console for errors
4. Verify database schema and RLS policies

## Conclusion

The real-time messaging system provides a secure, efficient way for patients and doctors to communicate within a controlled time window. The system automatically manages conversations based on appointments and ensures proper access control while delivering an excellent user experience.
