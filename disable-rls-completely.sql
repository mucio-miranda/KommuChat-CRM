-- Script para DESABILITAR completamente o RLS na tabela google_calendar_tokens
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. Verificar se a tabela existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'google_calendar_tokens' AND schemaname = 'public') THEN
        RAISE NOTICE 'Tabela google_calendar_tokens existe.';
    ELSE
        RAISE NOTICE 'Tabela google_calendar_tokens não existe. Criando...';
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
        RAISE NOTICE 'Tabela google_calendar_tokens criada.';
    END IF;
END $$;

-- 2. REMOVER TODAS as políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Remover todas as políticas da tabela
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'google_calendar_tokens'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.google_calendar_tokens', policy_record.policyname);
        RAISE NOTICE 'Política removida: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. DESABILITAR RLS completamente
ALTER TABLE public.google_calendar_tokens DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se RLS está desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'google_calendar_tokens' AND schemaname = 'public';

-- 5. Verificar se não há políticas restantes
SELECT COUNT(*) as total_policies 
FROM pg_policies 
WHERE tablename = 'google_calendar_tokens';

-- 6. Teste de inserção direta (sem RLS)
INSERT INTO google_calendar_tokens (
    user_id, 
    access_token, 
    refresh_token, 
    token_type, 
    expires_in, 
    scope
) VALUES (
    'muciohh@gmail.com',
    'test_access_token_muciohh_new',
    'test_refresh_token_muciohh_new',
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

-- 7. Verificar se a inserção funcionou
SELECT 
    user_id,
    token_type,
    expires_in,
    scope,
    created_at
FROM google_calendar_tokens
WHERE user_id = 'muciohh@gmail.com';

-- 8. Contagem final
SELECT 
    'google_calendar_tokens' as tabela,
    COUNT(*) as registros
FROM google_calendar_tokens;
