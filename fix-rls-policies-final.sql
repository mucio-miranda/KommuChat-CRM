-- Script FINAL para corrigir políticas RLS da tabela google_calendar_tokens
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
        ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Tabela google_calendar_tokens criada com RLS habilitado.';
    END IF;
END $$;

-- 2. Remover TODAS as políticas existentes (limpar tudo)
DO $$
BEGIN
    -- Remover política de leitura
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'google_calendar_tokens' AND policyname = 'Permitir leitura google_calendar_tokens') THEN
        DROP POLICY "Permitir leitura google_calendar_tokens" ON public.google_calendar_tokens;
        RAISE NOTICE 'Política de leitura removida.';
    END IF;
    
    -- Remover política de escrita
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'google_calendar_tokens' AND policyname = 'Permitir escrita google_calendar_tokens') THEN
        DROP POLICY "Permitir escrita google_calendar_tokens" ON public.google_calendar_tokens;
        RAISE NOTICE 'Política de escrita removida.';
    END IF;
    
    -- Remover política de atualização
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'google_calendar_tokens' AND policyname = 'Permitir atualização google_calendar_tokens') THEN
        DROP POLICY "Permitir atualização google_calendar_tokens" ON public.google_calendar_tokens;
        RAISE NOTICE 'Política de atualização removida.';
    END IF;
    
    -- Remover política de exclusão
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'google_calendar_tokens' AND policyname = 'Permitir exclusão google_calendar_tokens') THEN
        DROP POLICY "Permitir exclusão google_calendar_tokens" ON public.google_calendar_tokens;
        RAISE NOTICE 'Política de exclusão removida.';
    END IF;
    
    -- Remover política geral
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'google_calendar_tokens' AND policyname = 'Permitir todas as operações google_calendar_tokens') THEN
        DROP POLICY "Permitir todas as operações google_calendar_tokens" ON public.google_calendar_tokens;
        RAISE NOTICE 'Política geral removida.';
    END IF;
END $$;

-- 3. Criar UMA ÚNICA política permissiva para desenvolvimento
DO $$
BEGIN
    -- Política única que permite tudo para desenvolvimento
    CREATE POLICY "Política única para desenvolvimento" ON public.google_calendar_tokens
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
    
    RAISE NOTICE 'Nova política única criada.';
END $$;

-- 4. Verificar RLS está habilitado
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'google_calendar_tokens' AND schemaname = 'public' AND rowsecurity = true) THEN
        RAISE NOTICE 'RLS está habilitado na tabela google_calendar_tokens.';
    ELSE
        ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado na tabela google_calendar_tokens.';
    END IF;
END $$;

-- 5. Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'google_calendar_tokens'
ORDER BY policyname;

-- 6. Teste de inserção para o usuário fantom.weblabs@gmail.com
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

-- 7. Verificar se a inserção funcionou
SELECT 
    user_id,
    token_type,
    expires_in,
    scope,
    created_at
FROM google_calendar_tokens
WHERE user_id = 'fantom.weblabs@gmail.com';

-- 8. Contagem final
SELECT 
    'google_calendar_tokens' as tabela,
    COUNT(*) as registros
FROM google_calendar_tokens;
