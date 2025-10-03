-- Script essencial para criar tabelas do Google Calendar
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. Criar tabela google_credentials
CREATE TABLE IF NOT EXISTS google_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  calendar_id TEXT,
  configured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id)
);

-- 2. Criar tabela google_calendar_tokens
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_in INTEGER,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE google_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas (ignorar erros se já existirem)
DO $$
BEGIN
  -- Política para google_credentials
  BEGIN
    CREATE POLICY "Permitir todas as operações google_credentials" ON google_credentials
      FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Ignorar se já existe
  END;

  -- Política para google_calendar_tokens
  BEGIN
    CREATE POLICY "Permitir todas as operações google_calendar_tokens" ON google_calendar_tokens
      FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Ignorar se já existe
  END;
END $$;

-- 5. Verificação final
SELECT 'google_credentials' as tabela, COUNT(*) as registros FROM google_credentials
UNION ALL
SELECT 'google_calendar_tokens' as tabela, COUNT(*) as registros FROM google_calendar_tokens;
