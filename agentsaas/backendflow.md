# DentalAnswer AI - Complete Backend Architecture & Flow

This comprehensive backend architecture gives you everything needed to build a production-ready DentalAnswer AI system. The key components are:

1. **Robust data models** with proper relationships
2. **Complete API workflows** for all user interactions
3. **Real-time capabilities** with WebSockets
4. **HIPAA compliance** with audit logging
5. **Scalable infrastructure** with caching and queues
6. **Comprehensive error handling** and monitoring
7. **Security best practices** throughout




## 🏗️ **SYSTEM ARCHITECTURE OVERVIEW**

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Marketing │  │Dashboard │  │ Settings │  │Analytics │       │
│  │  Pages   │  │   App    │  │   Pages  │  │  Pages   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ API Calls (REST/GraphQL)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    API LAYER (Next.js API Routes)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   Auth   │  │  Calls   │  │Calendar  │  │Webhooks  │       │
│  │   API    │  │   API    │  │   API    │  │   API    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
┌───────────▼──────┐  ┌──────▼──────┐  ┌─────▼──────────┐
│   PostgreSQL     │  │   Redis     │  │   S3 Storage   │
│   (Supabase)     │  │   (Cache)   │  │  (Recordings)  │
│                  │  │             │  │                │
│ • Users          │  │ • Sessions  │  │ • Call Audio   │
│ • Practices      │  │ • Rate Limit│  │ • Transcripts  │
│ • Calls          │  │ • Real-time │  │ • Voicemails   │
│ • Appointments   │  │   Data      │  │                │
│ • Patients       │  └─────────────┘  └────────────────┘
└──────────────────┘
            │
            │
┌───────────▼──────────────────────────────────────────────┐
│              EXTERNAL SERVICES & INTEGRATIONS             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Vapi.ai  │  │  Twilio  │  │ Cal.com  │  │  Stripe  ││
│  │  (Voice  │  │  (SMS)   │  │(Calendar)│  │(Billing) ││
│  │   AI)    │  └──────────┘  └──────────┘  └──────────┘│
│  └──────────┘                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ OpenAI   │  │  Resend  │  │PostHog/  │  │ Sentry   ││
│  │(Transcr.)│  │ (Email)  │  │Mixpanel  │  │ (Errors) ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
└───────────────────────────────────────────────────────────┘
```

---

## 📊 **DATABASE SCHEMA (PostgreSQL)**

### **Core Tables**

```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
  role VARCHAR(20) DEFAULT 'owner' -- owner, admin, staff
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- PRACTICES (Dental Offices)
-- ============================================

CREATE TABLE practices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL, -- bright-smile-dental
  
  -- Contact Info
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Settings
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  practice_types JSONB, -- ["general", "cosmetic"]
  insurance_accepted JSONB, -- ["Delta Dental", "Cigna"]
  
  -- Subscription
  subscription_status VARCHAR(20) DEFAULT 'trial', -- trial, active, past_due, cancelled
  subscription_plan VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
  trial_ends_at TIMESTAMP,
  
  -- AI Configuration
  ai_voice_id VARCHAR(50) DEFAULT 'emma',
  ai_greeting_message TEXT,
  ai_personality VARCHAR(20) DEFAULT 'professional', -- professional, friendly, casual
  ai_transfer_enabled BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0
);

CREATE INDEX idx_practices_owner ON practices(owner_id);
CREATE INDEX idx_practices_slug ON practices(slug);

-- ============================================
-- TEAM MEMBERS (Multi-user access)
-- ============================================

CREATE TABLE practice_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- owner, admin, staff, viewer
  permissions JSONB, -- {"can_view_calls": true, "can_edit_settings": false}
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, removed
  
  UNIQUE(practice_id, user_id)
);

CREATE INDEX idx_practice_members_practice ON practice_members(practice_id);
CREATE INDEX idx_practice_members_user ON practice_members(user_id);

-- ============================================
-- PHONE NUMBERS
-- ============================================

CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  phone_number_sid VARCHAR(100), -- Twilio/Vapi SID
  friendly_name VARCHAR(100),
  country_code VARCHAR(5) DEFAULT 'US',
  
  -- Configuration
  is_primary BOOLEAN DEFAULT FALSE,
  forward_to VARCHAR(20), -- Forward to this number if transfer needed
  voicemail_enabled BOOLEAN DEFAULT TRUE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, porting, inactive
  provisioned_at TIMESTAMP DEFAULT NOW(),
  ported_from VARCHAR(20), -- If ported from another number
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_phone_numbers_practice ON phone_numbers(practice_id);
CREATE INDEX idx_phone_numbers_number ON phone_numbers(phone_number);

-- ============================================
-- OFFICE HOURS & AVAILABILITY
-- ============================================

CREATE TABLE office_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  is_open BOOLEAN DEFAULT TRUE,
  
  -- Time slots (can have multiple per day)
  open_time TIME,
  close_time TIME,
  
  -- Break times
  breaks JSONB, -- [{"start": "12:00", "end": "13:00", "label": "Lunch"}]
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(practice_id, day_of_week)
);

CREATE INDEX idx_office_hours_practice ON office_hours(practice_id);

-- ============================================
-- CLOSURES & HOLIDAYS
-- ============================================

CREATE TABLE closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  closure_date DATE NOT NULL,
  reason VARCHAR(255), -- "Christmas", "Staff Training"
  is_recurring BOOLEAN DEFAULT FALSE, -- For holidays like Christmas
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_closures_practice_date ON closures(practice_id, closure_date);

-- ============================================
-- APPOINTMENT TYPES
-- ============================================

CREATE TABLE appointment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  
  -- Booking settings
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 10,
  booking_window_days INTEGER DEFAULT 90, -- How far in advance
  min_notice_hours INTEGER DEFAULT 2, -- Minimum notice required
  
  -- Pricing (optional, for revenue tracking)
  estimated_revenue DECIMAL(10,2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_appointment_types_practice ON appointment_types(practice_id);

-- ============================================
-- PATIENTS
-- ============================================

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE,
  
  -- Insurance
  insurance_provider VARCHAR(100),
  insurance_id VARCHAR(100),
  
  -- Patient Type
  patient_type VARCHAR(20) DEFAULT 'new', -- new, existing, inactive
  
  -- Contact Preferences
  preferred_contact_method VARCHAR(20) DEFAULT 'sms', -- sms, email, phone
  sms_opt_in BOOLEAN DEFAULT TRUE,
  email_opt_in BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  source VARCHAR(50), -- ai_call, manual_entry, import
  notes TEXT,
  tags JSONB, -- ["high-value", "needs-followup"]
  
  -- Tracking
  first_visit_date DATE,
  last_visit_date DATE,
  total_visits INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patients_practice ON patients(practice_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);

-- ============================================
-- CALLS (Main table for all phone interactions)
-- ============================================

CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES phone_numbers(id),
  patient_id UUID REFERENCES patients(id), -- Linked after identification
  
  -- Call Details
  call_sid VARCHAR(100) UNIQUE, -- Vapi/Twilio call ID
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  direction VARCHAR(20) NOT NULL, -- inbound, outbound
  
  -- Call Status
  status VARCHAR(30) NOT NULL, -- ringing, in-progress, completed, failed, busy, no-answer
  outcome VARCHAR(30), -- booked, transferred, voicemail, hang_up, information_only
  
  -- Timing
  started_at TIMESTAMP NOT NULL,
  answered_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER, -- Total call duration
  talk_time_seconds INTEGER, -- Actual conversation time
  
  -- AI Performance
  ai_handled BOOLEAN DEFAULT TRUE,
  transferred_to_human BOOLEAN DEFAULT FALSE,
  transfer_reason VARCHAR(100), -- "billing_question", "emergency", "complex_request"
  
  -- Recording & Transcript
  recording_url TEXT,
  recording_duration INTEGER,
  transcript TEXT,
  transcript_url TEXT,
  summary TEXT, -- AI-generated summary
  
  -- Quality Metrics
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  quality_score DECIMAL(3,2), -- 0 to 5.0
  patient_satisfaction INTEGER, -- 1-5 rating if collected
  
  -- Metadata
  cost DECIMAL(10,4), -- Cost of call (Vapi charges)
  metadata JSONB, -- Additional data from Vapi
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calls_practice ON calls(practice_id);
CREATE INDEX idx_calls_patient ON calls(patient_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_outcome ON calls(outcome);
CREATE INDEX idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX idx_calls_call_sid ON calls(call_sid);

-- ============================================
-- APPOINTMENTS
-- ============================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  appointment_type_id UUID REFERENCES appointment_types(id),
  call_id UUID REFERENCES calls(id), -- The call that booked it
  
  -- Appointment Details
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Status
  status VARCHAR(30) DEFAULT 'scheduled', -- scheduled, confirmed, checked_in, completed, cancelled, no_show
  confirmation_status VARCHAR(30) DEFAULT 'pending', -- pending, confirmed, declined
  
  -- Cancellation/Rescheduling
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES appointments(id),
  
  -- External Calendar
  calendar_event_id VARCHAR(255), -- Cal.com or other calendar ID
  calendar_provider VARCHAR(50), -- calcom, google, dentrix
  
  -- Notes
  reason_for_visit TEXT,
  internal_notes TEXT,
  
  -- Reminders
  reminder_sent_48h BOOLEAN DEFAULT FALSE,
  reminder_sent_24h BOOLEAN DEFAULT FALSE,
  reminder_sent_2h BOOLEAN DEFAULT FALSE,
  
  -- Revenue (optional)
  estimated_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_appointment_time CHECK (end_time > start_time)
);

CREATE INDEX idx_appointments_practice ON appointments(practice_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, start_time);

-- ============================================
-- LEADS (Calls that didn't result in bookings)
-- ============================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id),
  patient_id UUID REFERENCES patients(id),
  
  -- Lead Info
  lead_source VARCHAR(50) DEFAULT 'phone_call',
  lead_type VARCHAR(50), -- new_patient, existing_patient, information_only
  interest_level VARCHAR(20), -- hot, warm, cold
  
  -- Status
  status VARCHAR(30) DEFAULT 'new', -- new, contacted, qualified, converted, lost
  assigned_to UUID REFERENCES users(id),
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT TRUE,
  follow_up_date DATE,
  last_contact_date DATE,
  contact_attempts INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  lost_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  converted_at TIMESTAMP
);

CREATE INDEX idx_leads_practice ON leads(practice_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_follow_up ON leads(follow_up_date);

-- ============================================
-- NOTIFICATIONS & MESSAGES
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Notification Details
  type VARCHAR(50) NOT NULL, -- appointment_booked, call_missed, reminder_sent
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Delivery
  channels JSONB, -- ["sms", "email", "in_app"]
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  
  -- Related Records
  related_type VARCHAR(50), -- call, appointment, patient
  related_id UUID,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_practice ON notifications(practice_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);

-- ============================================
-- SMS & EMAIL LOGS
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  
  -- Message Details
  message_type VARCHAR(20) NOT NULL, -- sms, email
  direction VARCHAR(20) NOT NULL, -- outbound, inbound
  
  -- Content
  to_address VARCHAR(255) NOT NULL, -- Phone or email
  from_address VARCHAR(255) NOT NULL,
  subject VARCHAR(255), -- For emails
  body TEXT NOT NULL,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending', -- pending, sent, delivered, failed, bounced
  provider VARCHAR(50), -- twilio, resend
  provider_message_id VARCHAR(255),
  
  -- Error handling
  error_code VARCHAR(50),
  error_message TEXT,
  
  -- Related records
  related_type VARCHAR(50), -- appointment, campaign, manual
  related_id UUID,
  
  -- Metadata
  cost DECIMAL(10,4),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_practice ON messages(practice_id);
CREATE INDEX idx_messages_patient ON messages(patient_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================
-- CAMPAIGNS (Phase 3)
-- ============================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Campaign Details
  name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(50) NOT NULL, -- reactivation, recall, followup, marketing
  description TEXT,
  
  -- Targeting
  target_criteria JSONB, -- {"last_visit": ">6months", "patient_type": "existing"}
  target_patient_count INTEGER,
  
  -- Messaging
  message_template TEXT,
  call_script TEXT,
  
  -- Scheduling
  status VARCHAR(30) DEFAULT 'draft', -- draft, scheduled, running, paused, completed
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  
  -- Performance
  patients_contacted INTEGER DEFAULT 0,
  successful_contacts INTEGER DEFAULT 0,
  appointments_booked INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_campaigns_practice ON campaigns(practice_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- ============================================
-- CAMPAIGN OUTREACH (Individual campaign contacts)
-- ============================================

CREATE TABLE campaign_outreach (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  call_id UUID REFERENCES calls(id),
  
  -- Outreach Status
  status VARCHAR(30) DEFAULT 'pending', -- pending, attempted, contacted, booked, declined
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  
  -- Outcome
  outcome VARCHAR(50), -- booked, not_interested, no_answer, wrong_number
  appointment_id UUID REFERENCES appointments(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaign_outreach_campaign ON campaign_outreach(campaign_id);
CREATE INDEX idx_campaign_outreach_patient ON campaign_outreach(patient_id);

-- ============================================
-- CALENDAR INTEGRATIONS
-- ============================================

CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Provider Details
  provider VARCHAR(50) NOT NULL, -- calcom, google, dentrix, eaglesoft
  provider_account_id VARCHAR(255),
  
  -- Credentials (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  
  -- Configuration
  calendar_id VARCHAR(255), -- Specific calendar within the provider
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_direction VARCHAR(20) DEFAULT 'bidirectional', -- inbound, outbound, bidirectional
  
  -- Status
  status VARCHAR(30) DEFAULT 'active', -- active, expired, error, disconnected
  last_sync_at TIMESTAMP,
  last_sync_status VARCHAR(30),
  last_error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_connections_practice ON calendar_connections(practice_id);

-- ============================================
-- SUBSCRIPTION & BILLING
-- ============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Stripe Integration
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  
  -- Plan Details
  plan VARCHAR(50) NOT NULL, -- starter, professional, enterprise
  status VARCHAR(30) NOT NULL, -- trialing, active, past_due, cancelled, unpaid
  
  -- Billing
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, annually
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  trial_end TIMESTAMP,
  
  -- Usage
  calls_included INTEGER,
  calls_used_current_period INTEGER DEFAULT 0,
  overage_rate DECIMAL(10,4), -- Cost per call over limit
  
  -- Pricing
  plan_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_practice ON subscriptions(practice_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- ============================================
-- INVOICES
-- ============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  
  -- Stripe
  stripe_invoice_id VARCHAR(255) UNIQUE,
  
  -- Invoice Details
  invoice_number VARCHAR(50) UNIQUE,
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status VARCHAR(30) NOT NULL, -- draft, open, paid, void, uncollectible
  
  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE,
  paid_at TIMESTAMP,
  
  -- PDF
  invoice_pdf_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_practice ON invoices(practice_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ============================================
-- ANALYTICS EVENTS (For tracking)
-- ============================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Event Details
  event_name VARCHAR(100) NOT NULL, -- page_viewed, feature_used, call_received
  event_category VARCHAR(50), -- engagement, conversion, retention
  
  -- Properties
  properties JSONB, -- Flexible event data
  
  -- Session
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_practice ON analytics_events(practice_id);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);

-- ============================================
-- AUDIT LOGS (HIPAA Compliance)
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Action Details
  action VARCHAR(100) NOT NULL, -- viewed_patient, updated_appointment, deleted_call
  resource_type VARCHAR(50) NOT NULL, -- patient, call, appointment
  resource_id UUID,
  
  -- Changes (for updates)
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_practice ON audit_logs(practice_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- SYSTEM SETTINGS & CONFIGURATION
-- ============================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Settings stored as JSONB for flexibility
  settings_key VARCHAR(100) NOT NULL,
  settings_value JSONB NOT NULL,
  
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  UNIQUE(practice_id, settings_key)
);

CREATE INDEX idx_system_settings_practice ON system_settings(practice_id);
🔄 BACKEND WORKFLOWS & PROCESSES
1. USER REGISTRATION & ONBOARDING FLOW
// API: POST /api/auth/signup

interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  practiceName: string;
  phone: string;
}

async function handleSignup(req: SignupRequest) {
  // Step 1: Validate input
  validateEmail(req.email);
  validatePasswordStrength(req.password);
  
  // Step 2: Check if user exists
  const existingUser = await db.users.findByEmail(req.email);
  if (existingUser) throw new Error('Email already registered');
  
  // Step 3: Hash password
  const passwordHash = await bcrypt.hash(req.password, 12);
  
  // Step 4: Create user & practice in transaction
  const result = await db.transaction(async (trx) => {
    // Create user
    const user = await trx.users.create({
      email: req.email,
      password_hash: passwordHash,
      full_name: req.fullName,
      phone: req.phone,
      status: 'active',
      role: 'owner'
    });
    
    // Create practice
    const practice = await trx.practices.create({
      owner_id: user.id,
      name: req.practiceName,
      slug: generateSlug(req.practiceName),
      subscription_status: 'trial',
      trial_ends_at: addDays(new Date(), 14),
      onboarding_completed: false,
      onboarding_step: 0
    });
    
    // Create practice member relationship
    await trx.practice_members.create({
      practice_id: practice.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
      joined_at: new Date()
    });
    
    // Create default office hours (Mon-Fri 9-5)
    const defaultHours = generateDefaultOfficeHours();
    await trx.office_hours.createMany(
      defaultHours.map(h => ({ ...h, practice_id: practice.id }))
    );
    
    // Create default appointment types
    const defaultAppointments = [
      { name: 'New Patient Exam', duration_minutes: 60, estimated_revenue: 250 },
      { name: 'Cleaning & Exam', duration_minutes: 60, estimated_revenue: 180 },
      { name: 'Emergency Visit', duration_minutes: 30, estimated_revenue: 150 },
      { name: 'Consultation', duration_minutes: 30, estimated_revenue: 100 }
    ];
    await trx.appointment_types.createMany(
      defaultAppointments.map(apt => ({ ...apt, practice_id: practice.id }))
    );
    
    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: req.fullName,
      metadata: {
        practice_id: practice.id,
        user_id: user.id
      }
    });
    
    // Create subscription record (trial)
    await trx.subscriptions.create({
      practice_id: practice.id,
      stripe_customer_id: stripeCustomer.id,
      plan: 'professional',
      status: 'trialing',
      trial_end: addDays(new)

Date(), 14),
      calls_included: 500,
      plan_amount: 497.00,
      current_period_start: new Date(),
      current_period_end: addDays(new Date(), 14)
    });
    
    return { user, practice };
  });
  
  // Step 5: Send verification email
  await emailService.sendVerificationEmail({
    to: req.email,
    verificationToken: generateEmailToken(result.user.id)
  });
  
  // Step 6: Track analytics
  await analytics.track({
    event: 'user_signed_up',
    userId: result.user.id,
    properties: {
      practice_id: result.practice.id,
      plan: 'professional',
      trial: true
    }
  });
  
  // Step 7: Generate session token
  const sessionToken = await generateJWT({
    userId: result.user.id,
    practiceId: result.practice.id,
    role: 'owner'
  });
  
  return {
    user: sanitizeUser(result.user),
    practice: result.practice,
    token: sessionToken
  };
}
```

---

### **2. ONBOARDING COMPLETION FLOW**

```typescript
// API: POST /api/onboarding/complete

interface OnboardingData {
  step: number;
  data: any;
}

async function handleOnboardingStep(practiceId: string, step: number, data: any) {
  switch (step) {
    case 2: // Practice Information
      await updatePracticeInfo(practiceId, {
        address_line1: data.address.line1,
        city: data.address.city,
        state: data.address.state,
        zip_code: data.address.zip,
        website: data.website,
        practice_types: data.practiceTypes,
        insurance_accepted: data.insuranceAccepted
      });
      break;
      
    case 3: // Office Hours
      await updateOfficeHours(practiceId, data.hours);
      break;
      
    case 4: // Calendar Connection
      await connectCalendar(practiceId, data.provider, data.credentials);
      break;
      
    case 5: // Appointment Types (already created, just update if needed)
      await updateAppointmentTypes(practiceId, data.appointmentTypes);
      break;
      
    case 6: // Phone Number Selection
      const phoneNumber = await provisionPhoneNumber(practiceId, data.phoneNumber);
      await setupVapiAgent(practiceId, phoneNumber);
      break;
      
    case 7: // AI Voice Customization
      await updateAIConfiguration(practiceId, {
        ai_voice_id: data.voiceId,
        ai_greeting_message: data.greetingMessage,
        ai_personality: data.personality,
        transfer_settings: data.transferSettings
      });
      break;
  }
  
  // Update onboarding progress
  await db.practices.update(practiceId, {
    onboarding_step: step,
    onboarding_completed: step === 7,
    updated_at: new Date()
  });
  
  // If completed, trigger post-onboarding actions
  if (step === 7) {
    await completeOnboarding(practiceId);
  }
}

async function completeOnboarding(practiceId: string) {
  // Send welcome email
  const practice = await db.practices.findById(practiceId);
  const owner = await db.users.findById(practice.owner_id);
  
  await emailService.sendWelcomeEmail({
    to: owner.email,
    practiceName: practice.name,
    phoneNumber: practice.phone_numbers[0].phone_number,
    dashboardUrl: `https://app.dentalanswer.ai/dashboard`
  });
  
  // Create sample test call data (optional)
  // Track completion
  await analytics.track({
    event: 'onboarding_completed',
    userId: owner.id,
    properties: {
      practice_id: practiceId,
      time_to_complete: calculateOnboardingTime(practiceId)
    }
  });
}
```

---

### **3. PHONE NUMBER PROVISIONING**

```typescript
// API: POST /api/phone-numbers/provision

async function provisionPhoneNumber(practiceId: string, areaCode?: string) {
  const practice = await db.practices.findById(practiceId);
  
  // Step 1: Search available numbers from Vapi
  const availableNumbers = await vapi.phoneNumbers.search({
    areaCode: areaCode || extractAreaCode(practice.phone),
    country: 'US'
  });
  
  if (availableNumbers.length === 0) {
    throw new Error('No available numbers in this area code');
  }
  
  // Step 2: Purchase first available number
  const selectedNumber = availableNumbers[0];
  const purchasedNumber = await vapi.phoneNumbers.buy({
    phoneNumber: selectedNumber.phoneNumber
  });
  
  // Step 3: Store in database
  const phoneNumber = await db.phone_numbers.create({
    practice_id: practiceId,
    phone_number: purchasedNumber.phoneNumber,
    phone_number_sid: purchasedNumber.sid,
    friendly_name: `${practice.name} - Main Line`,
    country_code: 'US',
    is_primary: true,
    voicemail_enabled: true,
    status: 'active',
    provisioned_at: new Date()
  });
  
  // Step 4: Configure Vapi assistant for this number
  await setupVapiAgent(practiceId, phoneNumber);
  
  return phoneNumber;
}

async function setupVapiAgent(practiceId: string, phoneNumber: PhoneNumber) {
  const practice = await db.practices.findById(practiceId);
  const appointmentTypes = await db.appointment_types.findByPractice(practiceId);
  const officeHours = await db.office_hours.findByPractice(practiceId);
  
  // Create Vapi assistant with custom configuration
  const assistant = await vapi.assistants.create({
    name: `${practice.name} - AI Receptionist`,
    model: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      systemPrompt: generateSystemPrompt(practice, appointmentTypes)
    },
    voice: {
      provider: 'elevenlabs',
      voiceId: practice.ai_voice_id || 'emma',
      stability: 0.5,
      similarityBoost: 0.75
    },
    firstMessage: practice.ai_greeting_message || 
      `Thank you for calling ${practice.name}, this is Emma, how can I help you today?`,
    // Function calling for appointment booking
    functions: [
      {
        name: 'check_availability',
        description: 'Check available appointment slots',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Preferred date (YYYY-MM-DD)' },
            appointmentType: { type: 'string', description: 'Type of appointment' },
            timePreference: { type: 'string', enum: ['morning', 'afternoon', 'evening'] }
          }
        },
        url: `${process.env.API_URL}/api/webhooks/vapi/check-availability`,
        method: 'POST'
      },
      {
        name: 'book_appointment',
        description: 'Book an appointment slot',
        parameters: {
          type: 'object',
          properties: {
            patientName: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            appointmentType: { type: 'string' },
            dateTime: { type: 'string' },
            insurance: { type: 'string' },
            reasonForVisit: { type: 'string' }
          },
          required: ['patientName', 'phone', 'appointmentType', 'dateTime']
        },
        url: `${process.env.API_URL}/api/webhooks/vapi/book-appointment`,
        method: 'POST'
      },
      {
        name: 'transfer_to_human',
        description: 'Transfer call to human staff',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string' }
          }
        },
        url: `${process.env.API_URL}/api/webhooks/vapi/transfer-call`,
        method: 'POST'
      }
    ],
    // End call conditions
    endCallPhrases: ['goodbye', 'bye', 'thank you bye'],
    // Transfer conditions
    forwardingPhoneNumber: practice.phone, // Forward to office if needed
    // Webhooks
    serverUrl: `${process.env.API_URL}/api/webhooks/vapi`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET
  });
  
  // Associate assistant with phone number
  await vapi.phoneNumbers.update(phoneNumber.phone_number_sid, {
    assistantId: assistant.id
  });
  
  // Store assistant ID
  await db.phone_numbers.update(phoneNumber.id, {
    metadata: { vapi_assistant_id: assistant.id }
  });
  
  return assistant;
}

function generateSystemPrompt(practice: Practice, appointmentTypes: AppointmentType[]): string {
  return `
You are Emma, the friendly AI receptionist for ${practice.name}, a dental practice located in ${practice.city}, ${practice.state}.

Your role is to:
1. Answer incoming calls professionally and warmly
2. Help patients book appointments
3. Answer common questions about the practice
4. Transfer complex issues to human staff

PRACTICE INFORMATION:
- Name: ${practice.name}
- Location: ${practice.address_line1}, ${practice.city}, ${practice.state}
- Insurance Accepted: ${practice.insurance_accepted.join(', ')}
- Services: ${practice.practice_types.join(', ')}

AVAILABLE APPOINTMENT TYPES:
${appointmentTypes.map(apt => `- ${apt.name} (${apt.duration_minutes} min): ${apt.description}`).join('\n')}

IMPORTANT GUIDELINES:
- Always be warm, professional, and empathetic
- Collect patient information: full name, phone, email, insurance, reason for visit
- Use the check_availability function before suggesting times
- Use the book_appointment function to confirm bookings
- For emergencies (severe pain, trauma, bleeding), prioritize and offer immediate slots
- For billing questions, prescription refills, or complex medical questions, use transfer_to_human
- Always confirm appointment details before ending the call
- Send confirmation via SMS automatically after booking

CONVERSATION FLOW:
1. Greet the patient warmly
2. Ask how you can help
3. Determine if new or existing patient
4. Collect necessary information
5. Check availability and offer options
6. Book the appointment
7. Confirm all details
8. Thank them and end call professionally

Remember: You represent ${practice.name} - be helpful, efficient, and caring!
`;
}
```

---

### **4. INCOMING CALL HANDLING (Vapi Webhooks)**

```typescript
// API: POST /api/webhooks/vapi

interface VapiWebhookEvent {
  type: 'call.started' | 'call.ended' | 'function.called' | 'transcript.updated';
  call: {
    id: string;
    phoneNumber: string;
    customer: {
      number: string;
    };
    status: string;
    startedAt: string;
    endedAt?: string;
  };
  transcript?: string;
  functionCall?: {
    name: string;
    parameters: any;
  };
}

async function handleVapiWebhook(event: VapiWebhookEvent) {
  // Verify webhook signature
  verifyVapiSignature(event);
  
  switch (event.type) {
    case 'call.started':
      await handleCallStarted(event);
      break;
      
    case 'function.called':
      return await handleFunctionCall(event);
      
    case 'transcript.updated':
      await handleTranscriptUpdate(event);
      break;
      
    case 'call.ended':
      await handleCallEnded(event);
      break;
  }
}

// When call starts
async function handleCallStarted(event: VapiWebhookEvent) {
  // Find practice by phone number
  const phoneNumber = await db.phone_numbers.findByNumber(event.call.phoneNumber);
  if (!phoneNumber) {
    console.error('Unknown phone number:', event.call.phoneNumber);
    return;
  }
  
  // Create call record
  const call = await db.calls.create({
    practice_id: phoneNumber.practice_id,
    phone_number_id: phoneNumber.id,
    call_sid: event.call.id,
    from_number: event.call.customer.number,
    to_number: event.call.phoneNumber,
    direction: 'inbound',
    status: 'in-progress',
    started_at: new Date(event.call.startedAt),
    ai_handled: true
  });
  
  // Check if patient exists
  const existingPatient = await db.patients.findByPhone(
    phoneNumber.practice_id,
    event.call.customer.number
  );
  
  if (existingPatient) {
    await db.calls.update(call.id, {
      patient_id: existingPatient.id
    });
  }
  
  // Track analytics
  await analytics.track({
    event: 'call_received',
    properties: {
      practice_id: phoneNumber.practice_id,
      call_id: call.id,
      existing_patient: !!existingPatient
    }
  });
  
  return call;
}

// When AI calls a function
async function handleFunctionCall(event: VapiWebhookEvent) {
  const functionName = event.functionCall.name;
  const params = event.functionCall.parameters;
  
  switch (functionName) {
    case 'check_availability':
      return await checkAvailability(event, params);
      
    case 'book_appointment':
      return await bookAppointment(event, params);
      
    case 'transfer_to_human':
      return await initiateTransfer(event, params);
  }
}

// Check availability function
async function checkAvailability(event: VapiWebhookEvent, params: any) {
  const phoneNumber = await db.phone_numbers.findByNumber(event.call.phoneNumber);
  const practice = await db.practices.findById(phoneNumber.practice_id);
  
  // Get calendar connection
  const calendarConnection = await db.calendar_connections.findByPractice(practice.id);
  
  if (!calendarConnection) {
    return {
      success: false,
      message: "I'm having trouble accessing the calendar right now. Let me transfer you to our staff."
    };
  }
  
  // Query calendar API (Cal.com example)
  const availableSlots = await calendarService.getAvailability({
    calendarId: calendarConnection.calendar_id,
    date: params.date,
    appointmentType: params.appointmentType,
    timePreference: params.timePreference
  });
  
  if (availableSlots.length === 0) {
    return {
      success: true,
      availableSlots: [],
      message: "I don't have any available slots for that time. Would you like to try a different day or time?"
    };
  }
  
  // Format slots for AI to read naturally
  const formattedSlots = availableSlots.slice(0, 3).map(slot => ({
    dateTime: slot.start,
    displayTime: format(new Date(slot.start), 'EEEE, MMMM do at h:mm a')
  }));
  
  return {
    success: true,
    availableSlots: formattedSlots,
    message: `I have several times available. How about ${formattedSlots[0].displayTime}?`
  };
}

// Book appointment function
async function bookAppointment(event: VapiWebhookEvent, params: any) {
  const phoneNumber = await db.phone_numbers.findByNumber(event.call.phoneNumber);
  const practice = await db.practices.findById(phoneNumber.practice_id);
  const call = await db.calls.findByCallSid(event.call.id);
  
  try {
    // Start transaction
    const result = await db.transaction(async (trx) => {
      // 1. Find or create patient
      let patient = await trx.patients.findByPhone(practice.id, params.phone);
      
      if (!patient) {
        const nameParts = params.patientName.split(' ');
        patient = await trx.patients.create({
          practice_id: practice.id,
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(' ') || nameParts[0],
          phone: params.phone,
          email: params.email,
          insurance_provider: params.insurance,
          patient_type: 'new',
          source: 'ai_call',
          first_visit_date: new Date(params.dateTime)
        });
      }
      
      // 2. Update call with patient ID
      await trx.calls.update(call.id, {
        patient_id: patient.id
      });
      
      // 3. Get appointment type
      const appointmentType = await trx.appointment_types.findByName(
        practice.id,
        params.appointmentType
      );
      
      // 4. Create appointment in database
      const appointmentDate = new Date(params.dateTime);
      const appointment = await trx.appointments.create({
        practice_id: practice.id,
        patient_id: patient.id,
        appointment_type_id: appointmentType.id,
        call_id: call.id,
        appointment_date: format(appointmentDate, 'yyyy-MM-dd'),
        start_time: format(appointmentDate, 'HH:mm:ss'),
        end_time: format(addMinutes(appointmentDate, appointmentType.duration_minutes), 'HH:mm:ss'),
        duration_minutes: appointmentType.duration_minutes,
        status: 'scheduled',
        reason_for_visit: params.reasonForVisit,
        estimated_value: appointmentType.estimated_revenue
      });
      
      // 5. Book in external calendar
      const calendarConnection = await trx.calendar_connections.findByPractice(practice.id);
      const calendarEvent = await calendarService.createEvent({
        calendarId: calendarConnection.calendar_id,
        title: `${appointmentType.name} - ${patient.first_name} ${patient.last_name}`,
        description: params.reasonForVisit,
        startTime: appointmentDate,
        duration: appointmentType.duration_minutes,
        attendees: [patient.email],
        metadata: {
          appointment_id: appointment.id,
          patient_id: patient.id,
          practice_id: practice.id
        }
      });
      
      // 6. Store calendar event ID
      await trx.appointments.update(appointment.id, {
        calendar_event_id: calendarEvent.id,
        calendar_provider: 'calcom'
      });
      
      return { patient, appointment };
    });
    
    // 7. Send SMS confirmation (outside transaction)
    await smsService.sendAppointmentConfirmation({
      to: params.phone,
      patientName: params.patientName,
      practiceName: practice.name,
      appointmentDate: params.dateTime,
      appointmentType: params.appointmentType,
      practicePhone: practice.phone,
      practiceAddress: `${practice.address_line1}, ${practice.city}, ${practice.state}`
    });
    
    // 8. Send email confirmation
    if (params.email) {
      await emailService.sendAppointmentConfirmation({
        to: params.email,
        patientName: params.patientName,
        practiceName: practice.name,
        appointmentDate: params.dateTime,
        appointmentType: params.appointmentType,
        calendarInvite: true
      });
    }
    
    // 9. Notify practice staff
    await notifyStaff(practice.id, {
      type: 'appointment_booked',
      title: 'New Appointment Booked',
      message: `${params.patientName} booked a ${params.appointmentType} for ${format(new Date(params.dateTime), 'PPpp')}`,
      related_id: result.appointment.id
    });
    
    // 10. Update call outcome
    await db.calls.update(call.id, {
      outcome: 'booked'
    });
    
    // 11. Track analytics
    await analytics.track({
      event: 'appointment_booked',
      properties: {
        practice_id: practice.id,
        patient_id: result.patient.id,
        appointment_id: result.appointment.id,
        appointment_type: params.appointmentType,
        new_patient: result.patient.patient_type === 'new',
        booking_source: 'ai_call'
      }
    });
    
    return {
      success: true,
      appointmentId: result.appointment.id,
      message: `Perfect! I've booked your ${params.appointmentType} for ${format(new Date(params.dateTime), 'EEEE, MMMM do at h:mm a')}. You'll receive a confirmation text shortly. Is there anything else I can help you with?`
    };
    
  } catch (error) {
    console.error('Booking error:', error);
    
    // Log error
    await logError({
      type: 'booking_failed',
      practice_id: practice.id,
      call_id: call.id,
      error: error.message,
      params
    });
    
    return {
      success: false,
      message: "I'm having trouble completing that booking. Let me transfer you to our staff who can help you right away."
    };
  }
}

// Transfer to human
async function initiateTransfer(event: VapiWebhookEvent, params: any) {
  const phoneNumber = await db.phone_numbers.findByNumber(event.call.phoneNumber);
  const practice = await db.practices.findById(phoneNumber.practice_id);
  const call = await db.calls.findByCallSid(event.call.id);
  
  // Update call record
  await db.calls.update(call.id, {
    transferred_to_human: true,
    transfer_reason: params.reason,
    outcome: 'transferred'
  });
  
  // Check if within office hours
  const isWithinHours = await checkOfficeHours(practice.id);
  
  if (!isWithinHours) {
    return {
      success: false,
      message: "Our office is currently closed. I'd be happy to take a message or book an appointment for you. What would you prefer?"
    };
  }
  
  // Initiate transfer via Vapi
  return {
    success: true,
    transferTo: phoneNumber.forward_to || practice.phone,
    message: "Let me connect you with our staff. Please hold for just a moment."
  };
}

// When call ends
async function handleCallEnded(event: VapiWebhookEvent) {
  const call = await db.calls.findByCallSid(event.call.id);
  
  if (!call) {
    console.error('Call not found:', event.call.id);
    return;
  }
  
  // Calculate durations
  const startedAt = new Date(event.call.startedAt);
  const endedAt = new Date(event.call.endedAt);
  const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
  
  // Update call record
  await db.calls.update(call.id, {
    status: 'completed',
    ended_at: endedAt,
    duration_seconds: durationSeconds,
    talk_time_seconds: event.call.talkTime || durationSeconds
  });
  
  // Get recording and transcript from Vapi
  const callDetails = await vapi.calls.get(event.call.id);
  
  if (callDetails.recordingUrl) {
    // Download and store recording in S3
    const recordingKey = await s3Service.uploadRecording({
      url: callDetails.recordingUrl,
      callId: call.id,
      practiceId: call.practice_id
    });
    
    await db.calls.update(call.id, {
      recording_url: recordingKey,
      recording_duration: callDetails.recordingDuration
    });
  }
  
  if (callDetails.transcript) {
    // Store transcript
    await db.calls.update(call.id, {
      transcript: callDetails.transcript
    });
    
    // Generate AI summary
    const summary = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Summarize this dental office phone call in 2-3 sentences. Include: reason for call, outcome, and any important details.'
        },
        {
          role: 'user',
          content: callDetails.transcript
        }
      ]
    });
    
    await db.calls.update(call.id, {
      summary: summary.choices[0].message.content
    });
    
    // Analyze sentiment
    const sentiment = await analyzeSentiment(callDetails.transcript);
    await db.calls.update(call.id, {
      sentiment_score: sentiment.score
    });
  }
  
  // If no appointment was booked, create a lead
  if (call.outcome !== 'booked' && call.outcome !== 'information_only') {
    await createLead(call);
  }
  
  // Update subscription usage
  await updateCallUsage(call.practice_id);
  
  // Track analytics
  await analytics.track({
    event: 'call_completed',
    properties: {
      practice_id: call.practice_id,
      call_id: call.id,
      duration: durationSeconds,
      outcome: call.outcome,
      ai_handled: call.ai_handled,
      transferred: call.transferred_to_human
    }
  });
}

async function createLead(call: Call) {
  const patient = call.patient_id ? 
    await db.patients.findById(call.patient_id) : null;
  
  await db.leads.create({
    practice_id: call.practice_id,
    call_id: call.id,
    patient_id: call.patient_id,
    lead_source: 'phone_call',
    lead_type: patient ? 'existing_patient' : 'new_patient',
    status: 'new',
    follow_up_required: true,
    follow_up_date: addDays(new Date(), 1),
    notes: call.summary || 'Follow up required'
  });
}
5. APPOINTMENT REMINDERS (Cron Job)
// Cron: Every hour
// File: /api/cron/send-reminders

async function sendAppointmentReminders() {
  const now = new Date();
  
  // Find appointments that need reminders
  const appointmentsNeedingReminders = await db.appointments.find({
    status: 'scheduled',
    appointment_date: {
      gte: now,
      lte: addDays(now, 2) // Next 48 hours
    },
    OR: [
      // 48-hour reminder not sent
      {
        reminder_sent_48h: false,
        appointment_date: {
          gte: addHours(now, 47),
          lte: addHours(now, 49)
        }
      },
      // 24-hour reminder not sent
      {
        reminder_sent_24h: false,
        appointment_date: {
          gte: addHours(now, 23),
          lte: addHours(now, 25)
        }
      }
    ]
  });
  
  for (const appointment of appointmentsNeedingReminders) {
    await sendReminder(appointment);
  }
}

async function sendReminder(appointment: Appointment) {
  const patient = await db.patients.findById(appointment.patient_id);
  const practice = await db.practices.findById(appointment.practice_id);
  const appointmentType = await db.appointment_types.findById(appointment.appointment_type_id);
  
  const appointmentDateTime = combineDateAndTime(
    appointment.appointment_date,
    appointment.start_time
  );
  
  const hoursUntil = differenceInHours(appointmentDateTime, new Date());
  
  // Determine which reminder to send
  let reminderType: '48h' | '24h';
  if (hoursUntil >= 47 && hoursUntil <= 49 && !appointment.reminder_sent_48h) {
    reminderType = '48h';
  } else if (hoursUntil >= 23 && hoursUntil <= 25 && !appointment.reminder_sent_24h) {
    reminderType = '24h';
  } else {
    return; // No reminder needed
  }
  
  // Send SMS reminder
  const message = await smsService.send({
    to: patient.phone,
    body: `Hi ${patient.first_name}, this is a reminder of your ${appointmentType.name} at ${practice.name} on ${format(appointmentDateTime, 'EEEE, MMM do at h:mm a')}. Reply CONFIRM to confirm or CANCEL to reschedule. ${practice.phone}`
  });
  
  // Update appointment
  const updateData = reminderType === '48h' ? 
    { reminder_sent_48h: true } : 
    { reminder_sent_24h: true };
  
  await db.appointments.update(appointment.id, updateData);
  
  // Log message
  await db.messages.create({
    practice_id: practice.id,
    patient_id: patient.id,
    message_type: 'sms',
    direction: 'outbound',
    to_address: patient.phone,
    from_address: practice.phone,
    body: message.body,
    status: 'sent',
    provider: 'twilio',
    provider_message_id: message.sid,
    related_type: 'appointment',
    related_id: appointment.id,
    sent_at: new Date()
  });
  
  // Track analytics
  await analytics.track({
    event: 'reminder_sent',
    properties: {
      practice_id: practice.id,
      appointment_id: appointment.id,
      reminder_type: reminderType
    }
  });
}

// Handle SMS replies
// API: POST /api/webhooks/twilio/sms

async function handleSMSReply(req: Request) {
  const { From, Body, To } = req.body;
  
  const normalizedBody = Body.trim().toUpperCase();
  
  // Find patient by phone
  const patient = await db.patients.findByPhone(From);
  if (!patient) return;
  
  // Find recent appointment
  const recentAppointment = await db.appointments.findOne({
    patient_id: patient.id,
    appointment_date: { gte: new Date() },
    status: 'scheduled',
    orderBy: { appointment_date: 'asc' }
  });
  
  if (!recentAppointment) return;
  
  // Handle confirmation
  if (normalizedBody.includes('CONFIRM') || normalizedBody.includes('YES')) {
    await db.appointments.update(recentAppointment.id, {
      confirmation_status: 'confirmed'
    });
    
    await smsService.send({
      to: From,
      body: `Great! Your appointment is confirmed we'll see you then! ☺️’})

see you then! 😊`
    });
  }
  
  // Handle cancellation
  else if (normalizedBody.includes('CANCEL') || normalizedBody.includes('RESCHEDULE')) {
    await db.appointments.update(recentAppointment.id, {
      status: 'cancelled',
      cancellation_reason: 'Patient requested via SMS',
      cancelled_at: new Date()
    });
    
    // Delete from external calendar
    const calendarConnection = await db.calendar_connections.findByPractice(patient.practice_id);
    if (recentAppointment.calendar_event_id) {
      await calendarService.deleteEvent({
        calendarId: calendarConnection.calendar_id,
        eventId: recentAppointment.calendar_event_id
      });
    }
    
    // Create lead for follow-up
    await db.leads.create({
      practice_id: patient.practice_id,
      patient_id: patient.id,
      lead_source: 'sms_cancellation',
      lead_type: 'existing_patient',
      status: 'new',
      follow_up_required: true,
      follow_up_date: addDays(new Date(), 1),
      notes: 'Cancelled via SMS - needs rescheduling'
    });
    
    await smsService.send({
      to: From,
      body: `Your appointment has been cancelled. We'll call you soon to reschedule. Or call us at ${recentAppointment.practice.phone}.`
    });
    
    // Notify staff
    await notifyStaff(patient.practice_id, {
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled via SMS',
      message: `${patient.first_name} ${patient.last_name} cancelled their appointment`,
      related_id: recentAppointment.id
    });
  }
  
  // Log the message
  await db.messages.create({
    practice_id: patient.practice_id,
    patient_id: patient.id,
    message_type: 'sms',
    direction: 'inbound',
    from_address: From,
    to_address: To,
    body: Body,
    status: 'received',
    provider: 'twilio',
    related_type: 'appointment',
    related_id: recentAppointment.id
  });
}
```

---

### **6. CALENDAR SYNC (Bidirectional)**

```typescript
// Cron: Every 15 minutes
// File: /api/cron/sync-calendars

async function syncAllCalendars() {
  // Get all active calendar connections
  const connections = await db.calendar_connections.find({
    sync_enabled: true,
    status: 'active'
  });
  
  for (const connection of connections) {
    try {
      await syncCalendar(connection);
      
      // Update last sync
      await db.calendar_connections.update(connection.id, {
        last_sync_at: new Date(),
        last_sync_status: 'success'
      });
    } catch (error) {
      console.error(`Calendar sync failed for practice ${connection.practice_id}:`, error);
      
      await db.calendar_connections.update(connection.id, {
        last_sync_at: new Date(),
        last_sync_status: 'error',
        last_error: error.message
      });
    }
  }
}

async function syncCalendar(connection: CalendarConnection) {
  const lastSync = connection.last_sync_at || new Date(0);
  
  // INBOUND SYNC: Pull changes from external calendar
  if (connection.sync_direction === 'inbound' || connection.sync_direction === 'bidirectional') {
    const externalEvents = await calendarService.getEvents({
      calendarId: connection.calendar_id,
      provider: connection.provider,
      modifiedSince: lastSync,
      credentials: {
        access_token: connection.access_token,
        refresh_token: connection.refresh_token
      }
    });
    
    for (const event of externalEvents) {
      // Check if appointment exists in our system
      const existingAppointment = await db.appointments.findOne({
        calendar_event_id: event.id,
        calendar_provider: connection.provider
      });
      
      if (existingAppointment) {
        // Update existing appointment
        if (event.status === 'cancelled') {
          await db.appointments.update(existingAppointment.id, {
            status: 'cancelled',
            cancelled_at: new Date(),
            cancellation_reason: 'Cancelled in external calendar'
          });
        } else {
          // Update time if changed
          const startTime = parseISO(event.start);
          await db.appointments.update(existingAppointment.id, {
            appointment_date: format(startTime, 'yyyy-MM-dd'),
            start_time: format(startTime, 'HH:mm:ss'),
            end_time: format(parseISO(event.end), 'HH:mm:ss')
          });
        }
      } else {
        // This is a manually created appointment in external calendar
        // Optionally create it in our system (depends on business logic)
        console.log('External appointment not tracked in DentalAnswer:', event.id);
      }
    }
  }
  
  // OUTBOUND SYNC: Push changes to external calendar
  if (connection.sync_direction === 'outbound' || connection.sync_direction === 'bidirectional') {
    const pendingAppointments = await db.appointments.find({
      practice_id: connection.practice_id,
      calendar_event_id: null,
      status: 'scheduled',
      created_at: { gte: lastSync }
    });
    
    for (const appointment of pendingAppointments) {
      const patient = await db.patients.findById(appointment.patient_id);
      const appointmentType = await db.appointment_types.findById(appointment.appointment_type_id);
      const practice = await db.practices.findById(appointment.practice_id);
      
      const startDateTime = combineDateAndTime(
        appointment.appointment_date,
        appointment.start_time
      );
      
      // Create event in external calendar
      const calendarEvent = await calendarService.createEvent({
        calendarId: connection.calendar_id,
        provider: connection.provider,
        credentials: {
          access_token: connection.access_token,
          refresh_token: connection.refresh_token
        },
        event: {
          title: `${appointmentType.name} - ${patient.first_name} ${patient.last_name}`,
          description: appointment.reason_for_visit,
          startTime: startDateTime,
          duration: appointment.duration_minutes,
          attendees: patient.email ? [patient.email] : [],
          location: `${practice.address_line1}, ${practice.city}, ${practice.state}`,
          metadata: {
            appointment_id: appointment.id,
            patient_id: patient.id,
            source: 'dentalanswer_ai'
          }
        }
      });
      
      // Update appointment with calendar event ID
      await db.appointments.update(appointment.id, {
        calendar_event_id: calendarEvent.id,
        calendar_provider: connection.provider
      });
    }
  }
}

// Refresh access tokens when needed
async function refreshCalendarToken(connection: CalendarConnection) {
  if (!connection.refresh_token) {
    throw new Error('No refresh token available');
  }
  
  const newTokens = await calendarService.refreshToken({
    provider: connection.provider,
    refreshToken: connection.refresh_token
  });
  
  await db.calendar_connections.update(connection.id, {
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token || connection.refresh_token,
    token_expires_at: newTokens.expires_at
  });
  
  return newTokens;
}
```

---

### **7. ANALYTICS & REPORTING**

```typescript
// API: GET /api/analytics/dashboard

async function getDashboardAnalytics(practiceId: string, dateRange: DateRange) {
  const { startDate, endDate } = dateRange;
  
  // Run queries in parallel for performance
  const [
    callStats,
    appointmentStats,
    revenueStats,
    conversionFunnel,
    peakTimes,
    topAppointmentTypes
  ] = await Promise.all([
    getCallStats(practiceId, startDate, endDate),
    getAppointmentStats(practiceId, startDate, endDate),
    getRevenueStats(practiceId, startDate, endDate),
    getConversionFunnel(practiceId, startDate, endDate),
    getPeakCallTimes(practiceId, startDate, endDate),
    getTopAppointmentTypes(practiceId, startDate, endDate)
  ]);
  
  return {
    calls: callStats,
    appointments: appointmentStats,
    revenue: revenueStats,
    conversionFunnel,
    peakTimes,
    topAppointmentTypes
  };
}

async function getCallStats(practiceId: string, startDate: Date, endDate: Date) {
  const calls = await db.calls.aggregate({
    where: {
      practice_id: practiceId,
      started_at: { gte: startDate, lte: endDate }
    },
    _count: { id: true },
    _avg: { 
      duration_seconds: true,
      sentiment_score: true,
      quality_score: true
    },
    _sum: { cost: true }
  });
  
  const outcomeBreakdown = await db.calls.groupBy({
    by: ['outcome'],
    where: {
      practice_id: practiceId,
      started_at: { gte: startDate, lte: endDate }
    },
    _count: { id: true }
  });
  
  const previousPeriod = await db.calls.count({
    where: {
      practice_id: practiceId,
      started_at: {
        gte: subDays(startDate, differenceInDays(endDate, startDate)),
        lte: startDate
      }
    }
  });
  
  return {
    total: calls._count.id,
    averageDuration: calls._avg.duration_seconds,
    averageSentiment: calls._avg.sentiment_score,
    averageQuality: calls._avg.quality_score,
    totalCost: calls._sum.cost,
    outcomes: outcomeBreakdown.reduce((acc, item) => {
      acc[item.outcome] = item._count.id;
      return acc;
    }, {}),
    growth: calculateGrowthRate(calls._count.id, previousPeriod)
  };
}

async function getConversionFunnel(practiceId: string, startDate: Date, endDate: Date) {
  const totalCalls = await db.calls.count({
    where: {
      practice_id: practiceId,
      started_at: { gte: startDate, lte: endDate }
    }
  });
  
  const answeredCalls = await db.calls.count({
    where: {
      practice_id: practiceId,
      started_at: { gte: startDate, lte: endDate },
      status: { in: ['completed', 'in-progress'] }
    }
  });
  
  const bookableCalls = await db.calls.count({
    where: {
      practice_id: practiceId,
      started_at: { gte: startDate, lte: endDate },
      outcome: { in: ['booked', 'transferred'] }
    }
  });
  
  const bookedCalls = await db.calls.count({
    where: {
      practice_id: practiceId,
      started_at: { gte: startDate, lte: endDate },
      outcome: 'booked'
    }
  });
  
  const confirmedAppointments = await db.appointments.count({
    where: {
      practice_id: practiceId,
      created_at: { gte: startDate, lte: endDate },
      confirmation_status: 'confirmed'
    }
  });
  
  const completedAppointments = await db.appointments.count({
    where: {
      practice_id: practiceId,
      created_at: { gte: startDate, lte: endDate },
      status: 'completed'
    }
  });
  
  return {
    stages: [
      { name: 'Total Calls', count: totalCalls, percentage: 100 },
      { name: 'Answered', count: answeredCalls, percentage: (answeredCalls / totalCalls) * 100 },
      { name: 'Bookable', count: bookableCalls, percentage: (bookableCalls / totalCalls) * 100 },
      { name: 'Booked', count: bookedCalls, percentage: (bookedCalls / totalCalls) * 100 },
      { name: 'Confirmed', count: confirmedAppointments, percentage: (confirmedAppointments / totalCalls) * 100 },
      { name: 'Showed Up', count: completedAppointments, percentage: (completedAppointments / totalCalls) * 100 }
    ],
    conversionRate: (bookedCalls / totalCalls) * 100,
    showRate: completedAppointments / bookedCalls * 100
  };
}

async function getPeakCallTimes(practiceId: string, startDate: Date, endDate: Date) {
  // Group calls by hour and day of week
  const calls = await db.$queryRaw`
    SELECT 
      EXTRACT(HOUR FROM started_at) as hour,
      EXTRACT(DOW FROM started_at) as day_of_week,
      COUNT(*) as call_count
    FROM calls
    WHERE 
      practice_id = ${practiceId}
      AND started_at >= ${startDate}
      AND started_at <= ${endDate}
    GROUP BY hour, day_of_week
    ORDER BY call_count DESC
  `;
  
  return calls;
}

// Real-time dashboard updates via WebSocket
// File: /api/websocket

import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });

const practiceConnections = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const practiceId = new URL(req.url, 'ws://localhost').searchParams.get('practiceId');
  
  if (!practiceId) {
    ws.close();
    return;
  }
  
  // Add connection to practice's set
  if (!practiceConnections.has(practiceId)) {
    practiceConnections.set(practiceId, new Set());
  }
  practiceConnections.get(practiceId).add(ws);
  
  ws.on('close', () => {
    practiceConnections.get(practiceId)?.delete(ws);
  });
});

// Broadcast to all connected clients for a practice
export function broadcastToPractice(practiceId: string, data: any) {
  const connections = practiceConnections.get(practiceId);
  if (!connections) return;
  
  const message = JSON.stringify(data);
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// Example: Broadcast when new call comes in
async function onCallReceived(call: Call) {
  broadcastToPractice(call.practice_id, {
    type: 'call_received',
    data: {
      id: call.id,
      from: call.from_number,
      status: call.status,
      started_at: call.started_at
    }
  });
}

// Example: Broadcast when appointment is booked
async function onAppointmentBooked(appointment: Appointment) {
  const patient = await db.patients.findById(appointment.patient_id);
  
  broadcastToPractice(appointment.practice_id, {
    type: 'appointment_booked',
    data: {
      id: appointment.id,
      patient_name: `${patient.first_name} ${patient.last_name}`,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time
    }
  });
}
```

---

### **8. SUBSCRIPTION & BILLING MANAGEMENT**

```typescript
// API: POST /api/billing/create-subscription

async function createSubscription(practiceId: string, plan: string, paymentMethodId: string) {
  const practice = await db.practices.findById(practiceId);
  const subscription = await db.subscriptions.findByPractice(practiceId);
  
  if (!subscription.stripe_customer_id) {
    throw new Error('No Stripe customer found');
  }
  
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: subscription.stripe_customer_id
  });
  
  // Set as default payment method
  await stripe.customers.update(subscription.stripe_customer_id, {
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  });
  
  // Get plan details
  const planConfig = getPlanConfig(plan);
  
  // Create Stripe subscription
  const stripeSubscription = await stripe.subscriptions.create({
    customer: subscription.stripe_customer_id,
    items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `DentalAnswer AI - ${planConfig.name}`,
            description: `${planConfig.calls} calls/month, ${planConfig.lines} phone lines`
          },
          unit_amount: Math.round(planConfig.price * 100), // Convert to cents
          recurring: {
            interval: 'month'
          }
        }
      }
    ],
    trial_end: practice.trial_ends_at ? 
      Math.floor(practice.trial_ends_at.getTime() / 1000) : 
      undefined,
    metadata: {
      practice_id: practiceId,
      plan: plan
    },
    expand: ['latest_invoice.payment_intent']
  });
  
  // Update subscription in database
  await db.subscriptions.update(subscription.id, {
    stripe_subscription_id: stripeSubscription.id,
    plan: plan,
    status: stripeSubscription.status,
    current_period_start: new Date(stripeSubscription.current_period_start * 1000),
    current_period_end: new Date(stripeSubscription.current_period_end * 1000),
    calls_included: planConfig.calls,
    plan_amount: planConfig.price
  });
  
  // Update practice
  await db.practices.update(practiceId, {
    subscription_status: 'active',
    subscription_plan: plan
  });
  
  return stripeSubscription;
}

// Stripe Webhooks
// API: POST /api/webhooks/stripe

async function handleStripeWebhook(req: Request) {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  switch (event.type) {
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
      
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
}

async function handleSubscriptionUpdated(stripeSubscription: any) {
  const subscription = await db.subscriptions.findByStripeSubscription(
    stripeSubscription.id
  );
  
  await db.subscriptions.update(subscription.id, {
    status: stripeSubscription.status,
    current_period_start: new Date(stripeSubscription.current_period_start * 1000),
    current_period_end: new Date(stripeSubscription.current_period_end * 1000),
    cancel_at_period_end: stripeSubscription.cancel_at_period_end
  });
  
  await db.practices.update(subscription.practice_id, {
    subscription_status: stripeSubscription.status
  });
}

async function handleInvoicePaid(invoice: any) {
  const subscription = await db.subscriptions.findByStripeCustomer(
    invoice.customer
  );
  
  // Create invoice record
  await db.invoices.create({
    practice_id: subscription.practice_id,
    subscription_id: subscription.id,
    stripe_invoice_id: invoice.id,
    invoice_number: invoice.number,
    amount_due: invoice.amount_due / 100,
    amount_paid: invoice.amount_paid / 100,
    tax: invoice.tax / 100,
    status: 'paid',
    invoice_date: new Date(invoice.created * 1000),
    paid_at: new Date(invoice.status_transitions.paid_at * 1000),
    invoice_pdf_url: invoice.invoice_pdf
  });
  
  // Reset usage counter for new period
  await db.subscriptions.update(subscription.id, {
    calls_used_current_period: 0
  });
  
  // Send receipt email
  const practice = await db.practices.findById(subscription.practice_id);
  const owner = await db.users.findById(practice.owner_id);
  
  await emailService.sendReceipt({
    to: owner.email,
    invoiceUrl: invoice.invoice_pdf,
    amount: invoice.amount_paid / 100,
    invoiceNumber: invoice.number
  });
}

async function handlePaymentFailed(invoice: any) {
  const subscription = await db.subscriptions.findByStripeCustomer(
    invoice.customer
  );
  
  const practice = await db.practices.findById(subscription.practice_id);
  const owner = await db.users.findById(practice.owner_id);
  
  // Update status
  await db.subscriptions.update(subscription.id, {
    status: 'past_due'
  });
  
  await db.practices.update(practice.id, {
    subscription_status: 'past_due'
  });
  
  // Send payment failed email
  await emailService.sendPaymentFailed({
    to: owner.email,
    practiceName: practice.name,
    amount: invoice.amount_due / 100,
    retryDate: new Date(invoice.next_payment_attempt * 1000)
  });
  
  // If 3 failed attempts, pause service
  if (invoice.attempt_count >= 3) {
    await pausePracticeService(practice.id);
  }
}

// Usage tracking
async function updateCallUsage(practiceId: string) {
  const subscription = await db.subscriptions.findByPractice(practiceId);
  
  await db.subscriptions.update(subscription.id, {
    calls_used_current_period: {
      increment: 1
    }
  });
  
  // Check if approaching limit
  const newUsage = subscription.calls_used_current_period + 1;
  if (newUsage >= subscription.calls_included * 0.8) {
    // 80% threshold - send warning
    await sendUsageWarning(practiceId, newUsage, subscription.calls_included);
  }
  
  // Check if over limit
  if (newUsage > subscription.calls_included) {
    // Apply overage charges
    await applyOverageCharge(subscription.id);
  }
}

async function applyOverageCharge(subscriptionId: string) {
  const subscription = await db.subscriptions.findById(SubscriptionId);
// Create usage record in Stripe
  const overage = subscription.calls_used_current_period - subscription.calls_included;
  const overageAmount = overage * subscription.overage_rate;
  
  await stripe.invoiceItems.create({
    customer: subscription.stripe_customer_id,
    amount: Math.round(overageAmount * 100),
    currency: 'usd',
    description: `Overage: ${overage} calls @ $${subscription.overage_rate} each`
  });
}
9. PATIENT REACTIVATION CAMPAIGNS (Phase 3)
// API: POST /api/campaigns/create

async function createReactivationCampaign(practiceId: string, criteria: any) {
  // Find patients matching criteria
  const targetPatients = await db.patients.find({
    practice_id: practiceId,
    last_visit_date: {
      lte: subMonths(new Date(), criteria.monthsSinceLastVisit || 6)
    },
    patient_type: 'existing',
    sms_opt_in: true,
    status: { not: 'inactive' }
  });
  
  // Create campaign
  const campaign = await db.campaigns.create({
    practice_id: practiceId,
    name: criteria.name || 'Reactivation Campaign',
    campaign_type: 'reactivation',
    description: criteria.description,
    target_criteria: criteria,
    target_patient_count: targetPatients.length,
    status: 'scheduled',
    scheduled_start: criteria.startDate || new Date(),
    message_template: criteria.messageTemplate,
    call_script: criteria.callScript
  });
  
  // Create outreach records for each patient
  await db.campaign_outreach.createMany(
    targetPatients.map(patient => ({
      campaign_id: campaign.id,
      patient_id: patient.id,
      status: 'pending'
    }))
  );
  
  return campaign;
}

// Cron: Process campaigns
// File: /api/cron/process-campaigns

async function processCampaigns() {
  const activeCampaigns = await db.campaigns.find({
    status: 'running',
    scheduled_start: { lte: new Date() },
    scheduled_end: { gte: new Date() }
  });
  
  for (const campaign of activeCampaigns) {
    await processCampaign(campaign);
  }
}

async function processCampaign(campaign: Campaign) {
  // Get pending outreach items (batch of 10)
  const pendingOutreach = await db.campaign_outreach.findMany({
    where: {
      campaign_id: campaign.id,
      status: 'pending',
      attempts: { lt: 3 } // Max 3 attempts
    },
    take: 10
  });
  
  for (const outreach of pendingOutreach) {
    try {
      await executeOutreach(campaign, outreach);
    } catch (error) {
      console.error(`Outreach failed for patient ${outreach.patient_id}:`, error);
    }
  }
}

async function executeOutreach(campaign: Campaign, outreach: CampaignOutreach) {
  const patient = await db.patients.findById(outreach.patient_id);
  const practice = await db.practices.findById(campaign.practice_id);
  
  // Make AI call
  const call = await vapi.calls.create({
    assistantId: practice.vapi_assistant_id,
    phoneNumberId: practice.phone_numbers[0].phone_number_sid,
    customer: {
      number: patient.phone,
      name: `${patient.first_name} ${patient.last_name}`
    },
    // Custom system prompt for reactivation
    assistantOverrides: {
      model: {
        systemPrompt: generateReactivationPrompt(practice, patient, campaign)
      }
    }
  });
  
  // Update outreach record
  await db.campaign_outreach.update(outreach.id, {
    status: 'attempted',
    attempts: { increment: 1 },
    last_attempt_at: new Date(),
    call_id: call.id
  });
  
  // Campaign stats will be updated when call completes
}

function generateReactivationPrompt(practice: Practice, patient: Patient, campaign: Campaign): string {
  return `
You are calling ${patient.first_name} ${patient.last_name} on behalf of ${practice.name}.

This is a friendly reactivation call. ${patient.first_name} is a valued patient who hasn't visited in ${differenceInMonths(new Date(), patient.last_visit_date)} months.

Your goal is to:
1. Remind them about the importance of regular dental checkups
2. Offer to schedule their next cleaning or exam
3. Answer any questions they may have
4. Be understanding if they're not interested

SCRIPT GUIDELINE:
${campaign.call_script}

Be warm, friendly, and NOT pushy. If they're not interested, thank them and wish them well.

If they want to book, use the check_availability and book_appointment functions.
`;
}
10. SYSTEM HEALTH & MONITORING
// API: GET /api/health

async function healthCheck() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkVapi(),
    checkTwilio(),
    checkStripe(),
    checkS3()
  ]);
  
  const results = checks.map((result, index) => {
    const services = ['database', 'redis', 'vapi', 'twilio', 'stripe', 's3'];
    return {
      service: services[index],
      status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      error: result.status === 'rejected' ? result.reason.message : null
    };
  });
  
  const allHealthy = results.every(r => r.status === 'healthy');
  
  return {
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date(),
    services: results
  };
}

async function checkDatabase() {
  await db.$queryRaw`SELECT 1`;
}

async function checkRedis() {
  await redis.ping();
}

async function checkVapi() {
  await vapi.accounts.get();
}

// Error tracking with Sentry
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Wrap all API routes with error handling
export function withErrorHandling(handler: Function) {
  return async (req: Request, res: Response) => {
    try {
      return await handler(req, res);
    } catch (error) {
      Sentry.captureException(error);
      
      console.error('API Error:', error);
      
      return res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}
🔒 SECURITY & COMPLIANCE
HIPAA Compliance Checklist
// Encryption at rest (Supabase handles this)
// Encryption in transit (HTTPS only)

// Audit logging for all PHI access
async function logPHIAccess(userId: string, action: string, resourceType: string, resourceId: string) {
  await db.audit_logs.create({
    user_id: userId,
    action: action,
    resource_type: resourceType,
    resource_id: resourceId,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    created_at: new Date()
  });
}

// Example: Middleware for protected routes
export function withPHIProtection(handler: Function) {
  return async (req: Request, res: Response) => {
    const user = req.user; //
From auth middleware
    const { resourceType, resourceId } = req.params;
    
    // Log the access
    await logPHIAccess(
      user.id,
      `viewed_${resourceType}`,
      resourceType,
      resourceId
    );
    
    return await handler(req, res);
  };
}

// Data retention policy
// Cron: Monthly
async function enforceDataRetention() {
  const retentionPeriod = 7; // 7 years for HIPAA
  const cutoffDate = subYears(new Date(), retentionPeriod);
  
  // Archive old records (don't delete, move to cold storage)
  const oldRecords = await db.calls.find({
    created_at: { lte: cutoffDate }
  });
  
  for (const record of oldRecords) {
    // Move recording to glacier storage
    if (record.recording_url) {
      await s3.copyObject({
        CopySource: record.recording_url,
        Bucket: process.env.S3_ARCHIVE_BUCKET,
        Key: record.recording_url,
        StorageClass: 'GLACIER'
      });
    }
    
    // Mark as archived
    await db.calls.update(record.id, {
      archived: true,
      archived_at: new Date()
    });
  }
}

// Minimum necessary access control
async function checkPermission(userId: string, practiceId: string, action: string) {
  const member = await db.practice_members.findOne({
    user_id: userId,
    practice_id: practiceId,
    status: 'active'
  });
  
  if (!member) {
    throw new Error('Access denied: Not a member of this practice');
  }
  
  const permissions = member.permissions || getDefaultPermissions(member.role);
  
  if (!permissions[action]) {
    throw new Error(`Access denied: Missing permission '${action}'`);
  }
  
  return true;
}

function getDefaultPermissions(role: string) {
  const permissionSets = {
    owner: {
      view_calls: true,
      view_patients: true,
      edit_patients: true,
      view_appointments: true,
      edit_appointments: true,
      view_settings: true,
      edit_settings: true,
      view_billing: true,
      edit_billing: true,
      manage_team: true
    },
    admin: {
      view_calls: true,
      view_patients: true,
      edit_patients: true,
      view_appointments: true,
      edit_appointments: true,
      view_settings: true,
      edit_settings: false,
      view_billing: false,
      edit_billing: false,
      manage_team: false
    },
    staff: {
      view_calls: true,
      view_patients: true,
      edit_patients: false,
      view_appointments: true,
      edit_appointments: true,
      view_settings: false,
      edit_settings: false,
      view_billing: false,
      edit_billing: false,
      manage_team: false
    },
    viewer: {
      view_calls: true,
      view_patients: false,
      edit_patients: false,
      view_appointments: true,
      edit_appointments: false,
      view_settings: false,
      edit_settings: false,
      view_billing: false,
      edit_billing: false,
      manage_team: false
    }
  };
  
  return permissionSets[role] || permissionSets.viewer;
}

// BAA (Business Associate Agreement) tracking
async function ensureBAA(practiceId: string) {
  const practice = await db.practices.findById(practiceId);
  
  // Check if BAA is signed
  const baa = await db.system_settings.findOne({
    practice_id: practiceId,
    settings_key: 'baa_agreement'
  });
  
  if (!baa || !baa.settings_value.signed) {
    throw new Error('BAA must be signed before processing PHI');
  }
  
  return true;
}

// API: POST /api/compliance/sign-baa
async function signBAA(practiceId: string, signedBy: string) {
  await db.system_settings.upsert({
    where: {
      practice_id: practiceId,
      settings_key: 'baa_agreement'
    },
    create: {
      practice_id: practiceId,
      settings_key: 'baa_agreement',
      settings_value: {
        signed: true,
        signed_at: new Date(),
        signed_by: signedBy,
        version: '1.0'
      }
    },
    update: {
      settings_value: {
        signed: true,
        signed_at: new Date(),
        signed_by: signedBy,
        version: '1.0'
      }
    }
  });
}
```

---

## 🚀 **DEPLOYMENT & INFRASTRUCTURE**

### **Environment Configuration**

```bash
# .env.production

# Application
NODE_ENV=production
APP_URL=https://app.dentalanswer.ai
API_URL=https://api.dentalanswer.ai
NEXTAUTH_URL=https://app.dentalanswer.ai
NEXTAUTH_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://user:password@host:5432/dentalanswer
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://default:password@host:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Vapi.ai
VAPI_API_KEY=your-vapi-key
VAPI_WEBHOOK_SECRET=your-webhook-secret
VAPI_PUBLIC_KEY=your-public-key

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET=dentalanswer-recordings
S3_ARCHIVE_BUCKET=dentalanswer-archive

# OpenAI
OPENAI_API_KEY=sk-...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@dentalanswer.ai

# Monitoring
SENTRY_DSN=https://...
POSTHOG_API_KEY=phc_...

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

---

### **Database Migrations**

```typescript
// Use Prisma for migrations
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// All the models from the schema above...
```

```bash
# Create migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy

# Generate client
npx prisma generate
```

---

### **API Rate Limiting**

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Create rate limiter
const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate_limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for webhooks
  skip: (req) => {
    return req.path.startsWith('/api/webhooks/');
  }
});

// Apply to all routes
app.use('/api/', limiter);

// Stricter limit for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
```

---

### **Background Jobs with BullMQ**

```typescript
import { Queue, Worker } from 'bullmq';

// Create queues
const appointmentReminderQueue = new Queue('appointment-reminders', {
  connection: redis
});

const campaignQueue = new Queue('campaigns', {
  connection: redis
});

const syncQueue = new Queue('calendar-sync', {
  connection: redis
});

// Workers
const reminderWorker = new Worker(
  'appointment-reminders',
  async (job) => {
    const { appointmentId } = job.data;
    await sendReminder(appointmentId);
  },
  { connection: redis }
);

const campaignWorker = new Worker(
  'campaigns',
  async (job) => {
    const { campaignId, outreachId } = job.data;
    await executeOutreach(campaignId, outreachId);
  },
  { connection: redis, concurrency: 5 }
);

const syncWorker = new Worker(
  'calendar-sync',
  async (job) => {
    const { connectionId } = job.data;
    await syncCalendar(connectionId);
  },
  { connection: redis }
);

// Schedule jobs
export async function scheduleAppointmentReminder(appointmentId: string, sendAt: Date) {
  await appointmentReminderQueue.add(
    'send-reminder',
    { appointmentId },
    { 
      delay: sendAt.getTime() - Date.now(),
      removeOnComplete: true,
      removeOnFail: false
    }
  );
}

// Recurring jobs
export async function setupRecurringJobs() {
  // Sync calendars every 15 minutes
  await syncQueue.add(
    'sync-all-calendars',
    {},
    {
      repeat: {
        pattern: '*/15 * * * *' // Every 15 minutes
      }
    }
  );
  
  // Send reminders every hour
  await appointmentReminderQueue.add(
    'check-reminders',
    {},
    {
      repeat: {
        pattern: '0 * * * *' // Every hour
      }
    }
  );
  
  // Process campaigns every 5 minutes
  await campaignQueue.add(
    'process-campaigns',
    {},
    {
      repeat: {
        pattern: '*/5 * * * *' // Every 5 minutes
      }
    }
  );
}
```

---

### **Caching Strategy**

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache helper functions
export async function getCached<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCached(key: string, value: any, ttl: number = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Example: Cache practice data
export async function getPractice(practiceId: string) {
  const cacheKey = `practice:${practiceId}`;
  
  // Try cache first
  let practice = await getCached<Practice>(cacheKey);
  
  if (!practice) {
    // Cache miss - fetch from database
    practice = await db.practices.findById(practiceId);
    
    // Store in cache for 1 hour
    await setCached(cacheKey, practice, 3600);
  }
  
  return practice;
}

// Example: Cache call analytics
export async function getCallStats(practiceId: string, dateRange: DateRange) {
  const cacheKey = `stats:${practiceId}:${dateRange.startDate}:${dateRange.endDate}`;
  
  let stats = await getCached(cacheKey);
  
  if (!stats) {
    stats = await calculateCallStats(practiceId, dateRange);
    
    // Cache for 5 minutes
    await setCached(cacheKey, stats, 300);
  }
  
  return stats;
}

// Invalidate cache on updates
export async function updatePractice(practiceId: string, data: any) {
  await db.practices.update(practiceId, data);
  
  // Invalidate cache
  await invalidateCache(`practice:${practiceId}`);
  await invalidateCache(`stats:${practiceId}:*`);
}
```

---

## 📝 **API ENDPOINTS SUMMARY**

### **Authentication**
```
POST   /api/auth/signup           - Register new user
POST   /api/auth/login            - Login
POST   /api/auth/logout           - Logout
POST   /api/auth/refresh          - Refresh token
POST   /api/auth/forgot-password  - Request password reset
POST   /api/auth/reset-password   - Reset password
GET    /api/auth/verify-email     - Verify email
```

### **Onboarding**
```
GET    /api/onboarding/status     - Get onboarding progress
POST   /api/onboarding/step       - Complete onboarding step
POST   /api/onboarding/complete   - Finish onboarding
```

### **Practices**
```
GET    /api/practices/:id         - Get practice details
PUT    /api/practices/:id         - Update practice
GET    /api/practices/:id/settings - Get all settings
PUT    /api/practices/:id/settings - Update settings
```

### **Phone Numbers**
```
GET    /api/phone-numbers/search  - Search available numbers
POST   /api/phone-numbers/provision - Buy phone number
GET    /api/phone-numbers         - List practice numbers
DELETE /api/phone-numbers/:id     - Release number
```

### **Calls**
```
GET    /api/calls                 - List calls (paginated, filtered)
GET    /api/calls/:id             - Get call details
GET    /api/calls/:id/recording   - Get call recording URL
GET    /api/calls/:id/transcript  - Get call transcript
POST   /api/calls/:id/notes       - Add note to call
```

### **Appointments**
```
GET    /api/appointments          - List appointments
POST   /api/appointments          - Create appointment (manual)
GET    /api/appointments/:id      - Get appointment details
PUT    /api/appointments/:id      - Update appointment
DELETE /api/appointments/:id      - Cancel appointment
GET    /api/appointments/availability - Check availability
```

### **Patients**
```
GET    /api/patients              - List patients
POST   /api/patients              - Create patient
GET    /api/patients/:id          - Get patient details
PUT    /api/patients/:id          - Update patient
GET    /api/patients/:id/history  - Get patient history
POST   /api/patients/:id/notes    - Add note
```

### **Leads**
```
GET    /api/leads                 - List leads
GET    /api/leads/:id             - Get lead details
PUT    /api/leads/:id             - Update lead status
POST   /api/leads/:id/convert     - Convert to appointment
```

### **Campaigns** (Phase 3)
```
GET    /api/campaigns             - List campaigns
POST   /api/campaigns             - Create campaign
GET    /api/campaigns/:id         - Get campaign details
PUT    /api/campaigns/:id         - Update campaign
POST   /api/campaigns/:id/start   - Start campaign
POST   /api/campaigns/:id/pause   - Pause campaign
GET    /api/campaigns/:id/stats   - Get campaign performance
```

### **Analytics**
```
GET    /api/analytics/dashboard   - Dashboard metrics
GET    /api/analytics/calls       - Call analytics
GET    /api/analytics/appointments - Appointment analytics
GET    /api/analytics/revenue     - Revenue analytics
GET    /api/analytics/export      - Export data (CSV)
```

### **Team**
```
GET    /api/team                  - List team members
POST   /api/team/invite           - Invite team member
PUT    /api/team/:id              - Update member role
DELETE /api/team/:id              - Remove member
```

### **Calendar**
```
POST   /api/calendar/connect      - Connect calendar
GET    /api/calendar/connections  - List connections
DELETE /api/calendar/:id          - Disconnect calendar
POST   /api/calendar/sync         - Trigger manual sync
```

### **Billing**
```
GET    /api/billing/subscription  - Get subscription details
POST   /api/billing/subscribe     - Create subscription
PUT    /api/billing/payment-method - Update payment method
POST   /api/billing/cancel        - Cancel subscription
GET    /api/billing/invoices      - List invoices
GET    /api/billing/usage         - Get current usage
```

### **Webhooks**
```
POST   /api/webhooks/vapi         - Vapi webhook handler
POST   /api/webhooks/twilio/sms   - Twilio SMS webhook
POST   /api/webhooks/stripe       - Stripe webhook
POST   /api/webhooks/calendar     - Calendar webhook
```

### **System**
```
GET    /api/health                - Health check
GET    /api/status                - System status
```

---

## 🔄 **DATA FLOW DIAGRAMS**

### **Call Booking Flow**
```
Patient Calls
    ↓
Vapi Receives Call
    ↓
Webhook: call.started → Create Call Record
    ↓
AI Conversation
    ↓
AI Calls: check_availability()
    ↓
Backend → Query Calendar API → Return Slots
    ↓
AI Offers Times to Patient
    ↓
Patient Accepts
    ↓
AI Calls: book_appointment()
    ↓
Backend Transaction:
  - Find/Create Patient
  - Create Appointment
  - Book in Calendar
  - Update Call Record
    ↓
Send SMS Confirmation
Send Email Confirmation
Notify Practice Staff
    ↓
Webhook: call.ended
    ↓
Store Recording & Transcript
Generate Summary
Update Analytics
    ↓
Dashboard Updates in Real-time (WebSocket)
```

---

## 🎯 **PERFORMANCE OPTIMIZATIONS**

```typescript
// Database query optimization
// Use indexes for common queries
CREATE INDEX CONCURRENTLY idx_calls_practice_date 
  ON calls(practice_id, started_at DESC);

CREATE INDEX CONCURRENTLY idx_appointments_practice_date 
  ON appointments(practice_id, appointment_date, start_time);

CREATE INDEX CONCURRENTLY idx_patients_practice_phone 
  ON patients(practice_id, phone);

// Connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Batch database operations
async function batchUpdateAppointments(updates: Array<{id: string, data: any}>) {
  return await db.$transaction(
    updates.map(update => 
      db.appointments.update({
        where: { id: update.id },
        data: update.data
      })
    )
  );
}

// Lazy loading for large datasets
async function getPaginatedCalls(practiceId: string, page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit;
  
  const [calls, total] = await Promise.all([
    db.calls.findMany({
      where: { practice_id: practiceId },
      orderBy: { started_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        from_number: true,
        status: true,
        outcome: true,
        started_at: true,
        duration_seconds: true,
        patient: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    }),
    db.calls.count({
      where: { practice_id: practiceId }
    })
  ]);
  
  return {
    calls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

---


