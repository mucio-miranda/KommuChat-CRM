-- Script para criar tabelas necessárias no projeto CRM-KommuChat
-- Execute este SQL no Supabase Dashboard > SQL Editor do projeto CRM

-- 1. Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  tipo TEXT DEFAULT 'clinica' CHECK (tipo IN ('clinica', 'profissional')),
  cnpj_cpf TEXT,
  endereco TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'funcionario')),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de configurações do cliente
CREATE TABLE IF NOT EXISTS configuracoes_cliente (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  valor TEXT NOT NULL,
  tipo TEXT DEFAULT 'string' CHECK (tipo IN ('string', 'boolean', 'number')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id, chave)
);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cliente_id ON usuarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_cliente_id ON configuracoes_cliente(cliente_id);

-- 5. Criar políticas de segurança (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_cliente ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
CREATE POLICY "Enable read access for authenticated users" ON clientes
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON clientes
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON clientes
FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para usuários
CREATE POLICY "Enable read access for authenticated users" ON usuarios
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON usuarios
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON usuarios
FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para configurações
CREATE POLICY "Enable read access for authenticated users" ON configuracoes_cliente
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON configuracoes_cliente
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON configuracoes_cliente
FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Criar triggers para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes_cliente
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Inserir dados de exemplo (opcional)
INSERT INTO clientes (nome, email, telefone, tipo) VALUES
('Clínica Exemplo', 'contato@clinicaexemplo.com', '(11) 99999-9999', 'clinica')
ON CONFLICT (email) DO NOTHING;

-- 9. Verificar se as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clientes', 'usuarios', 'configuracoes_cliente')
ORDER BY table_name;


