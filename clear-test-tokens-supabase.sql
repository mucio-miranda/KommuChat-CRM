-- Script para limpar tokens de teste do Google Calendar no Supabase
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Verificar tokens existentes
SELECT 
    id,
    user_id,
    access_token,
    refresh_token,
    expires_at,
    created_at
FROM google_calendar_tokens
WHERE user_id LIKE '%test%' 
   OR access_token LIKE '%test%'
   OR refresh_token LIKE '%test%';

-- 2. Remover tokens de teste
DELETE FROM google_calendar_tokens
WHERE user_id LIKE '%test%' 
   OR access_token LIKE '%test%'
   OR refresh_token LIKE '%test%';

-- 3. Verificar se ainda existem tokens
SELECT COUNT(*) as total_tokens FROM google_calendar_tokens;

-- 4. Verificar tokens restantes
SELECT 
    id,
    user_id,
    LEFT(access_token, 20) as access_token_preview,
    LEFT(refresh_token, 20) as refresh_token_preview,
    expires_at,
    created_at
FROM google_calendar_tokens;
