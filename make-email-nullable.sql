-- Script para tornar o campo email opcional na tabela usuarios
-- Execute este SQL no Supabase Dashboard > SQL Editor do projeto CRM

-- 1. Remover a constraint NOT NULL da coluna email
ALTER TABLE usuarios ALTER COLUMN email DROP NOT NULL;

-- 2. Remover a constraint UNIQUE da coluna email (pois NULL não pode ser único)
-- Primeiro, vamos verificar se existe constraint unique
DO $$
BEGIN
    -- Verificar se existe constraint unique no email
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'usuarios' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%email%'
    ) THEN
        -- Remover constraint unique se existir
        ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
    END IF;
END $$;

-- 3. Criar índice parcial para emails únicos (apenas para emails não-nulos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_unique 
ON usuarios (email) 
WHERE email IS NOT NULL;

-- 4. Verificar a estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND table_schema = 'public'
AND column_name = 'email'
ORDER BY ordinal_position;

-- 5. Verificar se a alteração foi aplicada
SELECT 
    'Email column is now nullable' as status,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name = 'email';
