-- Script para corrigir o formato da solicitação do Google Calendar
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. Verificar se a tabela existe
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'google_calendar_tokens' AND schemaname = 'public';

-- 2. Verificar se não há políticas
SELECT COUNT(*) as total_policies 
FROM pg_policies 
WHERE tablename = 'google_calendar_tokens';

-- 3. Limpar todos os registros existentes
DELETE FROM google_calendar_tokens;

-- 4. Inserir token de teste para o usuário muciohh@gmail.com
INSERT INTO google_calendar_tokens (
    user_id, 
    access_token, 
    refresh_token, 
    token_type, 
    expires_in, 
    scope
) VALUES (
    'muciohh@gmail.com',
    'test_access_token_muciohh_correct',
    'test_refresh_token_muciohh_correct',
    'Bearer',
    3600,
    'calendar.readonly calendar.events'
);

-- 5. Verificar se a inserção funcionou
SELECT 
    user_id,
    token_type,
    expires_in,
    scope,
    created_at
FROM google_calendar_tokens
WHERE user_id = 'muciohh@gmail.com';

-- 6. Teste de leitura direta
SELECT COUNT(*) as total_records FROM google_calendar_tokens;

-- 7. Verificar se a tabela está acessível
SELECT 
    'google_calendar_tokens' as table_name,
    'public' as schema_name,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM google_calendar_tokens) as record_count
FROM pg_tables 
WHERE tablename = 'google_calendar_tokens' AND schemaname = 'public';
