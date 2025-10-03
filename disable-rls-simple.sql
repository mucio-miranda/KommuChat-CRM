-- Script simples para desabilitar RLS da tabela google_credentials
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Desabilitar RLS completamente
ALTER TABLE google_credentials DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'google_credentials';

-- 3. Verificar dados na tabela
SELECT 
    id,
    cliente_id,
    redirect_uri,
    configured,
    created_at
FROM google_credentials 
ORDER BY created_at DESC;






