-- Script para desabilitar RLS de todas as tabelas necessárias
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Desabilitar RLS de todas as tabelas
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE google_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_cliente DISABLE ROW LEVEL SECURITY;

-- 2. Verificar quais tabelas têm RLS ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('usuarios', 'google_credentials', 'google_calendar_tokens', 'clientes', 'configuracoes_cliente')
ORDER BY tablename;

-- 3. Testar acesso às tabelas
SELECT 'usuarios' as tabela, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'google_credentials' as tabela, COUNT(*) as registros FROM google_credentials
UNION ALL
SELECT 'google_calendar_tokens' as tabela, COUNT(*) as registros FROM google_calendar_tokens
UNION ALL
SELECT 'clientes' as tabela, COUNT(*) as registros FROM clientes
UNION ALL
SELECT 'configuracoes_cliente' as tabela, COUNT(*) as registros FROM configuracoes_cliente;

-- 4. Verificar dados específicos
SELECT 
    id,
    email,
    nome,
    cliente_id,
    role
FROM usuarios 
LIMIT 5;

-- 5. Verificar credenciais Google
SELECT 
    id,
    cliente_id,
    redirect_uri,
    configured,
    created_at
FROM google_credentials 
ORDER BY created_at DESC;






