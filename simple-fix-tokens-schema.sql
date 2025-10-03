-- Script simples para corrigir a tabela google_calendar_tokens
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. Verificar estrutura atual
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'google_calendar_tokens'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar colunas que estão faltando
ALTER TABLE google_calendar_tokens 
ADD COLUMN IF NOT EXISTS expires_in INTEGER;

ALTER TABLE google_calendar_tokens 
ADD COLUMN IF NOT EXISTS scope TEXT;

-- 3. Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'google_calendar_tokens_user_id_key'
  ) THEN
    ALTER TABLE google_calendar_tokens 
    ADD CONSTRAINT google_calendar_tokens_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 4. Verificar estrutura final
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'google_calendar_tokens'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Teste simples de inserção
INSERT INTO google_calendar_tokens (
  user_id, 
  access_token, 
  token_type
) VALUES (
  'test@example.com',
  'test_token',
  'Bearer'
) ON CONFLICT (user_id) DO NOTHING;

-- 6. Verificar se funcionou
SELECT 
  user_id,
  token_type,
  expires_in,
  scope
FROM google_calendar_tokens
WHERE user_id = 'test@example.com';

-- 7. Contagem final
SELECT COUNT(*) as total_registros FROM google_calendar_tokens;
