-- Script completo para corrigir RLS da tabela google_credentials
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Verificar políticas atuais
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'google_credentials';

-- 2. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Permitir todas as operações google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Permitir leitura google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Permitir escrita google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Enable read access for all users" ON google_credentials;
DROP POLICY IF EXISTS "Enable insert for all users" ON google_credentials;
DROP POLICY IF EXISTS "Enable update for all users" ON google_credentials;
DROP POLICY IF EXISTS "Enable delete for all users" ON google_credentials;

-- 3. Desabilitar RLS temporariamente
ALTER TABLE google_credentials DISABLE ROW LEVEL SECURITY;

-- 4. Criar política completamente permissiva
CREATE POLICY "Allow all operations on google_credentials" ON google_credentials
FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

-- 5. Habilitar RLS novamente
ALTER TABLE google_credentials ENABLE ROW LEVEL SECURITY;

-- 6. Verificar se a política foi criada corretamente
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'google_credentials';

-- 7. Testar acesso aos dados
SELECT 
    id,
    cliente_id,
    redirect_uri,
    configured,
    created_at
FROM google_credentials 
ORDER BY created_at DESC;

-- 8. Verificar se RLS está ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'google_credentials';






