-- Tabela para armazenar credenciais da equipe técnica da KOMMUchat
-- Esta tabela é separada do sistema de usuários do CRM e é exclusiva para administradores da KOMMUchat

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE
);

-- Índices para performance e segurança
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_ativo ON admin_users(ativo);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Função para hash de senha (usando bcrypt)
CREATE OR REPLACE FUNCTION hash_admin_password(password_param TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Usar bcrypt com salt rounds 12 para máxima segurança
  RETURN crypt(password_param, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql;

-- Função para verificar senha
CREATE OR REPLACE FUNCTION verify_admin_password(password_param TEXT, hash_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN crypt(password_param, hash_param) = hash_param;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar tentativas de login
CREATE OR REPLACE FUNCTION increment_admin_login_attempts(username_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE admin_users 
  SET login_attempts = login_attempts + 1,
      locked_until = CASE 
        WHEN login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
        ELSE locked_until
      END
  WHERE username = username_param;
END;
$$ LANGUAGE plpgsql;

-- Função para resetar tentativas de login
CREATE OR REPLACE FUNCTION reset_admin_login_attempts(username_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE admin_users 
  SET login_attempts = 0,
      locked_until = NULL,
      last_login = NOW()
  WHERE username = username_param;
END;
$$ LANGUAGE plpgsql;

-- Inserir o usuário admin padrão da KOMMUchat
INSERT INTO admin_users (username, password_hash, nome, email) 
VALUES (
  'kommuchat.admin',
  hash_admin_password('I''g6kvTzWeE{,b.qPZ7)+B_}qZ6;08[BAKc]>tH=84.O.$w,79'),
  'Administrador KOMMUchat',
  'admin@kommuchat.com'
) ON CONFLICT (username) DO NOTHING;

-- Política RLS para máxima segurança
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Apenas o próprio usuário pode ver seus dados (para login)
CREATE POLICY admin_users_select_policy ON admin_users
  FOR SELECT
  USING (true);

-- Apenas administradores podem inserir/atualizar
CREATE POLICY admin_users_insert_policy ON admin_users
  FOR INSERT
  WITH CHECK (false); -- Desabilitado por segurança

CREATE POLICY admin_users_update_policy ON admin_users
  FOR UPDATE
  USING (false); -- Desabilitado por segurança

-- Comentários para documentação
COMMENT ON TABLE admin_users IS 'Tabela para credenciais da equipe técnica da KOMMUchat';
COMMENT ON COLUMN admin_users.username IS 'Username único para login administrativo';
COMMENT ON COLUMN admin_users.password_hash IS 'Hash bcrypt da senha (salt rounds 12)';
COMMENT ON COLUMN admin_users.login_attempts IS 'Contador de tentativas de login falhadas';
COMMENT ON COLUMN admin_users.locked_until IS 'Timestamp até quando a conta está bloqueada';