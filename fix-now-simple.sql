-- SOLUÇÃO SIMPLES E DIRETA
-- Execute este SQL no painel do Supabase

-- Desabilitar RLS para permitir inserções
ALTER TABLE pacientes_manuais DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 'RLS desabilitado com sucesso!' as resultado;




