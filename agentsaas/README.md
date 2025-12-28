# DentalAnswer AI

An AI-powered phone receptionist platform for dental practices. DentalAnswer AI ensures zero missed calls by providing a personalized 24/7 AI receptionist that can handle patient inquiries and book appointments directly into your practice's calendar.

## Features
- **Managed AI Voice Receptionist**: Powered by [Vapi.ai](https://vapi.ai) and custom voice models.
- **Smart Appointment Booking**: Automated multi-tenant integration with [Cal.com](https://cal.com).
- **Two-Way SMS**: Automated booking confirmations and patient interaction via Twilio.
- **Managed Telephony**: Seamless phone number provisioning (Search & Buy) directly within the dashboard.
- **Practice Insight Dashboard**: Real-time call logs, transcripts, and AI-generated call summaries.
- **Lead Generation**: Automatically captures missed follow-ups as leads.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + Radix UI (Shadcn/UI)
- **Voice Intelligence**: Vapi.ai API
- **Telephony**: Twilio SDK
- **Scheduling**: Cal.com API

---

## Setup Instructions

### 1. Environment Setup
Copy the example environment file and fill in the secrets:
```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations |
| `VAPI_API_KEY` | Your Vapi.ai Private API Key |
| `VAPI_WEBHOOK_SECRET` | Secret to verify Vapi webhooks |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `API_URL` | Base URL of your app (e.g. `https://myapp.vercel.app`) |

### 2. Database Migrations
1. Initialize your Supabase project.
2. Run the SQL scripts in order found in `supabase/migrations/`:
   - `schema.sql` (Initial tables)
   - `20251227_add_vapi_tables.sql` (Telephony infrastructure)
   - `20251228_add_calcom_fields.sql` (Multi-tenant booking)

### 3. Webhook Configuration
Ensure your `API_URL` is set correctly. The system will automatically configure Vapi and Twilio voice URLs during the phone number provisioning flow.

### 4. Local Development
```bash
npm install
npm run dev
```
Visit `http://localhost:3000`.

---

## Deployment
This project is designed for **Vercel**.
1. Push your repository to GitHub.
2. Link the repository to Vercel.
3. Add all variables from `.env.local` to the Vercel project settings.
4. Deploy!

## License
Distributed under the MIT License. See `LICENSE` for more information.
