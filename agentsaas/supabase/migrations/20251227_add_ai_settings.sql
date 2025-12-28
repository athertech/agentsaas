-- Add AI configuration columns to practices table
alter table "practices" 
add column if not exists "ai_voice" text default 'jennifer',
add column if not exists "ai_greeting" text default 'Thank you for calling! I''m your AI receptionist. How can I help you today?',
add column if not exists "ai_tone" text default 'professional',
add column if not exists "transfer_keywords" text[] default array['speak to someone', 'human', 'real person'],
add column if not exists "emergency_keywords" text[] default array['emergency', 'urgent', 'pain', 'bleeding'];
