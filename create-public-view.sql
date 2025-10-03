-- Script para criar uma view pública das credenciais
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Criar view pública das credenciais Google
CREATE OR REPLACE VIEW public_google_credentials AS
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
FROM google_credentials;

-- 2. Dar permissões para a view
GRANT SELECT ON public_google_credentials TO anon;
GRANT SELECT ON public_google_credentials TO authenticated;

-- 3. Testar a view
SELECT * FROM public_google_credentials 
ORDER BY created_at DESC;






