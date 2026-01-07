-- Migration: Add onboarding status and knowledge base table

-- 1. Add onboarding status to practices
ALTER TABLE practices ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- 2. Create knowledge_base table
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL, -- e.g., 'faq', 'insurance', 'procedures', 'general'
    question TEXT,          -- Optional, for FAQ style
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add index
CREATE INDEX IF NOT EXISTS idx_knowledge_base_practice_id ON knowledge_base(practice_id);

-- 4. Enable RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Users can manage KB entries of their practice" ON knowledge_base FOR ALL 
USING (practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid()));
