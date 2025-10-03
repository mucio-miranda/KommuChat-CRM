-- Script para criar a tabela google_calendar_tokens no Supabase CRM
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- Criar tabela google_calendar_tokens
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
  
  -- Índice único para user_id
  UNIQUE(user_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Política permissiva para desenvolvimento
CREATE POLICY "Permitir todas as operações" ON google_calendar_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE google_calendar_tokens IS 'Armazena tokens de acesso do Google Calendar por usuário';
COMMENT ON COLUMN google_calendar_tokens.user_id IS 'Email do usuário proprietário dos tokens';
COMMENT ON COLUMN google_calendar_tokens.access_token IS 'Token de acesso do Google OAuth';
COMMENT ON COLUMN google_calendar_tokens.refresh_token IS 'Token de renovação do Google OAuth';
COMMENT ON COLUMN google_calendar_tokens.expires_in IS 'Tempo de expiração em segundos';
COMMENT ON COLUMN google_calendar_tokens.scope IS 'Escopos de acesso concedidos';
