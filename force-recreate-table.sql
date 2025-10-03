-- Script para FORÇAR a recriação completa da tabela google_calendar_tokens
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. REMOVER completamente a tabela atual (se existir)
DROP TABLE IF EXISTS public.google_calendar_tokens CASCADE;
DROP TABLE IF EXISTS public.google_calendar_tokens_backup CASCADE;

-- 2. Criar nova tabela completamente limpa
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

-- 3. NÃO habilitar RLS (deixar completamente desabilitado)
-- Não executar: ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Verificar se a tabela foi criada corretamente
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

-- 6. Teste de inserção direta
INSERT INTO google_calendar_tokens (
    user_id, 
    access_token, 
    refresh_token, 
    token_type, 
    expires_in, 
    scope
) VALUES (
    'muciohh@gmail.com',
    'test_access_token_muciohh_clean',
    'test_refresh_token_muciohh_clean',
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

-- 9. Verificar permissões da tabela
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name = 'google_calendar_tokens' 
  AND table_schema = 'public';

-- 10. Mostrar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'google_calendar_tokens' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
