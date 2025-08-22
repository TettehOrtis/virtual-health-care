# Paystack Billing Integration for Virtual Healthcare Platform

## Overview
This document describes how to integrate Paystack as the billing and payment solution for the Virtual Healthcare Platform. It covers backend, frontend, and database changes, and provides a step-by-step guide for developers.

---

## 1. Architecture

**Key Components:**
- **Frontend:** Next.js React pages/components for payment UI
- **Backend:** Next.js API routes for payment initialization, verification, and webhook handling
- **Database:** Prisma models for payments, subscriptions, and linking to appointments/prescriptions
- **Paystack:** External payment gateway for processing transactions

**Flow:**
1. User initiates a payment (e.g., for appointment)
2. Frontend calls backend API to initialize payment
3. Backend creates a Paystack transaction and returns the payment URL
4. User completes payment on Paystack
5. Paystack notifies backend via webhook
6. Backend verifies and updates payment status in DB
7. User is notified and service is unlocked

---

## 2. Database Schema (Prisma)

Add the following models and enums to `prisma/schema.prisma`:

```prisma
enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  CARD
  BANK_TRANSFER
  USSD
  MOBILE_MONEY
}

model Payment {
  id            String        @id @default(uuid())
  userId        String
  appointmentId String?       // Optional: for appointment payments
  amount        Decimal       @db.Decimal(10,2)
  currency      String        @default("NGN")
  method        PaymentMethod
  status        PaymentStatus @default(PENDING)
  paystackRef   String?       // Paystack reference
  description   String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  user          User          @relation(fields: [userId], references: [id])
  appointment   Appointment?  @relation(fields: [appointmentId], references: [id])
}
```

Add relations to `User` and `Appointment` models as needed.

---

## 3. Backend API Endpoints

### a. Initialize Payment
- **POST** `/api/payments/initialize`
- **Body:** `{ amount, currency, appointmentId, description }`
- **Logic:**
  - Create a Payment record (status: PENDING)
  - Call Paystack API to initialize transaction
  - Return Paystack payment URL to frontend

### b. Verify Payment
- **GET** `/api/payments/verify/:reference`
- **Logic:**
  - Call Paystack API to verify transaction
  - Update Payment record status
  - Return result to frontend

### c. Paystack Webhook
- **POST** `/api/webhooks/paystack`
- **Logic:**
  - Verify Paystack signature
  - Update Payment record based on event
  - Unlock service (e.g., confirm appointment)

---

## 4. Frontend Integration

### a. Payment Button/Form
- Add a payment button/form to appointment booking or billing pages
- On click, call `/api/payments/initialize` and redirect user to Paystack checkout URL

### b. Payment Success/Failure Handling
- After payment, Paystack redirects user back to a callback page (e.g., `/payment/callback?reference=...`)
- On this page, call `/api/payments/verify/:reference` to confirm payment
- Show success/failure message and unlock service

### c. Payment History
- Add a page/component to show user's payment history by fetching from `/api/payments/history`

---

## 5. Paystack Setup

- Create a Paystack account and get your **public** and **secret** keys
- Add these to your `.env`:
```
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
```
- Set your webhook URL in the Paystack dashboard to `/api/webhooks/paystack`

---

## 6. Security & Compliance
- Always verify Paystack webhook signatures
- Never trust payment status from the frontend—always verify with Paystack
- Use HTTPS for all payment-related endpoints
- Do not store card details on your server

---

## 7. Example: Payment Initialization (Backend)

```typescript
// /src/pages/api/payments/initialize.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { amount, currency, appointmentId, description } = req.body;
  // 1. Create Payment record
  // 2. Call Paystack API
  // 3. Return payment URL
}
```

---

## 8. Example: Payment Button (Frontend)

```tsx
// /src/components/payment/PayButton.tsx
const handlePay = async () => {
  const res = await fetch('/api/payments/initialize', { method: 'POST', body: JSON.stringify({ ... }) });
  const data = await res.json();
  window.location.href = data.authorizationUrl;
};
<Button onClick={handlePay}>Pay Now</Button>
```

---

## 9. Testing
- Use Paystack test cards for development
- Test all flows: success, failure, cancellation, webhook

---

## 10. References
- [Paystack Docs](https://paystack.com/docs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma Docs](https://www.prisma.io/docs/)

---

**Update this documentation as you implement and refine the integration.**



Absolutely! Here’s how you can test your Paystack billing backend endpoints using Postman:
1. /api/payments/initialize (POST)
Purpose: Start a new payment and get the Paystack payment URL.
How to test:
Method: POST
URL: http://localhost:3000/api/payments/initialize
Headers:
Content-Type: application/json
Body (JSON):
What to expect:
A JSON response with authorizationUrl (Paystack payment link), reference, and paymentId.
2. /api/payments/verify/[reference] (GET)
Purpose: Verify a payment after Paystack redirects back.
How to test:
Method: GET
URL:
Replace [reference] with the paymentId or Paystack reference you got from the initialize step.
What to expect:
A JSON response with status: SUCCESS or FAILED, and payment details.
3. /api/webhooks/paystack (POST)
Purpose: Simulate a webhook from Paystack (advanced, optional for manual testing).
How to test:
Method: POST
URL: http://localhost:3000/api/webhooks/paystack
Headers:
Content-Type: application/json
x-paystack-signature: (You must generate a valid signature for a real test, or temporarily disable signature check for local testing)
Body (JSON):
What to expect:
A JSON response { "received": true } if successful.
Tips:
For /api/payments/initialize, you can use any test data, but amount should be a number (e.g., 5000 for ₦5,000).
For /api/payments/verify/[reference], use the reference you got from the initialize step.
For real Paystack testing, use their test cards and follow the payment link in the response.
Let me know if you want a step-by-step screenshot guide or if you hit any errors in Postman!