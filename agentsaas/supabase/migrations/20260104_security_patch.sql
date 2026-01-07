-- Migration: Robust Security Patch for RLS Policies
-- Use DO blocks to safely handle tables that might not exist yet

DO $$ 
BEGIN
    -- 1. Practices
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'practices') THEN
        ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage their own practice" ON practices;
        DROP POLICY IF EXISTS "Users can select their own practice" ON practices;
        DROP POLICY IF EXISTS "Users can insert their own practice" ON practices;
        DROP POLICY IF EXISTS "Users can update their own practice" ON practices;
        DROP POLICY IF EXISTS "Users can delete their own practice" ON practices;

        CREATE POLICY "Users can select their own practice" ON practices 
        FOR SELECT TO authenticated USING (auth.uid() = owner_id);

        CREATE POLICY "Users can insert their own practice" ON practices 
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

        CREATE POLICY "Users can update their own practice" ON practices 
        FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

        CREATE POLICY "Users can delete their own practice" ON practices 
        FOR DELETE TO authenticated USING (auth.uid() = owner_id);
    END IF;

    -- 2. Patients
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'patients') THEN
        ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage patients of their practice" ON patients;
        CREATE POLICY "Users can manage patients of their practice" ON patients
        FOR ALL TO authenticated USING (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        ) WITH CHECK (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        );
    END IF;

    -- 3. Calls
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'calls') THEN
        ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage calls of their practice" ON calls;
        CREATE POLICY "Users can manage calls of their practice" ON calls
        FOR ALL TO authenticated USING (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        ) WITH CHECK (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        );
    END IF;

    -- 4. Bookings (Appointments)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'bookings') THEN
        ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage bookings of their practice" ON bookings;
        CREATE POLICY "Users can manage bookings of their practice" ON bookings
        FOR ALL TO authenticated USING (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        ) WITH CHECK (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        );
    END IF;

    -- 5. Appointments (Separate table if used)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'appointments') THEN
        ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage appointments of their practice" ON appointments;
        CREATE POLICY "Users can manage appointments of their practice" ON appointments
        FOR ALL TO authenticated USING (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        ) WITH CHECK (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        );
    END IF;

    -- 6. Leads
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'leads') THEN
        ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage leads of their practice" ON leads;
        CREATE POLICY "Users can manage leads of their practice" ON leads
        FOR ALL TO authenticated USING (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        ) WITH CHECK (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        );
    END IF;

    -- 7. Knowledge Base
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'knowledge_base') THEN
        ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage KB entries of their practice" ON knowledge_base;
        CREATE POLICY "Users can manage KB entries of their practice" ON knowledge_base
        FOR ALL TO authenticated USING (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        ) WITH CHECK (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        );
    END IF;

    -- 8. Phone Numbers
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'phone_numbers') THEN
        ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage their practice phone numbers" ON phone_numbers;
        CREATE POLICY "Users can manage their practice phone numbers" ON phone_numbers
        FOR ALL TO authenticated USING (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        ) WITH CHECK (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        );
    END IF;

    -- 9. Messages
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages') THEN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage their practice messages" ON messages;
        CREATE POLICY "Users can manage their practice messages" ON messages
        FOR ALL TO authenticated USING (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        ) WITH CHECK (
            practice_id IN (SELECT id FROM practices WHERE owner_id = auth.uid())
        );
    END IF;
END $$;
