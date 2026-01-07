-- Migration: Remove Twilio and Messaging features
-- This migration drops the messaging infrastructure and cleans up telephony columns

BEGIN;

-- 1. Drop messages table
DROP TABLE IF EXISTS messages CASCADE;

-- 2. Cleanup phone_numbers table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'phone_numbers'::regclass AND attname = 'twilio_sid') THEN
        ALTER TABLE phone_numbers DROP COLUMN IF EXISTS twilio_sid;
    END IF;

    IF EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'phone_numbers'::regclass AND attname = 'twilio_account_sid') THEN
        ALTER TABLE phone_numbers DROP COLUMN IF EXISTS twilio_account_sid;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'phone_numbers'::regclass AND attname = 'vapi_phone_number_id') THEN
        ALTER TABLE phone_numbers ADD COLUMN vapi_phone_number_id TEXT;
    END IF;
END $$;

-- 3. Cleanup practices table (if any Twilio fields were added there)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'practices'::regclass AND attname = 'twilio_setup_status') THEN
        ALTER TABLE practices DROP COLUMN IF EXISTS twilio_setup_status;
    END IF;
END $$;

COMMIT;
