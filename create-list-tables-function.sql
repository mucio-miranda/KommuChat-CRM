-- Função para listar todas as tabelas do schema public
-- Execute este SQL no Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION list_public_tables()
RETURNS TABLE(table_name text, table_type text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    t.table_name::text,
    t.table_type::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'information_%'
    AND t.table_name NOT LIKE 'auth.%'
  ORDER BY t.table_name;
$$;

-- Testar a função
SELECT * FROM list_public_tables();


