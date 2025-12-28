-- Add Cal.com integration columns to practices table
alter table "practices" 
add column if not exists "calcom_api_key" text,
add column if not exists "calcom_event_type_id" text;
