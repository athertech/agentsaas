-- Create phone_numbers table to track Vapi provisioned numbers
create table if not exists "phone_numbers" (
  id uuid primary key default uuid_generate_v4(),
  practice_id uuid references practices(id) on delete cascade not null,
  phone_number text not null unique,
  vapi_phone_number_id text,
  vapi_assistant_id text,
  is_primary boolean default false,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table for SMS logs
create table if not exists "messages" (
  id uuid primary key default uuid_generate_v4(),
  practice_id uuid references practices(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete set null,
  message_type text default 'sms',
  direction text not null check (direction in ('inbound', 'outbound')),
  from_address text not null,
  to_address text not null,
  body text,
  provider text default 'vapi',
  provider_message_id text,
  status text default 'sent',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for better query performance
create index if not exists idx_phone_numbers_practice_id on phone_numbers(practice_id);
create index if not exists idx_messages_practice_id on messages(practice_id);
create index if not exists idx_messages_patient_id on messages(patient_id);
