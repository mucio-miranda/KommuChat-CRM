-- Script para corrigir a estrutura da tabela google_calendar_tokens
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. Verificar estrutura atual da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'google_calendar_tokens'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar colunas que estão faltando
ALTER TABLE google_calendar_tokens 
ADD COLUMN IF NOT EXISTS expires_in INTEGER;

ALTER TABLE google_calendar_tokens 
ADD COLUMN IF NOT EXISTS scope TEXT;

-- 3. Verificar se todas as colunas necessárias existem
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'google_calendar_tokens'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'google_calendar_tokens_user_id_key'
  ) THEN
    -- Adicionar constraint UNIQUE na coluna user_id
    ALTER TABLE google_calendar_tokens 
    ADD CONSTRAINT google_calendar_tokens_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Constraint UNIQUE adicionada na coluna user_id';
  ELSE
    RAISE NOTICE 'Constraint UNIQUE já existe na coluna user_id';
  END IF;
END $$;

-- 5. Teste de inserção após correção
INSERT INTO google_calendar_tokens (
  user_id, 
  access_token, 
  refresh_token, 
  token_type, 
  expires_in, 
  scope
) VALUES (
  'test@example.com',
  'test_access_token',
  'test_refresh_token',
  'Bearer',
  3600,
  'calendar.readonly calendar.events'
) ON CONFLICT (user_id) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  token_type = EXCLUDED.token_type,
  expires_in = EXCLUDED.expires_in,
  scope = EXCLUDED.scope,
  updated_at = NOW();

-- 6. Verificar se a inserção funcionou
SELECT 
  user_id,
  token_type,
  expires_in,
  scope,
  created_at
FROM google_calendar_tokens
WHERE user_id = 'test@example.com';

-- 7. Contagem final
SELECT 
  'google_calendar_tokens' as tabela,
  COUNT(*) as registros
FROM google_calendar_tokens;
