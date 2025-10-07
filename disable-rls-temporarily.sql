-- Solução temporária: Desabilitar RLS para permitir inserções
-- Execute este SQL no painel do Supabase

-- 1. Verificar status atual do RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'pacientes_manuais';

-- 2. Desabilitar RLS temporariamente
ALTER TABLE pacientes_manuais DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'pacientes_manuais';

-- 4. Testar inserção (opcional - descomente para testar)
-- INSERT INTO pacientes_manuais (nome, email, telefone, status, observacoes, cliente_id)
-- VALUES ('Teste RLS', 'teste@rls.com', '11999999999', 'novo', 'Teste sem RLS', '00000000-0000-0000-0000-000000000000');

SELECT 'RLS desabilitado temporariamente! Agora você pode inserir pacientes.' as resultado;

-- IMPORTANTE: Para reativar RLS depois, execute:
-- ALTER TABLE pacientes_manuais ENABLE ROW LEVEL SECURITY;
-- E então crie as políticas corretas






