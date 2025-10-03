-- Script escalável para desabilitar RLS em todas as tabelas (atuais e futuras)
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

-- 3. Verificar se as alterações foram aplicadas
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

-- 4. Criar função para desabilitar RLS em novas tabelas automaticamente
CREATE OR REPLACE FUNCTION disable_rls_for_new_tables()
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
        RAISE NOTICE 'RLS desabilitado para tabela: %', table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para desabilitar RLS automaticamente em novas tabelas
-- (Nota: PostgreSQL não suporta triggers em CREATE TABLE, então usaremos uma abordagem diferente)

-- 6. Criar função para ser executada manualmente quando novas tabelas forem criadas
CREATE OR REPLACE FUNCTION ensure_no_rls_on_all_tables()
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

-- 7. Testar acesso a algumas tabelas
SELECT 'kommuchat_mvp' as tabela, COUNT(*) as registros FROM kommuchat_mvp
UNION ALL
SELECT 'client_0' as tabela, COUNT(*) as registros FROM client_0;

-- 8. Comentários sobre uso futuro
/*
INSTRUÇÕES PARA USO FUTURO:

1. Para desabilitar RLS em novas tabelas criadas:
   SELECT ensure_no_rls_on_all_tables();

2. Para verificar status de RLS em todas as tabelas:
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

3. Para desabilitar RLS em uma tabela específica:
   ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;

4. Para verificar se uma tabela específica tem RLS:
   SELECT rowsecurity FROM pg_tables WHERE tablename = 'nome_da_tabela';
*/

