-- Script para criar função que bypassa RLS
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Criar função que retorna credenciais sem RLS
CREATE OR REPLACE FUNCTION get_google_credentials_by_cliente_id(p_cliente_id TEXT)
RETURNS TABLE (
    id UUID,
    cliente_id TEXT,
    client_id TEXT,
    client_secret TEXT,
    redirect_uri TEXT,
    calendar_id TEXT,
    configured BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gc.id,
        gc.cliente_id,
        gc.client_id,
        gc.client_secret,
        gc.redirect_uri,
        gc.calendar_id,
        gc.configured,
        gc.created_at,
        gc.updated_at
    FROM google_credentials gc
    WHERE gc.cliente_id = p_cliente_id;
END;
$$;

-- 2. Criar função que retorna todas as credenciais
CREATE OR REPLACE FUNCTION get_all_google_credentials()
RETURNS TABLE (
    id UUID,
    cliente_id TEXT,
    client_id TEXT,
    client_secret TEXT,
    redirect_uri TEXT,
    calendar_id TEXT,
    configured BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gc.id,
        gc.cliente_id,
        gc.client_id,
        gc.client_secret,
        gc.redirect_uri,
        gc.calendar_id,
        gc.configured,
        gc.created_at,
        gc.updated_at
    FROM google_credentials gc;
END;
$$;

-- 3. Testar as funções
SELECT * FROM get_google_credentials_by_cliente_id('9f807244-0206-40dc-8dda-95191cfc8bc8');

SELECT * FROM get_all_google_credentials();






