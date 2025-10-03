-- Script para verificar todas as colunas da tabela google_credentials
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'google_credentials' 
ORDER BY ordinal_position;

-- 2. Verificar se RLS está desabilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'google_credentials';

-- 3. Selecionar TODAS as colunas da tabela
SELECT 
    id,
    cliente_id,
    client_id,
    client_secret,
    redirect_uri,
    calendar_id,
    configured,
    created_at,
    updated_at
FROM google_credentials 
ORDER BY created_at DESC;

-- 4. Verificar se há dados nas colunas sensíveis
SELECT 
    id,
    cliente_id,
    CASE 
        WHEN client_id IS NULL THEN 'NULL'
        WHEN client_id = '' THEN 'EMPTY'
        ELSE 'HAS_DATA'
    END as client_id_status,
    CASE 
        WHEN client_secret IS NULL THEN 'NULL'
        WHEN client_secret = '' THEN 'EMPTY'
        ELSE 'HAS_DATA'
    END as client_secret_status,
    redirect_uri,
    configured
FROM google_credentials 
ORDER BY created_at DESC;






