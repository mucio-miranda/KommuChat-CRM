-- Tabela para armazenar tokens do Google Calendar
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  scope TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON google_calendar_tokens(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_google_calendar_tokens_updated_at ON google_calendar_tokens;
CREATE TRIGGER update_google_calendar_tokens_updated_at
    BEFORE UPDATE ON google_calendar_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Política RLS (Row Level Security) - permitir acesso apenas ao próprio usuário
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios tokens
CREATE POLICY "Users can view own tokens" ON google_calendar_tokens
    FOR SELECT USING (auth.uid()::text = user_id);

-- Política para permitir que usuários insiram apenas seus próprios tokens
CREATE POLICY "Users can insert own tokens" ON google_calendar_tokens
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Política para permitir que usuários atualizem apenas seus próprios tokens
CREATE POLICY "Users can update own tokens" ON google_calendar_tokens
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Política para permitir que usuários deletem apenas seus próprios tokens
CREATE POLICY "Users can delete own tokens" ON google_calendar_tokens
    FOR DELETE USING (auth.uid()::text = user_id);

-- Comentários para documentação
COMMENT ON TABLE google_calendar_tokens IS 'Armazena tokens de acesso do Google Calendar para cada usuário';
COMMENT ON COLUMN google_calendar_tokens.user_id IS 'ID único do usuário (email ou ID do sistema)';
COMMENT ON COLUMN google_calendar_tokens.access_token IS 'Token de acesso do Google OAuth';
COMMENT ON COLUMN google_calendar_tokens.refresh_token IS 'Token de renovação do Google OAuth';
COMMENT ON COLUMN google_calendar_tokens.expires_at IS 'Timestamp de expiração do access_token';
COMMENT ON COLUMN google_calendar_tokens.scope IS 'Escopos de permissão concedidos';
COMMENT ON COLUMN google_calendar_tokens.token_type IS 'Tipo do token (geralmente Bearer)';

