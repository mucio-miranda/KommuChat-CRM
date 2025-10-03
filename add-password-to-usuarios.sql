-- Script para adicionar campo password na tabela usuarios
-- Execute este SQL no Supabase Dashboard > SQL Editor do projeto CRM

-- 1. Adicionar coluna password na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. Adicionar comentário para documentação
COMMENT ON COLUMN usuarios.password IS 'Senha do usuário (deve ser hasheada em produção)';

-- 3. Criar índice para melhor performance (opcional)
CREATE INDEX IF NOT EXISTS idx_usuarios_email_password ON usuarios(email, password);

-- 4. Atualizar usuários existentes com senha padrão (temporário)
-- IMPORTANTE: Em produção, remova esta linha e configure senhas adequadas
UPDATE usuarios 
SET password = '123456' 
WHERE password IS NULL;

-- 5. Tornar a coluna obrigatória após atualizar os registros existentes
ALTER TABLE usuarios ALTER COLUMN password SET NOT NULL;
