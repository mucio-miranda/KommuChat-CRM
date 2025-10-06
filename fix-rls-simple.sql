-- Simple fix for RLS policies - pacientes_manuais
-- Execute this SQL in the Supabase SQL Editor

-- Option 1: Temporarily disable RLS (for testing only)
ALTER TABLE pacientes_manuais DISABLE ROW LEVEL SECURITY;

-- If you want to re-enable RLS later with proper policies, use:
-- ALTER TABLE pacientes_manuais ENABLE ROW LEVEL SECURITY;
-- Then create the policies below:

-- Option 2: Create permissive policies (uncomment if needed)
-- CREATE POLICY "Allow all operations" ON pacientes_manuais
--     FOR ALL USING (true);

-- Option 3: Create specific policies (uncomment if needed)
-- CREATE POLICY "Allow insert" ON pacientes_manuais
--     FOR INSERT WITH CHECK (true);
-- 
-- CREATE POLICY "Allow select own" ON pacientes_manuais
--     FOR SELECT USING (auth.uid() = cliente_id);
-- 
-- CREATE POLICY "Allow update own" ON pacientes_manuais
--     FOR UPDATE USING (auth.uid() = cliente_id);
-- 
-- CREATE POLICY "Allow delete own" ON pacientes_manuais
--     FOR DELETE USING (auth.uid() = cliente_id);




