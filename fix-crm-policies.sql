-- Script para corrigir políticas de segurança no projeto CRM-KommuChat
-- Execute este SQL no Supabase Dashboard > SQL Editor do projeto CRM

-- 1. Desabilitar RLS temporariamente para teste
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_cliente DISABLE ROW LEVEL SECURITY;

-- 2. Ou criar políticas mais permissivas para usuários anônimos
-- (Descomente as linhas abaixo se preferir manter RLS habilitado)

/*
-- Políticas permissivas para clientes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON clientes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON clientes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON clientes;

CREATE POLICY "Enable all access for anonymous users" ON clientes
FOR ALL USING (true);

-- Políticas permissivas para usuários
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON usuarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON usuarios;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON usuarios;

CREATE POLICY "Enable all access for anonymous users" ON usuarios
FOR ALL USING (true);

-- Políticas permissivas para configurações
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON configuracoes_cliente;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON configuracoes_cliente;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON configuracoes_cliente;

CREATE POLICY "Enable all access for anonymous users" ON configuracoes_cliente
FOR ALL USING (true);
*/

-- 3. Verificar se as tabelas existem e estão acessíveis
SELECT 
  table_name,
  table_type,
  is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clientes', 'usuarios', 'configuracoes_cliente')
ORDER BY table_name;

-- 4. Verificar políticas ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('clientes', 'usuarios', 'configuracoes_cliente');


