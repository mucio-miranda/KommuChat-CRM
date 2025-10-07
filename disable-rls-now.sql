-- Desabilitar RLS imediatamente para permitir inserções
-- Execute este SQL no painel do Supabase

-- 1. Verificar status atual
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Habilitado"
FROM pg_tables 
WHERE tablename = 'pacientes_manuais';

-- 2. Desabilitar RLS
ALTER TABLE pacientes_manuais DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Habilitado"
FROM pg_tables 
WHERE tablename = 'pacientes_manuais';

-- 4. Remover todas as políticas existentes (se houver)
DROP POLICY IF EXISTS "Allow insert with valid client_id" ON pacientes_manuais;
DROP POLICY IF EXISTS "Users can view their own manual patients" ON pacientes_manuais;
DROP POLICY IF EXISTS "Users can update their own manual patients" ON pacientes_manuais;
DROP POLICY IF EXISTS "Users can delete their own manual patients" ON pacientes_manuais;

-- 5. Confirmar que não há políticas
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'pacientes_manuais';

SELECT 'RLS desabilitado! Agora você pode inserir pacientes normalmente.' as resultado;






