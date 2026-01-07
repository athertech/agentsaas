-- Add ai_voice_provider column to practices table
ALTER TABLE "practices" 
ADD COLUMN IF NOT EXISTS "ai_voice_provider" TEXT;

-- Update existing records to reflect the default 'jennifer' voice provider if they use it
UPDATE "practices"
SET "ai_voice_provider" = 'elevenlabs'
WHERE "ai_voice" = 'jennifer' AND "ai_voice_provider" IS NULL;
