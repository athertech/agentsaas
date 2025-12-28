-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Practices Table
create table practices (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id),
  name text not null,
  address text,
  website text,
  practice_type text[],
  insurance text[],
  phone_number text,
  forwarding_number text,
  office_hours jsonb,
  -- AI Configuration
  ai_voice text default 'jennifer',
  ai_greeting text default 'Thank you for calling! I''m your AI receptionist. How can I help you today?',
  ai_tone text default 'professional',
  transfer_keywords text[] default array['speak to someone', 'human', 'real person'],
  emergency_keywords text[] default array['emergency', 'urgent', 'pain', 'bleeding'],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Patients Table
create table patients (
  id uuid primary key default uuid_generate_v4(),
  practice_id uuid references practices(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text not null,
  date_of_birth date,
  insurance_provider text,
  patient_type text default 'new', -- new, existing, inactive
  source text default 'ai_call',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Calls Table
create table calls (
  id uuid primary key default uuid_generate_v4(),
  practice_id uuid references practices(id) on delete cascade,
  patient_id uuid references patients(id),
  caller_number text not null,
  direction text default 'inbound', -- inbound, outbound
  status text, -- in-progress, completed, failed
  outcome text, -- booked, transferred, voicemail, hang_up
  duration_seconds integer,
  talk_time_seconds integer,
  recording_url text,
  transcript text,
  summary text,
  sentiment_score decimal(3,2), -- -1.0 to 1.0
  ai_handled boolean default true,
  transferred_to_human boolean default false,
  metadata jsonb default '{}'::jsonb,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings Table (Appointments)
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  call_id uuid references calls(id),
  practice_id uuid references practices(id) on delete cascade,
  patient_id uuid references patients(id),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  appointment_type text,
  status text default 'scheduled',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic)
alter table practices enable row level security;
alter table patients enable row level security;
alter table calls enable row level security;
alter table bookings enable row level security;

-- Policies
create policy "Users can manage their own practice" on practices for all using (auth.uid() = owner_id);

create policy "Users can manage patients of their practice" on patients for all 
using (practice_id in (select id from practices where owner_id = auth.uid()));

create policy "Users can manage calls of their practice" on calls for all 
using (practice_id in (select id from practices where owner_id = auth.uid()));

create policy "Users can manage bookings of their practice" on bookings for all 
using (practice_id in (select id from practices where owner_id = auth.uid()));
