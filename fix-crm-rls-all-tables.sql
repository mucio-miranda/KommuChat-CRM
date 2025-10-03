-- Script para desabilitar RLS em todas as tabelas do CRM Supabase
-- Execute este script no SQL Editor do Supabase CRM (wywzdtyjzzmcehrsalvn)

-- 1. Verificar status atual do RLS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'clientes',
    'usuarios', 
    'configuracoes_cliente',
    'google_credentials',
    'google_calendar_tokens'
)
ORDER BY tablename;

-- 2. Desabilitar RLS em todas as tabelas do CRM
ALTER TABLE IF EXISTS clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracoes_cliente DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS google_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS google_calendar_tokens DISABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Permitir todas as operações clientes" ON clientes;
DROP POLICY IF EXISTS "Permitir todas as operações usuarios" ON usuarios;
DROP POLICY IF EXISTS "Permitir todas as operações configuracoes_cliente" ON configuracoes_cliente;
DROP POLICY IF EXISTS "Permitir todas as operações google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Permitir todas as operações google_calendar_tokens" ON google_calendar_tokens;

-- 4. Verificar se RLS foi desabilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'clientes',
    'usuarios', 
    'configuracoes_cliente',
    'google_credentials',
    'google_calendar_tokens'
)
ORDER BY tablename;

-- 5. Testar acesso às tabelas
SELECT 'clientes' as tabela, COUNT(*) as registros FROM clientes
UNION ALL
SELECT 'usuarios' as tabela, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'configuracoes_cliente' as tabela, COUNT(*) as registros FROM configuracoes_cliente
UNION ALL
SELECT 'google_credentials' as tabela, COUNT(*) as registros FROM google_credentials
UNION ALL
SELECT 'google_calendar_tokens' as tabela, COUNT(*) as registros FROM google_calendar_tokens;

-- 6. Se alguma tabela não existir, criar
CREATE TABLE IF NOT EXISTS google_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    calendar_id TEXT DEFAULT 'primary',
    configured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at BIGINT,
    scope TEXT NOT NULL,
    token_type TEXT DEFAULT 'Bearer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Verificar resultado final
SELECT 'RESULTADO FINAL:' as status;
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '❌ RLS ATIVO' ELSE '✅ RLS DESABILITADO' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'clientes',
    'usuarios', 
    'configuracoes_cliente',
    'google_credentials',
    'google_calendar_tokens'
)
ORDER BY tablename;
