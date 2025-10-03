-- Script para desabilitar RLS no projeto CRM-KommuChat
-- Execute este SQL no Supabase Dashboard > SQL Editor do projeto CRM

-- Desabilitar Row Level Security nas tabelas
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_cliente DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('clientes', 'usuarios', 'configuracoes_cliente')
  AND schemaname = 'public';

-- Teste de inserção
INSERT INTO clientes (nome, email, telefone, tipo, ativo) 
VALUES ('Teste RLS', 'teste@rls.com', '(11) 99999-9999', 'clinica', true);

-- Verificar se inseriu
SELECT * FROM clientes WHERE email = 'teste@rls.com';

-- Limpar teste
DELETE FROM clientes WHERE email = 'teste@rls.com';

-- Confirmar que funcionou
SELECT 'RLS desabilitado com sucesso!' as status;


