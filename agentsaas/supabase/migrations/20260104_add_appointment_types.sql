-- Migration: Add appointment_types to practices
ALTER TABLE practices ADD COLUMN IF NOT EXISTS appointment_types JSONB DEFAULT '[]'::jsonb;
