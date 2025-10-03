-- Tabela para configurações de deploy automático por cliente
CREATE TABLE IF NOT EXISTS deployment_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id TEXT NOT NULL UNIQUE,
  deployment_url TEXT NOT NULL,
  deployment_token TEXT NOT NULL,
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  auto_deploy BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_deployment_configs_cliente_id ON deployment_configs(cliente_id);
CREATE INDEX IF NOT EXISTS idx_deployment_configs_environment ON deployment_configs(environment);
CREATE INDEX IF NOT EXISTS idx_deployment_configs_auto_deploy ON deployment_configs(auto_deploy);

-- RLS (Row Level Security) - permitir acesso apenas para super admins
ALTER TABLE deployment_configs ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso apenas para super admins
CREATE POLICY "Apenas super admins podem acessar deployment_configs" ON deployment_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'super_admin'
      AND ativo = true
    )
  );

-- Comentários para documentação
COMMENT ON TABLE deployment_configs IS 'Configurações de deploy automático por cliente';
COMMENT ON COLUMN deployment_configs.cliente_id IS 'ID único do cliente no sistema';
COMMENT ON COLUMN deployment_configs.deployment_url IS 'URL do serviço de deploy (Vercel, Netlify, etc.)';
COMMENT ON COLUMN deployment_configs.deployment_token IS 'Token de autenticação para o serviço de deploy';
COMMENT ON COLUMN deployment_configs.environment IS 'Ambiente de deploy: development, staging ou production';
COMMENT ON COLUMN deployment_configs.auto_deploy IS 'Indica se o deploy deve ser automático';
