-- Criar tabela para pacientes adicionados manualmente
-- Esta tabela será usada para armazenar pacientes criados pelo usuário
-- no projeto CRM-KommuChat

CREATE TABLE IF NOT EXISTS pacientes_manuais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'novo',
    observacoes TEXT,
    cliente_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE pacientes_manuais ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios pacientes
CREATE POLICY "Users can view their own manual patients" ON pacientes_manuais
    FOR SELECT USING (auth.uid() = cliente_id);

-- Política para permitir que usuários insiram seus próprios pacientes
CREATE POLICY "Users can insert their own manual patients" ON pacientes_manuais
    FOR INSERT WITH CHECK (auth.uid() = cliente_id);

-- Política para permitir que usuários atualizem seus próprios pacientes
CREATE POLICY "Users can update their own manual patients" ON pacientes_manuais
    FOR UPDATE USING (auth.uid() = cliente_id);

-- Política para permitir que usuários deletem seus próprios pacientes
CREATE POLICY "Users can delete their own manual patients" ON pacientes_manuais
    FOR DELETE USING (auth.uid() = cliente_id);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_pacientes_manuais_updated_at 
    BEFORE UPDATE ON pacientes_manuais 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pacientes_manuais_cliente_id ON pacientes_manuais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_manuais_status ON pacientes_manuais(status);
CREATE INDEX IF NOT EXISTS idx_pacientes_manuais_created_at ON pacientes_manuais(created_at);

-- Comentários para documentação
COMMENT ON TABLE pacientes_manuais IS 'Tabela para pacientes adicionados manualmente pelos usuários';
COMMENT ON COLUMN pacientes_manuais.nome IS 'Nome completo do paciente';
COMMENT ON COLUMN pacientes_manuais.email IS 'Email de contato do paciente';
COMMENT ON COLUMN pacientes_manuais.telefone IS 'Telefone de contato do paciente';
COMMENT ON COLUMN pacientes_manuais.status IS 'Status atual do paciente (novo, followup, atende_humano, topoucall, atendimentofinal)';
COMMENT ON COLUMN pacientes_manuais.observacoes IS 'Observações adicionais sobre o paciente';
COMMENT ON COLUMN pacientes_manuais.cliente_id IS 'ID do usuário que criou o paciente';






