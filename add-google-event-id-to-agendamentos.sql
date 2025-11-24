-- Script para criar tabela agendamentos com suporte ao Google Calendar
-- Execute este SQL no Supabase Dashboard > SQL Editor do projeto CRM
-- Este script cria a tabela agendamentos focada em eventos do calendário Google

-- 1. Criar tabela de agendamentos (se não existir)
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('consulta', 'retorno', 'exame', 'procedimento')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado', 'remarcado')) DEFAULT 'agendado',
    observacoes TEXT,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    funcionario_id UUID REFERENCES public.usuarios(id),
    duracao_minutos INTEGER DEFAULT 60,
    google_event_id TEXT, -- Campo para sincronização com Google Calendar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_id ON public.agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON public.agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_google_event_id ON public.agendamentos(google_event_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_funcionario_id ON public.agendamentos(funcionario_id);

-- 3. Adicionar comentários
COMMENT ON TABLE public.agendamentos IS 'Tabela de agendamentos de eventos do Google Calendar no CRM';
COMMENT ON COLUMN public.agendamentos.google_event_id IS 'ID do evento no Google Calendar para sincronização';

-- 4. Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 5. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_agendamentos_updated_at ON public.agendamentos;
CREATE TRIGGER update_agendamentos_updated_at 
    BEFORE UPDATE ON public.agendamentos
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Habilitar Row Level Security (RLS)
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- 7. Política RLS: Usuários veem apenas agendamentos da sua clínica
DROP POLICY IF EXISTS "Usuários veem apenas agendamentos da sua clínica" ON public.agendamentos;
CREATE POLICY "Usuários veem apenas agendamentos da sua clínica" 
    ON public.agendamentos
    FOR ALL 
    USING (
        cliente_id IN (
            SELECT cliente_id 
            FROM public.usuarios 
            WHERE auth_user_id = auth.uid()
        )
    );

