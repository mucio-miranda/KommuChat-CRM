-- Fix RLS policies for pacientes_manuais table - Version 2
-- Execute this SQL in the Supabase SQL Editor

-- Step 1: Check current policies
SELECT 'Current policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pacientes_manuais'
ORDER BY policyname;

-- Step 2: Remove ALL existing policies one by one
SELECT 'Removing existing policies...' as info;

-- Remove policies individually to avoid conflicts
DO $$
BEGIN
    -- Drop each policy if it exists
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pacientes_manuais' AND policyname = 'Users can view their own manual patients') THEN
        DROP POLICY "Users can view their own manual patients" ON pacientes_manuais;
        RAISE NOTICE 'Dropped: Users can view their own manual patients';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pacientes_manuais' AND policyname = 'Users can insert their own manual patients') THEN
        DROP POLICY "Users can insert their own manual patients" ON pacientes_manuais;
        RAISE NOTICE 'Dropped: Users can insert their own manual patients';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pacientes_manuais' AND policyname = 'Users can update their own manual patients') THEN
        DROP POLICY "Users can update their own manual patients" ON pacientes_manuais;
        RAISE NOTICE 'Dropped: Users can update their own manual patients';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pacientes_manuais' AND policyname = 'Users can delete their own manual patients') THEN
        DROP POLICY "Users can delete their own manual patients" ON pacientes_manuais;
        RAISE NOTICE 'Dropped: Users can delete their own manual patients';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pacientes_manuais' AND policyname = 'Allow insert with valid client_id') THEN
        DROP POLICY "Allow insert with valid client_id" ON pacientes_manuais;
        RAISE NOTICE 'Dropped: Allow insert with valid client_id';
    END IF;
END $$;

-- Step 3: Create new policies
SELECT 'Creating new policies...' as info;

-- Allow insertion with any valid cliente_id (more permissive)
CREATE POLICY "Allow insert with valid client_id" ON pacientes_manuais
    FOR INSERT WITH CHECK (cliente_id IS NOT NULL);

-- Restrictive policies for other operations
CREATE POLICY "Users can view their own manual patients" ON pacientes_manuais
    FOR SELECT USING (auth.uid() = cliente_id);

CREATE POLICY "Users can update their own manual patients" ON pacientes_manuais
    FOR UPDATE USING (auth.uid() = cliente_id);

CREATE POLICY "Users can delete their own manual patients" ON pacientes_manuais
    FOR DELETE USING (auth.uid() = cliente_id);

-- Step 4: Verify new policies
SELECT 'New policies created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pacientes_manuais'
ORDER BY policyname;

SELECT 'RLS policies updated successfully!' as result;




