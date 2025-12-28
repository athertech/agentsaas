-- Add Twilio fields to phone_numbers table
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS twilio_sid VARCHAR(255),
ADD COLUMN IF NOT EXISTS twilio_account_sid VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_numbers_twilio_sid 
ON phone_numbers(twilio_sid);
