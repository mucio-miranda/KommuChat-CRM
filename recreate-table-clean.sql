-- Recriar tabela pacientes_manuais do zero
-- Execute este SQL no painel do Supabase

-- 1. APAGAR tabela existente (se existir)
DROP TABLE IF EXISTS pacientes_manuais CASCADE;

-- 2. CRIAR tabela nova
CREATE TABLE pacientes_manuais (
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

-- 3. HABILITAR RLS
ALTER TABLE pacientes_manuais ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR políticas RLS (mais permissivas para inserção)
-- Política permissiva para inserção
CREATE POLICY "Allow insert with valid client_id" ON pacientes_manuais
    FOR INSERT WITH CHECK (cliente_id IS NOT NULL);

-- Políticas restritivas para outras operações
CREATE POLICY "Users can view their own manual patients" ON pacientes_manuais
    FOR SELECT USING (auth.uid() = cliente_id);

CREATE POLICY "Users can update their own manual patients" ON pacientes_manuais
    FOR UPDATE USING (auth.uid() = cliente_id);

CREATE POLICY "Users can delete their own manual patients" ON pacientes_manuais
    FOR DELETE USING (auth.uid() = cliente_id);

-- 5. CRIAR função para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. CRIAR trigger para updated_at
CREATE TRIGGER update_pacientes_manuais_updated_at 
    BEFORE UPDATE ON pacientes_manuais 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. CRIAR índices para performance
CREATE INDEX idx_pacientes_manuais_cliente_id ON pacientes_manuais(cliente_id);
CREATE INDEX idx_pacientes_manuais_status ON pacientes_manuais(status);
CREATE INDEX idx_pacientes_manuais_created_at ON pacientes_manuais(created_at);

-- 8. VERIFICAR se tudo foi criado corretamente
SELECT 'Tabela recriada com sucesso!' as resultado;

-- 9. MOSTRAR estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pacientes_manuais'
ORDER BY ordinal_position;

-- 10. MOSTRAR políticas criadas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pacientes_manuais'
ORDER BY policyname;





