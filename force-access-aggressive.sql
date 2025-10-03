-- Script agressivo para forçar acesso às credenciais
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Allow all operations on google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Permitir todas as operações google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Permitir leitura google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Permitir escrita google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Enable read access for all users" ON google_credentials;
DROP POLICY IF EXISTS "Enable insert for all users" ON google_credentials;
DROP POLICY IF EXISTS "Enable update for all users" ON google_credentials;
DROP POLICY IF EXISTS "Enable delete for all users" ON google_credentials;

-- 2. Desabilitar RLS completamente
ALTER TABLE google_credentials DISABLE ROW LEVEL SECURITY;

-- 3. Dar permissões explícitas
GRANT ALL ON google_credentials TO anon;
GRANT ALL ON google_credentials TO authenticated;
GRANT ALL ON google_credentials TO service_role;

-- 4. Verificar se foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'google_credentials';

-- 5. Verificar políticas restantes
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

-- 6. Testar acesso aos dados
SELECT 
    id,
    cliente_id,
    client_id,
    client_secret,
    redirect_uri,
    configured,
    created_at
FROM google_credentials 
ORDER BY created_at DESC;






