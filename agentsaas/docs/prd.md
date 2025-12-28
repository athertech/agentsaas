# DentalAnswer AI Product Requirements Document (PRD)

## 1. Goals and Background Context
### Goals
- Fully automate phone reception for dental practices 24/7.
- Enable immediate appointment booking via Cal.com integration.
- Ensure 0% missed lead rate (answer every call).
- Achieve a sub-3-second response time for AI interactions.
- Provide a simple dashboard for practice owners to view leads and bookings.

### Background Context
Dental practices lose significant revenue due to missed calls and limited front-desk availability. Staff are often occupied with in-office patients, leading to a poor caller experience and lost opportunities. DentalAnswer AI aims to solve this by providing an always-on, intelligent voice agent that answers calls instantly, engages naturally, and secures bookings directly into the practice's calendar. The project follows a "Lean MVP" approach to validate the core value proposition quickly.

### Change Log
| Date       | Version | Description     | Author |
| :--------- | :------ | :-------------- | :----- |
| 2025-12-13 | 1.0     | Initial MVP PRD | PM     |

## 2. Requirements
### Functional
- **FR1:** The system answers incoming PSTN calls within 3 seconds.
- **FR2:** The AI agent engages in natural conversation to determine caller intent (New Booking, Existing Patient, General Query).
- **FR3:** The AI agent checks real-time availability using Cal.com API.
- **FR4:** The AI agent books an appointment on Cal.com upon caller confirmation.
- **FR5:** The system sends an SMS confirmation to the caller immediately after booking via Twilio.
- **FR6:** The AI agent transfers the call to a configured forwarding number if the query is complex or requested by the caller.
- **FR7:** The dashboard displays a log of all calls (Time, Caller ID, Duration, Outcome).
- **FR8:** The dashboard displays a list of booked appointments with patient details.
- **FR9:** Comparison of "Practice Settings" allowing configuration of office hours, forwarding number, and appointment types.
- **FR10:** Admin login handling via Clerk or Auth0.

### Non-Functional
- **NFR1:** Voice latency must be minimized (target <800ms perception) for natural feel.
- **NFR2:** System must be HIPAA compliant (Data encryption at rest/transit, BAA with providers).
- **NFR3:** Dashboard must be mobile-responsive.
- **NFR4:** High availability (99.9% uptime) for telephony services.

## 3. User Interface Design Goals
### Overall UX Vision
Clean, professional, and "clinical but modern". The dashboard should feel like a medical tool but with the ease of use of modern SaaS. Focus on clarity and quick access to actionable data (leads).

### Key Interaction Paradigms
- **Dashboard First:** Immediate view of "Today's Performance" (Calls, Bookings) upon login.
- **Real-time Updates:** Call logs should update without page refresh (using Supabase Realtime).

### Core Screens
- **Login/Signup:** Secure entry.
- **Main Dashboard:** Metrics + Recent Activity Feed.
- **Call Logs:** Detailed table of all calls + Audio player for recordings.
- **Settings:** Form for configuring agent behavior and business rules.

### Accessibility
- WCAG AA

### Target Platforms
- Web Responsive (Desktop focus for admin work, Mobile for quick checks).

## 4. Technical Assumptions
- **Repository Structure:** Monorepo (Turborepo or simple Next.js root) is preferred for simplicity.
- **Frontend:** Next.js 14 App Router, Tailwind CSS, Shadcn/UI.
- **Backend:** Next.js API Routes (Serverless) + Supabase (Postgres, Auth, Realtime).
- **Voice Stack:** Vapi.ai (Orchestration) -> Deepgram (Transcriber) -> LLM (GPT-4o/Claude) -> 11Labs/Deepgram (Voice).
- **Integrations:**
    - Cal.com (Scheduling)
    - Twilio (SMS/SIP)
- **Deployment:** Vercel.

## 5. Epic List
- **Epic 1: Foundation & Core Infrastructure:** Set up Next.js repo, Supabase, Auth, and Vapi.ai basics.
- **Epic 2: AI Voice Agent & Booking Logic:** Implement the Vapi.ai agent configuration, tool calling for Cal.com, and call handling logic.
- **Epic 3: Dashboard & Lead Management:** Build the UI for viewing call logs, bookings, and analytics.
- **Epic 4: Settings & Configuration:** Allow users to configure their practice details and agent behavior.
- **Epic 5: Notification & Polish:** SMS integration and final UX refinements.

## 6. Epic Details

### Epic 1: Foundation & Core Infrastructure
**Goal:** Establish the technical groundwork including the project repository, database, authentication, and initial connection to the Voice AI provider.
- **Story 1.1: Project Setup:** Initialize Next.js 14 app with Tailwind + Shadcn.
    - *AC1:* Repo created and accessible.
    - *AC2:* Shadcn components (Button, Input, Card) configured.
    - *AC3:* CI/CD pipeline (Vercel) passing.
- **Story 1.2: Database & Auth Setup:** Configure Supabase project and Clerk/Auth0 authentication.
    - *AC1:* Supabase instance running.
    - *AC2:* User can sign up and log in.
    - *AC3:* Protected routes created.
- **Story 1.3: Vapi.ai Start:** Create Vapi account and obtain API keys, setting up a basic "Hello World" phone number.
    - *AC1:* Phone number provisioned.
    - *AC2:* Calling the number results in a basic AI greeting.

### Epic 2: AI Voice Agent & Booking Logic
**Goal:** Implement the "brain" and "voice" of the receptionist, enabling it to talk, check schedules, and book slots.
- **Story 2.1: Agent System Prompt Design:** Configure the Vapi assistant with the "Dental Receptionist" persona and instructions.
    - *AC1:* Agent identifies as "Sarah" from the practice.
    - *AC2:* Agent follows the script flow (Greeting -> Intent -> Info Gathering).
- **Story 2.2: Cal.com Tool Integration:** Implement the `checkAvailability` and `bookAppointment` functions for the AI to use.
    - *AC1:* Agent can query Cal.com for available slots.
    - *AC2:* Agent can successfully execute a booking on Cal.com.
- **Story 2.3: Call Hand-off Logic:** Implement logic to transfer call if user asks for a human.
    - *AC1:* Agent detects "Speak to human" intent.
    - *AC2:* Call is forwarded to the configured backend number.

### Epic 3: Dashboard & Lead Management
**Goal:** Provide visibility into the "Black Box" of AI calls for the practice owner.
- **Story 3.1: Call Logging Webhook:** Create a webhook to receive call data from Vapi.ai after each call.
    - *AC1:* Endpoint `POST /api/webhooks/vapi` receives call summary.
    - *AC2:* Data is verified and stored in Supabase `calls` table.
- **Story 3.2: Dashboard UI:** Create the main overview page.
    - *AC1:* Display total calls and bookings count.
    - *AC2:* Display list of recent calls with status tags (Booked, Missed, Transferred).

### Epic 4: Settings & Configuration
**Goal:** Make the agent customizable for different practices.
- **Story 4.1: Practice Profile:** Form to update practice name, address, and timezone.
    - *AC1:* User can update profile.
    - *AC2:* AI prompt dynamically uses these values.
- **Story 4.2: Opening Hours Config:** UI to set operational hours.
    - *AC1:* User deals with a weekly schedule UI.
    - *AC2:* AI checks this configuration before offering times (if not syncing 100% with Cal).

### Epic 5: Notification & Polish
**Goal:** Close the loop with SMS and ensure reliability.
- **Story 5.1: SMS Confirmation:** Send SMS upon successful booking.
    - *AC1:* Twilio integration sends text with date/time.
- **Story 5.2: Error Handling & Fallback:** Graceful handling if Cal.com is down or AI fails.
    - *AC1:* Fallback message defined.

## 7. Next Steps
### UX Expert Prompt
Create a high-fidelity wireframe for the "Dashboard" and "Settings" pages. Focus on a clean, medical-grade aesthetic (whites, blues, teals). Key challenge: Displaying call audio and transcript in an intuitive way.

### Architect Prompt
Design the webhook architecture to handle high-concurrency callbacks from Vapi.ai. Ensure the Cal.com integration is robust and handles timezones correctly. Review HIPAA compliance requirements for the database schema.
