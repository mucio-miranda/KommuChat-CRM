-- CRM KOMMUchat - Esquema do Banco de Dados
-- Este arquivo contém a estrutura das tabelas para o sistema multi-tenant

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de clientes (clínicas/profissionais)
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    tipo VARCHAR(20) CHECK (tipo IN ('clinica', 'profissional')),
    cnpj_cpf VARCHAR(20),
    endereco TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários do sistema
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'funcionario')) DEFAULT 'funcionario',
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pacientes
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    chat_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    data_nascimento DATE,
    genero VARCHAR(10),
    status VARCHAR(20) CHECK (status IN ('novo', 'followup', 'topoucall', 'atende_humano', 'atendimentofinal')) DEFAULT 'novo',
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    ultimo_contato TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conversas do WhatsApp
CREATE TABLE conversas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(10) CHECK (tipo IN ('entrada', 'saida')) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'enviada',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('consulta', 'retorno', 'exame', 'procedimento')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'remarcado')) DEFAULT 'agendado',
    observacoes TEXT,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    funcionario_id UUID REFERENCES usuarios(id),
    duracao_minutos INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de lembretes
CREATE TABLE lembretes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agendamento_id UUID REFERENCES agendamentos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) CHECK (tipo IN ('sms', 'whatsapp', 'email')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pendente', 'enviado', 'falhou')) DEFAULT 'pendente',
    agendado_para TIMESTAMP WITH TIME ZONE NOT NULL,
    enviado_em TIMESTAMP WITH TIME ZONE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações por cliente
CREATE TABLE configuracoes_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    chave VARCHAR(100) NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'string',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cliente_id, chave)
);

-- Índices para performance
CREATE INDEX idx_pacientes_cliente_id ON pacientes(cliente_id);
CREATE INDEX idx_pacientes_status ON pacientes(status);
CREATE INDEX idx_pacientes_telefone ON pacientes(telefone);
CREATE INDEX idx_pacientes_chat_id ON pacientes(chat_id);

CREATE INDEX idx_conversas_paciente_id ON conversas(paciente_id);
CREATE INDEX idx_conversas_cliente_id ON conversas(cliente_id);
CREATE INDEX idx_conversas_timestamp ON conversas(timestamp);

CREATE INDEX idx_agendamentos_paciente_id ON agendamentos(paciente_id);
CREATE INDEX idx_agendamentos_cliente_id ON agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_data_hora ON agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);

CREATE INDEX idx_usuarios_cliente_id ON usuarios(cliente_id);
CREATE INDEX idx_usuarios_role ON usuarios(role);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_cliente_updated_at BEFORE UPDATE ON configuracoes_cliente
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_cliente ENABLE ROW LEVEL SECURITY;

-- Política para clientes (apenas usuários autenticados podem ver)
CREATE POLICY "Usuários autenticados podem ver clientes" ON clientes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para usuários (cada usuário vê apenas usuários da sua clínica)
CREATE POLICY "Usuários veem apenas usuários da sua clínica" ON usuarios
    FOR SELECT USING (
        auth.uid() IN (
            SELECT auth_user_id FROM usuarios WHERE cliente_id = usuarios.cliente_id
        )
    );

-- Política para pacientes (cada usuário vê apenas pacientes da sua clínica)
CREATE POLICY "Usuários veem apenas pacientes da sua clínica" ON pacientes
    FOR ALL USING (
        cliente_id IN (
            SELECT cliente_id FROM usuarios WHERE auth_user_id = auth.uid()
        )
    );

-- Política para conversas (cada usuário vê apenas conversas da sua clínica)
CREATE POLICY "Usuários veem apenas conversas da sua clínica" ON conversas
    FOR ALL USING (
        cliente_id IN (
            SELECT cliente_id FROM usuarios WHERE auth_user_id = auth.uid()
        )
    );

-- Política para agendamentos (cada usuário vê apenas agendamentos da sua clínica)
CREATE POLICY "Usuários veem apenas agendamentos da sua clínica" ON agendamentos
    FOR ALL USING (
        cliente_id IN (
            SELECT cliente_id FROM usuarios WHERE auth_user_id = auth.uid()
        )
    );

-- Política para lembretes (cada usuário vê apenas lembretes da sua clínica)
CREATE POLICY "Usuários veem apenas lembretes da sua clínica" ON lembretes
    FOR ALL USING (
        cliente_id IN (
            SELECT cliente_id FROM usuarios WHERE auth_user_id = auth.uid()
        )
    );

-- Política para configurações (cada usuário vê apenas configurações da sua clínica)
CREATE POLICY "Usuários veem apenas configurações da sua clínica" ON configuracoes_cliente
    FOR ALL USING (
        cliente_id IN (
            SELECT cliente_id FROM usuarios WHERE auth_user_id = auth.uid()
        )
    );

-- Inserir dados de exemplo para teste
INSERT INTO clientes (nome, email, telefone, tipo) VALUES
('Clínica Exemplo', 'contato@clinicaexemplo.com', '(11) 99999-9999', 'clinica'),
('Dr. João Silva', 'joao.silva@email.com', '(11) 88888-8888', 'profissional');

-- Inserir usuário admin para a clínica exemplo
INSERT INTO usuarios (email, nome, role, cliente_id) VALUES
('admin@clinicaexemplo.com', 'Administrador', 'admin', (SELECT id FROM clientes WHERE email = 'contato@clinicaexemplo.com'));

-- Comentários das tabelas
COMMENT ON TABLE clientes IS 'Tabela principal de clientes (clínicas/profissionais)';
COMMENT ON TABLE usuarios IS 'Usuários do sistema com controle de acesso';
COMMENT ON TABLE pacientes IS 'Cadastro de pacientes por cliente';
COMMENT ON TABLE conversas IS 'Histórico de conversas do WhatsApp';
COMMENT ON TABLE agendamentos IS 'Agendamentos de consultas e procedimentos';
COMMENT ON TABLE lembretes IS 'Sistema de lembretes automáticos';
COMMENT ON TABLE configuracoes_cliente IS 'Configurações específicas por cliente';
