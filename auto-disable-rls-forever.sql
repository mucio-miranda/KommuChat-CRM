-- Solução para desabilitar RLS automaticamente em TODAS as tabelas futuras
-- Execute este script no SQL Editor do Supabase (projeto KommuChat)

-- 1. Verificar status atual do RLS em todas as tabelas
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS ATIVO'
        ELSE 'RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Desabilitar RLS em TODAS as tabelas existentes
DO $$
DECLARE
    table_name text;
BEGIN
    -- Loop através de todas as tabelas públicas
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND rowsecurity = true  -- Apenas tabelas com RLS ativo
    LOOP
        -- Desabilitar RLS para cada tabela
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'RLS desabilitado para tabela: %', table_name;
    END LOOP;
END $$;

-- 3. Criar função que será executada automaticamente
CREATE OR REPLACE FUNCTION auto_disable_rls_on_new_tables()
RETURNS void AS $$
DECLARE
    table_name text;
BEGIN
    -- Loop através de todas as tabelas que têm RLS ativo
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
    LOOP
        -- Desabilitar RLS para cada tabela
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'RLS desabilitado automaticamente para tabela: %', table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger que executa automaticamente após CREATE TABLE
-- (Nota: PostgreSQL não suporta triggers em CREATE TABLE diretamente, 
-- mas podemos criar uma solução alternativa)

-- 5. Criar função para ser executada manualmente (mais confiável)
CREATE OR REPLACE FUNCTION ensure_all_tables_no_rls()
RETURNS void AS $$
DECLARE
    table_name text;
    rls_status boolean;
BEGIN
    -- Loop através de todas as tabelas públicas
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- Verificar se RLS está ativo
        SELECT rowsecurity INTO rls_status
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = table_name;
        
        -- Se RLS estiver ativo, desabilitar
        IF rls_status THEN
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'RLS desabilitado para tabela: %', table_name;
        ELSE
            RAISE NOTICE 'RLS já desabilitado para tabela: %', table_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar função para configurar RLS padrão para novas tabelas
-- (Esta função deve ser executada após criar cada nova tabela)
CREATE OR REPLACE FUNCTION setup_new_table_no_rls(table_name text)
RETURNS void AS $$
BEGIN
    -- Desabilitar RLS na tabela especificada
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
    RAISE NOTICE 'RLS desabilitado para nova tabela: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- 7. Verificar se as alterações foram aplicadas
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS ATIVO'
        ELSE 'RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 8. Testar acesso a algumas tabelas
SELECT 'kommuchat_mvp' as tabela, COUNT(*) as registros FROM kommuchat_mvp
UNION ALL
SELECT 'client_0' as tabela, COUNT(*) as registros FROM client_0;

-- 9. Instruções para uso futuro
/*
INSTRUÇÕES PARA USO FUTURO:

1. Para desabilitar RLS em todas as tabelas (incluindo novas):
   SELECT ensure_all_tables_no_rls();

2. Para configurar uma nova tabela específica:
   SELECT setup_new_table_no_rls('nome_da_tabela');

3. Para verificar status de RLS em todas as tabelas:
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

4. Para duplicar uma tabela (herda características):
   CREATE TABLE nova_tabela AS SELECT * FROM tabela_original;
   SELECT setup_new_table_no_rls('nova_tabela');

5. Para criar tabela com RLS desabilitado desde o início:
   CREATE TABLE minha_tabela (...);
   SELECT setup_new_table_no_rls('minha_tabela');

NOTA: Tabelas duplicadas herdam a estrutura, mas NÃO herdam as configurações de RLS.
Portanto, sempre execute setup_new_table_no_rls() após duplicar tabelas.
*/
