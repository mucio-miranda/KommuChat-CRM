-- Criar tabela para armazenar QR codes do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL,
    qr_code_image TEXT, -- Base64 da imagem PNG
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanned', 'connected', 'expired')),
    phone_number TEXT,
    user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_codes_cliente_id ON whatsapp_qr_codes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_codes_status ON whatsapp_qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_codes_expires_at ON whatsapp_qr_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_codes_created_at ON whatsapp_qr_codes(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_whatsapp_qr_codes_updated_at
    BEFORE UPDATE ON whatsapp_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_qr_codes_updated_at();

-- Política RLS para permitir acesso apenas ao próprio cliente
ALTER TABLE whatsapp_qr_codes ENABLE ROW LEVEL SECURITY;

-- Política para clientes acessarem apenas seus próprios QR codes
CREATE POLICY "Clientes podem ver apenas seus próprios QR codes" ON whatsapp_qr_codes
    FOR ALL USING (
        cliente_id IN (
            SELECT c.id FROM clientes c
            WHERE c.id = cliente_id
        )
    );

-- Política para usuários acessarem QR codes do seu cliente
CREATE POLICY "Usuários podem ver QR codes do seu cliente" ON whatsapp_qr_codes
    FOR ALL USING (
        cliente_id IN (
            SELECT u.cliente_id FROM usuarios u
            WHERE u.id = auth.uid()::text
        )
    );

-- Comentários para documentação
COMMENT ON TABLE whatsapp_qr_codes IS 'Armazena QR codes do WhatsApp para conexão';
COMMENT ON COLUMN whatsapp_qr_codes.qr_code_data IS 'Dados do QR code em formato string';
COMMENT ON COLUMN whatsapp_qr_codes.qr_code_image IS 'Imagem do QR code em base64 (PNG)';
COMMENT ON COLUMN whatsapp_qr_codes.status IS 'Status da conexão: pending, scanned, connected, expired';
COMMENT ON COLUMN whatsapp_qr_codes.expires_at IS 'Data de expiração do QR code (geralmente 5 minutos)';

