-- Script para criar uma nova tabela google_calendar_tokens SEM RLS
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. Fazer backup da tabela atual (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'google_calendar_tokens' AND schemaname = 'public') THEN
        -- Renomear tabela atual para backup
        ALTER TABLE public.google_calendar_tokens RENAME TO google_calendar_tokens_backup;
        RAISE NOTICE 'Tabela atual renomeada para google_calendar_tokens_backup.';
    END IF;
END $$;

-- 2. Criar nova tabela SEM RLS
CREATE TABLE public.google_calendar_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_in INTEGER,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NÃO habilitar RLS (deixar desabilitado)
-- ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY; -- REMOVIDO

-- 4. Verificar se RLS está desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'google_calendar_tokens' AND schemaname = 'public';

-- 5. Verificar se não há políticas
SELECT COUNT(*) as total_policies 
FROM pg_policies 
WHERE tablename = 'google_calendar_tokens';

-- 6. Teste de inserção
INSERT INTO google_calendar_tokens (
    user_id, 
    access_token, 
    refresh_token, 
    token_type, 
    expires_in, 
    scope
) VALUES (
    'muciohh@gmail.com',
    'test_access_token_muciohh_final',
    'test_refresh_token_muciohh_final',
    'Bearer',
    3600,
    'calendar.readonly calendar.events'
);

-- 7. Verificar inserção
SELECT 
    user_id,
    token_type,
    expires_in,
    scope,
    created_at
FROM google_calendar_tokens
WHERE user_id = 'muciohh@gmail.com';

-- 8. Teste de leitura
SELECT COUNT(*) as total_records FROM google_calendar_tokens;

-- 9. Mostrar todas as tabelas relacionadas
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename LIKE '%google%' AND schemaname = 'public'
ORDER BY tablename;
