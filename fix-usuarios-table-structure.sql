-- Corrigir a estrutura da tabela usuarios
-- 1. Remover a constraint NOT NULL da coluna password
ALTER TABLE usuarios ALTER COLUMN password DROP NOT NULL;

-- 2. Adicionar a coluna password_hash se não existir
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

-- 3. Verificar a estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND table_schema = 'public'
ORDER BY ordinal_position;






