-- Script alternativo para corrigir políticas RLS no projeto CRM-KommuChat
-- Execute este SQL no Supabase Dashboard > SQL Editor do projeto CRM
-- (Use este se preferir manter RLS habilitado)

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON clientes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON clientes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON clientes;
DROP POLICY IF EXISTS "Enable all access for anonymous users" ON clientes;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON usuarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON usuarios;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON usuarios;
DROP POLICY IF EXISTS "Enable all access for anonymous users" ON usuarios;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON configuracoes_cliente;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON configuracoes_cliente;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON configuracoes_cliente;
DROP POLICY IF EXISTS "Enable all access for anonymous users" ON configuracoes_cliente;

-- Criar políticas permissivas para usuários anônimos
CREATE POLICY "Allow all operations for anonymous users" ON clientes
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON usuarios
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON configuracoes_cliente
FOR ALL USING (true) WITH CHECK (true);

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('clientes', 'usuarios', 'configuracoes_cliente')
  AND schemaname = 'public';

-- Teste de inserção
INSERT INTO clientes (nome, email, telefone, tipo, ativo) 
VALUES ('Teste Política', 'teste@politica.com', '(11) 99999-9999', 'clinica', true);

-- Verificar se inseriu
SELECT * FROM clientes WHERE email = 'teste@politica.com';

-- Limpar teste
DELETE FROM clientes WHERE email = 'teste@politica.com';

-- Confirmar que funcionou
SELECT 'Políticas RLS corrigidas com sucesso!' as status;


