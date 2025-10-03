-- Função para criar tabelas específicas por cliente
-- Esta função será chamada quando um novo cliente for criado

CREATE OR REPLACE FUNCTION create_cliente_tables(
    cliente_id UUID,
    table_prefix TEXT
)
RETURNS VOID AS $$
DECLARE
    pacientes_table_name TEXT;
    agendamentos_table_name TEXT;
    conversas_table_name TEXT;
BEGIN
    -- Definir nomes das tabelas
    pacientes_table_name := table_prefix || '_pacientes';
    agendamentos_table_name := table_prefix || '_agendamentos';
    conversas_table_name := table_prefix || '_conversas';
    
    -- Criar tabela de pacientes específica
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(255) NOT NULL,
            telefone VARCHAR(20) NOT NULL,
            chat_id VARCHAR(50) UNIQUE,
            email VARCHAR(255),
            data_nascimento DATE,
            genero VARCHAR(10),
            status VARCHAR(20) CHECK (status IN (''novo'', ''followup'', ''topoucall'', ''atende_humano'', ''atendimentofinal'')) DEFAULT ''novo'',
            ultimo_contato TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            observacoes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', pacientes_table_name);
    
    -- Criar tabela de agendamentos específica
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            paciente_id UUID REFERENCES %I(id) ON DELETE CASCADE,
            data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
            tipo VARCHAR(20) CHECK (tipo IN (''consulta'', ''retorno'', ''exame'', ''procedimento'')) NOT NULL,
            status VARCHAR(20) CHECK (status IN (''agendado'', ''confirmado'', ''cancelado'', ''realizado'', ''remarcado'')) DEFAULT ''agendado'',
            observacoes TEXT,
            funcionario_id UUID REFERENCES usuarios(id),
            duracao_minutos INTEGER DEFAULT 60,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', agendamentos_table_name, pacientes_table_name);
    
    -- Criar tabela de conversas específica
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            paciente_id UUID REFERENCES %I(id) ON DELETE CASCADE,
            mensagem TEXT NOT NULL,
            tipo VARCHAR(10) CHECK (tipo IN (''entrada'', ''saida'')) NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            status VARCHAR(20) DEFAULT ''enviada'',
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', conversas_table_name, pacientes_table_name);
    
    -- Criar índices para performance
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_telefone ON %I(telefone)', 
                   table_prefix || '_pacientes_telefone', pacientes_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_chat_id ON %I(chat_id)', 
                   table_prefix || '_pacientes_chat_id', pacientes_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_status ON %I(status)', 
                   table_prefix || '_pacientes_status', pacientes_table_name);
    
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_paciente_id ON %I(paciente_id)', 
                   table_prefix || '_agendamentos_paciente_id', agendamentos_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_data_hora ON %I(data_hora)', 
                   table_prefix || '_agendamentos_data_hora', agendamentos_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_status ON %I(status)', 
                   table_prefix || '_agendamentos_status', agendamentos_table_name);
    
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_paciente_id ON %I(paciente_id)', 
                   table_prefix || '_conversas_paciente_id', conversas_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_timestamp ON %I(timestamp)', 
                   table_prefix || '_conversas_timestamp', conversas_table_name);
    
    -- Criar triggers para updated_at
    EXECUTE format('
        CREATE TRIGGER update_%s_updated_at 
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        table_prefix || '_pacientes_updated_at', pacientes_table_name);
    
    EXECUTE format('
        CREATE TRIGGER update_%s_updated_at 
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        table_prefix || '_agendamentos_updated_at', agendamentos_table_name);
    
    -- Adicionar comentários
    EXECUTE format('COMMENT ON TABLE %I IS ''Pacientes específicos do cliente %s''', 
                   pacientes_table_name, cliente_id);
    EXECUTE format('COMMENT ON TABLE %I IS ''Agendamentos específicos do cliente %s''', 
                   agendamentos_table_name, cliente_id);
    EXECUTE format('COMMENT ON TABLE %I IS ''Conversas específicas do cliente %s''', 
                   conversas_table_name, cliente_id);
    
    -- Log de sucesso
    RAISE NOTICE 'Tabelas criadas para cliente %: %, %, %', 
                 cliente_id, pacientes_table_name, agendamentos_table_name, conversas_table_name;
    
END;
$$ LANGUAGE plpgsql;

-- Função para obter nome da tabela de pacientes de um cliente
CREATE OR REPLACE FUNCTION get_cliente_pacientes_table(cliente_id UUID)
RETURNS TEXT AS $$
DECLARE
    table_name TEXT;
BEGIN
    -- Buscar o nome da tabela baseado no ID do cliente
    SELECT 'clinica_' || replace(cliente_id::text, '-', '_') || '_pacientes'
    INTO table_name;
    
    RETURN table_name;
END;
$$ LANGUAGE plpgsql;

-- Função para obter nome da tabela de agendamentos de um cliente
CREATE OR REPLACE FUNCTION get_cliente_agendamentos_table(cliente_id UUID)
RETURNS TEXT AS $$
DECLARE
    table_name TEXT;
BEGIN
    -- Buscar o nome da tabela baseado no ID do cliente
    SELECT 'clinica_' || replace(cliente_id::text, '-', '_') || '_agendamentos'
    INTO table_name;
    
    RETURN table_name;
END;
$$ LANGUAGE plpgsql;

-- Função para obter nome da tabela de conversas de um cliente
CREATE OR REPLACE FUNCTION get_cliente_conversas_table(cliente_id UUID)
RETURNS TEXT AS $$
DECLARE
    table_name TEXT;
BEGIN
    -- Buscar o nome da tabela baseado no ID do cliente
    SELECT 'clinica_' || replace(cliente_id::text, '-', '_') || '_conversas'
    INTO table_name;
    
    RETURN table_name;
END;
$$ LANGUAGE plpgsql;

-- Função para listar todas as tabelas de um cliente
CREATE OR REPLACE FUNCTION list_cliente_tables(cliente_id UUID)
RETURNS TABLE(
    table_name TEXT,
    table_type TEXT
) AS $$
DECLARE
    table_prefix TEXT;
BEGIN
    table_prefix := 'clinica_' || replace(cliente_id::text, '-', '_');
    
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        CASE 
            WHEN t.table_name LIKE '%_pacientes' THEN 'pacientes'
            WHEN t.table_name LIKE '%_agendamentos' THEN 'agendamentos'
            WHEN t.table_name LIKE '%_conversas' THEN 'conversas'
            ELSE 'outros'
        END::TEXT as table_type
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_name LIKE table_prefix || '%'
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso:
-- SELECT create_cliente_tables('550e8400-e29b-41d4-a716-446655440001', 'clinica_550e8400_e29b_41d4_a716_446655440001');
-- SELECT list_cliente_tables('550e8400-e29b-41d4-a716-446655440001');

