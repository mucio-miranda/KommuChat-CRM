-- Fix RLS policies for pacientes_manuais table
-- Execute this SQL in the Supabase SQL Editor

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pacientes_manuais';

-- Remove existing policies (force drop)
DROP POLICY IF EXISTS "Users can view their own manual patients" ON pacientes_manuais CASCADE;
DROP POLICY IF EXISTS "Users can insert their own manual patients" ON pacientes_manuais CASCADE;
DROP POLICY IF EXISTS "Users can update their own manual patients" ON pacientes_manuais CASCADE;
DROP POLICY IF EXISTS "Users can delete their own manual patients" ON pacientes_manuais CASCADE;
DROP POLICY IF EXISTS "Allow insert with valid client_id" ON pacientes_manuais CASCADE;

-- Create new policies with more permissive insertion
-- Allow insertion with any valid cliente_id (not necessarily auth.uid())
CREATE POLICY "Allow insert with valid client_id" ON pacientes_manuais
    FOR INSERT WITH CHECK (cliente_id IS NOT NULL);

-- Restrictive policies for other operations
CREATE POLICY "Users can view their own manual patients" ON pacientes_manuais
    FOR SELECT USING (auth.uid() = cliente_id);

CREATE POLICY "Users can update their own manual patients" ON pacientes_manuais
    FOR UPDATE USING (auth.uid() = cliente_id);

CREATE POLICY "Users can delete their own manual patients" ON pacientes_manuais
    FOR DELETE USING (auth.uid() = cliente_id);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pacientes_manuais'
ORDER BY policyname;