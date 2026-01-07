-- CONSOLIDATED FIX: Apply all missing 2026 migrations
-- This script adds missing columns and tables to ensure the onboarding flow works correctly.
-- RUN THIS IN THE SUPABASE SQL EDITOR

BEGIN;

-- 1. Add missing columns to practices table
ALTER TABLE "practices" ADD COLUMN IF NOT EXISTS "ai_voice_provider" TEXT;
ALTER TABLE "practices" ADD COLUMN IF NOT EXISTS "has_completed_onboarding" BOOLEAN DEFAULT false;
ALTER TABLE "practices" ADD COLUMN IF NOT EXISTS "appointment_types" JSONB DEFAULT '[]'::jsonb;

-- 2. Cleanup legacy columns
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'practices'::regclass AND attname = 'twilio_setup_status') THEN
        ALTER TABLE practices DROP COLUMN IF EXISTS twilio_setup_status;
    END IF;
END $$;

-- 3. Update existing records for 'jennifer' voice
UPDATE "practices"
SET "ai_voice_provider" = 'elevenlabs'
WHERE "ai_voice" = 'jennifer' AND "ai_voice_provider" IS NULL;

-- 4. Create knowledge_base table
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    question TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_practice_id ON knowledge_base(practice_id);
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- 5. Create phone_numbers cleanup
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

-- 6. Apply robust RLS policies (from security_patch)
DO $$ 
BEGIN
    -- Practices RLS
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'practices') THEN
        ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage their own practice" ON practices;
        DROP POLICY IF EXISTS "Users can select their own practice" ON practices;
        DROP POLICY IF EXISTS "Users can insert their own practice" ON practices;
        DROP POLICY IF EXISTS "Users can update their own practice" ON practices;
        
        CREATE POLICY "Users can select their own practice" ON practices 
        FOR SELECT TO authenticated USING (auth.uid() = owner_id);

        CREATE POLICY "Users can insert their own practice" ON practices 
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

        CREATE POLICY "Users can update their own practice" ON practices 
        FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
    END IF;

    -- KB RLS
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'knowledge_base') THEN
        DROP POLICY IF EXISTS "Users can manage KB entries of their practice" ON knowledge_base;
        CREATE POLICY "Users can manage KB entries of their practice" ON knowledge_base 
        FOR ALL TO authenticated 
        USING (practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid()))
        WITH CHECK (practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid()));
    END IF;
END $$;

COMMIT;
