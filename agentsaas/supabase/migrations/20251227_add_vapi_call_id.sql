-- Migration: Add vapi_call_id to bookings
-- Purpose: allow storing the string-based Vapi Call ID which doesn't fit in the UUID call_id column

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS vapi_call_id text;

-- Optional: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_vapi_call_id ON bookings(vapi_call_id);
