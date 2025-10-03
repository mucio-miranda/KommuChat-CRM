-- Script SIMPLES para corrigir políticas RLS
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. Desabilitar RLS temporariamente (para desenvolvimento)
ALTER TABLE public.google_calendar_tokens DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se RLS foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'google_calendar_tokens' AND schemaname = 'public';

-- 3. Inserir token de teste para fantom.weblabs@gmail.com
INSERT INTO google_calendar_tokens (
    user_id, 
    access_token, 
    refresh_token, 
    token_type, 
    expires_in, 
    scope
) VALUES (
    'fantom.weblabs@gmail.com',
    'test_access_token_fantom',
    'test_refresh_token_fantom',
    'Bearer',
    3600,
    'calendar.readonly calendar.events'
) ON CONFLICT (user_id) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_type = EXCLUDED.token_type,
    expires_in = EXCLUDED.expires_in,
    scope = EXCLUDED.scope,
    updated_at = NOW();

-- 4. Verificar se a inserção funcionou
SELECT 
    user_id,
    token_type,
    expires_in,
    scope,
    created_at
FROM google_calendar_tokens
WHERE user_id = 'fantom.weblabs@gmail.com';

-- 5. Contagem final
SELECT 
    'google_calendar_tokens' as tabela,
    COUNT(*) as registros
FROM google_calendar_tokens;
