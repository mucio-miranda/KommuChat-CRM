-- Script para corrigir políticas RLS da tabela client_0
-- Execute este script no SQL Editor do Supabase (projeto KommuChat)

-- 1. Verificar se RLS está ativo na tabela client_0
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'client_0';

-- 2. Desabilitar RLS temporariamente para permitir acesso
ALTER TABLE client_0 DISABLE ROW LEVEL SECURITY;

-- 3. Ou criar políticas permissivas (alternativa ao desabilitar RLS)
-- Descomente as linhas abaixo se preferir manter RLS ativo com políticas permissivas:

-- DROP POLICY IF EXISTS "Allow all operations on client_0" ON client_0;
-- CREATE POLICY "Allow all operations on client_0" ON client_0
--     FOR ALL
--     TO public
--     USING (true)
--     WITH CHECK (true);

-- 4. Verificar se a alteração foi aplicada
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'client_0';

-- 5. Testar acesso à tabela
SELECT COUNT(*) as total_records FROM client_0;
SELECT * FROM client_0 LIMIT 5;

