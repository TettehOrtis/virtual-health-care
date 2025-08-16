# Real-Time Messaging with Supabase: Implementation Plan

## Overview
Enable secure, real-time chat between patients and doctors, tightly integrated with the appointment system. Chat is only available if:
- There is an active conversation (created on first appointment)
- The last appointment's endTime + 7 days > now()

If not, the chat is closed and users are prompted to book a new appointment.

---

## Supabase Setup Plan

### 1. Supabase Project Creation
- Go to [supabase.com](https://supabase.com/) and create a new project.
- Set up your database password and region.
- Note your project URL and anon/public keys for client integration.

### 2. Database Table Setup
- Use the Supabase SQL editor or Table Designer to create the following tables:

#### conversations
```sql
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references users(id),
  doctor_id uuid references users(id),
  created_at timestamp with time zone default now(),
  unique (patient_id, doctor_id)
);
```

#### messages
```sql
create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id),
  sender_id uuid references users(id),
  content text not null,
  created_at timestamp with time zone default now()
);
```

#### appointments (add endTime if not present)
```sql
alter table appointments add column if not exists endTime timestamp with time zone;
```

### 3. Enable Realtime on Tables
- In the Supabase dashboard, go to "Database" > "Replication" (or "Realtime")
- Enable Realtime for the `messages` table (and optionally `conversations`)
- This allows clients to subscribe to new messages instantly

### 4. Row Level Security (RLS)
- Enable RLS on `conversations` and `messages`
- Add policies so only the patient and doctor in a conversation can read/write messages
- Example:
```sql
-- Only allow patient or doctor to select/insert messages
create policy "Patient or Doctor can access messages" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.patient_id = auth.uid() or c.doctor_id = auth.uid())
    )
  );
```

### 5. Supabase Client Integration
- Install supabase-js in your frontend:
  ```bash
  npm install @supabase/supabase-js
  ```
- Initialize the client with your project URL and anon/public key
- Use the client to:
  - Query for conversations/messages
  - Subscribe to new messages in real time
  - Insert new messages

### 6. Environment Variables
- Store your Supabase project URL and anon/public key in your `.env` or environment config

---

## 1. Database Design (Supabase/Postgres)

### Tables
- **users** (already exists)
- **appointments** (already exists, must have `endTime` field)
- **conversations**
  - `id` (PK)
  - `patient_id` (FK to users)
  - `doctor_id` (FK to users)
  - `created_at`
- **messages**
  - `id` (PK)
  - `conversation_id` (FK)
  - `sender_id` (FK to users)
  - `content` (text)
  - `created_at`

### Indexes
- On `conversations` for (patient_id, doctor_id) uniqueness
- On `appointments` for (patient_id, doctor_id, endTime)

---

## 2. Booking Flow Logic

### When a Patient Books an Appointment
1. **Check for Existing Conversation**
   - Query `conversations` for (patient_id, doctor_id)
2. **If Not Exists, Create**
   - Insert new row in `conversations`
3. **(Optional) Notify both users of new chat availability**

---

## 3. Appointment End Logic
- When appointment is completed, set `endTime` in `appointments`.
- This is used to determine chat window.

---

## 4. Chat Access Logic (Backend/API)

### When Patient/Doctor Opens Chat
1. **Check for Active Conversation**
   - Query `conversations` for (patient_id, doctor_id)
   - If not found, show “No chat available. Book an appointment.”
2. **Get Last Appointment EndTime**
   - Query `appointments` for (patient_id, doctor_id), order by `endTime` desc, limit 1
   - If no appointment, show “No chat available. Book an appointment.”
3. **Check Chat Window**
   - If `lastAppointment.endTime + 7 days > now()`, allow chat
   - Else, show “Chat closed. Please book a new appointment.”

---

## 5. Real-Time Messaging (Supabase Realtime)
- Use Supabase Realtime (Postgres changes or dedicated Realtime API) to listen for new messages in `messages` table.
- Frontend subscribes to `messages` for the current conversation.
- On new message, update chat UI instantly.

---

## 6. API Endpoints (Node/Next.js)
- `GET /api/conversations/:doctorId/:patientId` → returns conversation or creates if not exists
- `GET /api/conversations/:conversationId/messages` → paginated messages
- `POST /api/conversations/:conversationId/messages` → send message
- `GET /api/conversations/:conversationId/active` → returns {active: true/false, reason: string}

---

## 7. Frontend Logic
- On chat open, call `/active` endpoint to check if chat is allowed
- If allowed, show chat UI and subscribe to messages
- If not, show “Chat closed. Please book a new appointment.”
- When sending a message, call POST endpoint

---

## 8. Security & Privacy
- Only allow patient and doctor in a conversation to access messages
- Enforce access control in all endpoints
- Optionally, encrypt messages at rest

---

## 9. Cleanup/Archival
- Optionally, archive or delete conversations/messages after X months

---

## 10. Example Timeline
1. Patient books appointment → Conversation created if needed
2. Appointment ends → endTime set
3. Patient/doctor can chat for 7 days after endTime
4. After 7 days, chat is closed until a new appointment is booked

---

## 11. Future Enhancements
- Push/email notifications for new messages
- File/image attachments
- Group chat (multi-doctor, care team)
- Admin moderation tools

---

## 12. Summary
This system ensures:
- Chat is only available when there is a recent clinical relationship
- No open-ended messaging (privacy, compliance)
- Seamless integration with appointments
- Real-time, modern chat experience for both patients and doctors
