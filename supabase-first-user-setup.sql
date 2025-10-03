-- Setup do Primeiro Usuário KommuChat
-- Este script cria o primeiro cliente com Google Calendar pré-configurado

-- 1. Criar o primeiro cliente (clínica)
INSERT INTO clientes (id, nome, email, telefone, tipo, cnpj_cpf, endereco, ativo) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001', -- ID fixo para facilitar referências
    'Clínica KommuChat Demo',
    'demo@kommuchat.com',
    '(11) 99999-9999',
    'clinica',
    '12.345.678/0001-90',
    'Rua das Flores, 123 - São Paulo/SP',
    true
);

-- 2. Criar usuário admin para a clínica
INSERT INTO usuarios (id, email, nome, role, cliente_id, ativo) VALUES
(
    '550e8400-e29b-41d4-a716-446655440002', -- ID fixo
    'admin@kommuchat.com',
    'Administrador KommuChat',
    'admin',
    '550e8400-e29b-41d4-a716-446655440001',
    true
);

-- 3. Configurações específicas da clínica
INSERT INTO configuracoes_cliente (cliente_id, chave, valor, tipo) VALUES
-- Configurações do Google Calendar
('550e8400-e29b-41d4-a716-446655440001', 'google_calendar_enabled', 'true', 'boolean'),
('550e8400-e29b-41d4-a716-446655440001', 'google_calendar_id', 'primary', 'string'),
('550e8400-e29b-41d4-a716-446655440001', 'google_calendar_timezone', 'America/Sao_Paulo', 'string'),

-- Configurações do WhatsApp/Evolution
('550e8400-e29b-41d4-a716-446655440001', 'whatsapp_enabled', 'true', 'boolean'),
('550e8400-e29b-41d4-a716-446655440001', 'evolution_api_url', 'https://api.evolution.com', 'string'),
('550e8400-e29b-41d4-a716-446655440001', 'evolution_api_key', 'YOUR_EVOLUTION_API_KEY', 'string'),

-- Configurações de negócio
('550e8400-e29b-41d4-a716-446655440001', 'clinica_nome', 'Clínica KommuChat Demo', 'string'),
('550e8400-e29b-41d4-a716-446655440001', 'clinica_telefone', '(11) 99999-9999', 'string'),
('550e8400-e29b-41d4-a716-446655440001', 'clinica_endereco', 'Rua das Flores, 123 - São Paulo/SP', 'string'),

-- Configurações de agendamento
('550e8400-e29b-41d4-a716-446655440001', 'agendamento_duracao_padrao', '60', 'number'),
('550e8400-e29b-41d4-a716-446655440001', 'agendamento_antecedencia_minima', '24', 'number'),
('550e8400-e29b-41d4-a716-446655440001', 'agendamento_antecedencia_maxima', '90', 'number'),

-- Configurações de lembretes
('550e8400-e29b-41d4-a716-446655440001', 'lembrete_whatsapp_24h', 'true', 'boolean'),
('550e8400-e29b-41d4-a716-446655440001', 'lembrete_whatsapp_2h', 'true', 'boolean'),
('550e8400-e29b-41d4-a716-446655440001', 'lembrete_email_24h', 'false', 'boolean');

-- 4. Criar tabela específica para pacientes desta clínica
CREATE TABLE IF NOT EXISTS clinica_kommuchat_pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    chat_id VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    data_nascimento DATE,
    genero VARCHAR(10),
    status VARCHAR(20) CHECK (status IN ('novo', 'followup', 'topoucall', 'atende_humano', 'atendimentofinal')) DEFAULT 'novo',
    ultimo_contato TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela específica para agendamentos desta clínica
CREATE TABLE IF NOT EXISTS clinica_kommuchat_agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES clinica_kommuchat_pacientes(id) ON DELETE CASCADE,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('consulta', 'retorno', 'exame', 'procedimento')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'remarcado')) DEFAULT 'agendado',
    observacoes TEXT,
    funcionario_id UUID REFERENCES usuarios(id),
    duracao_minutos INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Inserir alguns pacientes de exemplo
INSERT INTO clinica_kommuchat_pacientes (nome, telefone, chat_id, email, status) VALUES
('Maria Silva', '11999999999', '5511999999999@s.whatsapp.net', 'maria.silva@email.com', 'novo'),
('João Santos', '11888888888', '5511888888888@s.whatsapp.net', 'joao.santos@email.com', 'followup'),
('Ana Costa', '11777777777', '5511777777777@s.whatsapp.net', 'ana.costa@email.com', 'topoucall');

-- 7. Inserir alguns agendamentos de exemplo
INSERT INTO clinica_kommuchat_agendamentos (paciente_id, data_hora, tipo, status, funcionario_id) VALUES
(
    (SELECT id FROM clinica_kommuchat_pacientes WHERE nome = 'Maria Silva'),
    NOW() + INTERVAL '1 day',
    'consulta',
    'agendado',
    '550e8400-e29b-41d4-a716-446655440002'
),
(
    (SELECT id FROM clinica_kommuchat_pacientes WHERE nome = 'João Santos'),
    NOW() + INTERVAL '2 days',
    'retorno',
    'confirmado',
    '550e8400-e29b-41d4-a716-446655440002'
);

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clinica_kommuchat_pacientes_telefone ON clinica_kommuchat_pacientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clinica_kommuchat_pacientes_chat_id ON clinica_kommuchat_pacientes(chat_id);
CREATE INDEX IF NOT EXISTS idx_clinica_kommuchat_pacientes_status ON clinica_kommuchat_pacientes(status);

CREATE INDEX IF NOT EXISTS idx_clinica_kommuchat_agendamentos_paciente_id ON clinica_kommuchat_agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_clinica_kommuchat_agendamentos_data_hora ON clinica_kommuchat_agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_clinica_kommuchat_agendamentos_status ON clinica_kommuchat_agendamentos(status);

-- 9. Triggers para updated_at
CREATE TRIGGER update_clinica_kommuchat_pacientes_updated_at 
    BEFORE UPDATE ON clinica_kommuchat_pacientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinica_kommuchat_agendamentos_updated_at 
    BEFORE UPDATE ON clinica_kommuchat_agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Comentários
COMMENT ON TABLE clinica_kommuchat_pacientes IS 'Pacientes específicos da Clínica KommuChat Demo';
COMMENT ON TABLE clinica_kommuchat_agendamentos IS 'Agendamentos específicos da Clínica KommuChat Demo';

-- 11. Verificar se tudo foi criado corretamente
SELECT 'Cliente criado:' as status, nome, email FROM clientes WHERE id = '550e8400-e29b-41d4-a716-446655440001';
SELECT 'Usuário criado:' as status, nome, email, role FROM usuarios WHERE id = '550e8400-e29b-41d4-a716-446655440002';
SELECT 'Configurações criadas:' as status, COUNT(*) as total FROM configuracoes_cliente WHERE cliente_id = '550e8400-e29b-41d4-a716-446655440001';
SELECT 'Pacientes de exemplo:' as status, COUNT(*) as total FROM clinica_kommuchat_pacientes;
SELECT 'Agendamentos de exemplo:' as status, COUNT(*) as total FROM clinica_kommuchat_agendamentos;

