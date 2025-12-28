# DentalAnswer AI Architecture Document

## 1. Introduction
This document outlines the overall project architecture for DentalAnswer AI. It serves as the guiding blueprint for development, ensuring consistency and adherence to chosen patterns.

### Technical Summary
DentalAnswer AI is built as a **Serverless Modular Monolith** using the **Next.js 14 App Router**. It leverages **Supabase** for backend-as-a-service (Auth, DB, Realtime) and **Vapi.ai** for the specialized AI Voice agent orchestration. The architecture prioritizes rapid MVP delivery, type safety via TypeScript, and near-zero devops overhead through Vercel deployment.

## 2. High Level Architecture
### High Level Overview
- **Architectural Style:** Serverless (Next.js + Supabase).
- **Repository Structure:** Single Repo (Standard Next.js structure).
- **Data Flow:**
  1. **Voice:** PSTN -> Vapi.ai -> (Webhooks) -> Next.js API -> Supabase.
  2. **User:** Browser -> Next.js UI -> Supabase (via Client SDK or Server Actions).
- **Key Decision:** Choosing **Supabase** over a custom backend allows us to skip building auth/db/infra from scratch, focusing purely on the AI Voice logic and Dashboard value.

### Architectural Patterns
- **Serverless API:** All backend logic resides in Next.js API Routes (or Server Actions). _Rationale:_ Cost-effective and scales automatically with Vercel.
- **Event-Driven Webhooks:** Vapi.ai interacts with our system entirely via asynchronous webhooks. _Rationale:_ Decouples the voice provider from our internal logic.
- **Client-Side Realtime:** Using Supabase Realtime for the dashboard. _Rationale:_ Provides "live" feel for call logs without polling.

## 3. Tech Stack
| Category | Technology | Version | Purpose | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Language** | TypeScript | 5.x | Core Language | Type safety across full stack. |
| **Framework** | Next.js | 14 (App Router) | Fullstack Framework | Industry standard, robust routing, server actions. |
| **Database** | Supabase (Postgres) | Latest | Primary DB & Auth | Managed Postgres + Auth + Realtime in one. |
| **Voice Ops** | Vapi.ai | v1 API | Voice Orchestration | Best-in-class abstraction for LLM voice agents. |
| **Styling** | Tailwind CSS | 3.x | Styling | Rapid UI development. |
| **UI Library** | Shadcn/UI | Latest | UI Components | Accessible, copy-pasteable components. |
| **Deployment** | Vercel | N/A | Hosting | Native Next.js support, zero config. |
| **Scheduling** | Cal.com | v1 API | Booking Engine | Handling complex scheduling logic out of the box. |

## 4. Data Models

### 1. `practices`
**Purpose:** Stores configuration and details for each dental practice (tenant).
**Key Attributes:**
- `id`: UUID (PK)
- `name`: String
- `phone_number`: String (The assigned Vapi number)
- `forwarding_number`: String (Office fallback)
- `office_hours`: JSON (Weekly schedule)
- `created_at`: Timestamp

### 2. `calls`
**Purpose:** Logs every interaction between the AI and a caller.
**Key Attributes:**
- `id`: UUID (PK)
- `practice_id`: UUID (FK)
- `caller_number`: String
- `status`: String (completed, missed, transferred)
- `duration_seconds`: Integer
- `recording_url`: String (URL to audio)
- `transcript`: Text
- `summary`: Text (AI generated summary)
- `started_at`: Timestamp

### 3. `bookings`
**Purpose:** Records successful appointments projected from the call.
**Key Attributes:**
- `id`: UUID (PK)
- `call_id`: UUID (FK)
- `practice_id`: UUID (FK)
- `patient_name`: String
- `start_time`: Timestamp
- `cal_booking_id`: String (External ref)
- `status`: String (confirmed, cancelled)

## 5. Components

### 1. `Voice Webhook Handler`
**Responsibility:** Receives events from Vapi.ai (call-started, tool-calls, call-ended).
**Key Interfaces:**
- `POST /api/vapi/webhook`
**Dependencies:** Vapi SDK, Supabase Admin Client.

### 2. `Booking Service`
**Responsibility:** Interacts with Cal.com to check availability and book slots.
**Key Interfaces:**
- `checkAvailability(start, end)`
- `bookAppointment(slot, details)`
**Dependencies:** Cal.com API.

### 3. `Dashboard UI`
**Responsibility:** Admin interface for practice owners.
**Key Interfaces:**
- `CallLogTable`
- `AppointmentList`
**Dependencies:** Supabase Client (Auth + Data).

## 6. Security
- **Input Validation:** Zod schemas for all API routes and Server Actions.
- **Authentication:** Supabase Auth (Clerk/Auth0 mentioned in brief, but Supabase Auth is native and preferred if using Supabase DB to reduce complexity. Will stick to **Supabase Auth** unless strict requirement otherwise).
- **Row Level Security (RLS):** CRITICAL. All `calls` and `bookings` must have RLS policies ensuring a practice user can ONLY see their own data.
- **Environment Variables:** All API keys (Vapi, Cal, Supabase Service Role) stored in `.env.local` / Vercel Envs.

## 7. Next Steps
- **UX Expert:** Not strictly needed if sticking to Shadcn/UI defaults, but good for "Clinical" look polish.
- **Dev Agent:** Ready to start implementing Epic 1 (Infrastructure).
