-- Tabela para configurações Google Calendar por cliente
-- Execute este SQL no Supabase Dashboard > SQL Editor do projeto CRM

CREATE TABLE IF NOT EXISTS configuracoes_google (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  google_client_id TEXT NOT NULL,
  google_redirect_uri TEXT NOT NULL DEFAULT 'http://localhost:8080/auth/google/callback',
  google_calendar_id TEXT, -- ID específico do calendário (opcional)
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id) -- Um cliente só pode ter uma configuração Google
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_google_cliente_id ON configuracoes_google(cliente_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_google_ativo ON configuracoes_google(ativo);

-- Comentário da tabela
COMMENT ON TABLE configuracoes_google IS 'Configurações do Google Cloud Console por cliente para integração com Google Calendar';
COMMENT ON COLUMN configuracoes_google.google_client_id IS 'Client ID do Google Cloud Console do cliente';
COMMENT ON COLUMN configuracoes_google.google_redirect_uri IS 'URI de redirecionamento OAuth configurada no Google Cloud Console';
COMMENT ON COLUMN configuracoes_google.google_calendar_id IS 'ID específico do calendário Google (opcional)';
