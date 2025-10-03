-- Script para forçar desabilitação do RLS
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Desabilitar RLS da tabela google_credentials
ALTER TABLE google_credentials DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'google_credentials';

-- 3. Testar acesso aos dados
SELECT 
    id,
    cliente_id,
    redirect_uri,
    configured,
    created_at
FROM google_credentials 
ORDER BY created_at DESC;






