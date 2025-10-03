-- Setup do Storage para QR Codes do WhatsApp
-- Este script cria o bucket e configura as políticas de acesso

-- 1. Criar bucket para QR codes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'qr-codes',
    'qr-codes',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 2. Política para permitir upload de QR codes (apenas usuários autenticados)
CREATE POLICY "Usuários autenticados podem fazer upload de QR codes" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'qr-codes' 
    AND auth.role() = 'authenticated'
);

-- 3. Política para permitir visualização pública dos QR codes
CREATE POLICY "QR codes são públicos para visualização" ON storage.objects
FOR SELECT USING (bucket_id = 'qr-codes');

-- 4. Política para permitir atualização de QR codes (apenas o proprietário)
CREATE POLICY "Usuários podem atualizar seus próprios QR codes" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'qr-codes' 
    AND auth.role() = 'authenticated'
);

-- 5. Política para permitir exclusão de QR codes (apenas o proprietário)
CREATE POLICY "Usuários podem excluir seus próprios QR codes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'qr-codes' 
    AND auth.role() = 'authenticated'
);

-- 6. Função para obter URL pública do QR code de um cliente
CREATE OR REPLACE FUNCTION get_cliente_qr_code_url(cliente_id UUID)
RETURNS TEXT AS $$
DECLARE
    qr_code_url TEXT;
BEGIN
    -- Buscar URL do QR code nas configurações
    SELECT valor INTO qr_code_url
    FROM configuracoes_cliente
    WHERE cliente_id = get_cliente_qr_code_url.cliente_id
    AND chave = 'whatsapp_qr_code_url';
    
    RETURN COALESCE(qr_code_url, '');
END;
$$ LANGUAGE plpgsql;

-- 7. Função para atualizar URL do QR code de um cliente
CREATE OR REPLACE FUNCTION update_cliente_qr_code_url(
    cliente_id UUID,
    qr_code_url TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Atualizar ou inserir configuração do QR code
    INSERT INTO configuracoes_cliente (cliente_id, chave, valor, tipo)
    VALUES (cliente_id, 'whatsapp_qr_code_url', qr_code_url, 'string')
    ON CONFLICT (cliente_id, chave)
    DO UPDATE SET 
        valor = EXCLUDED.valor,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Função para listar QR codes de um cliente
CREATE OR REPLACE FUNCTION list_cliente_qr_codes(cliente_id UUID)
RETURNS TABLE(
    file_name TEXT,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    public_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.name::TEXT,
        o.metadata->>'size'::BIGINT,
        o.created_at,
        CONCAT(
            'https://',
            (SELECT value FROM storage.buckets WHERE id = 'qr-codes'),
            '.supabase.co/storage/v1/object/public/qr-codes/',
            o.name
        )::TEXT as public_url
    FROM storage.objects o
    WHERE o.bucket_id = 'qr-codes'
    AND o.name LIKE 'qr_code_' || cliente_id || '%'
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Comentários
COMMENT ON FUNCTION get_cliente_qr_code_url(UUID) IS 'Retorna a URL do QR code de um cliente';
COMMENT ON FUNCTION update_cliente_qr_code_url(UUID, TEXT) IS 'Atualiza a URL do QR code de um cliente';
COMMENT ON FUNCTION list_cliente_qr_codes(UUID) IS 'Lista todos os QR codes de um cliente';

-- 10. Exemplo de uso:
-- SELECT get_cliente_qr_code_url('550e8400-e29b-41d4-a716-446655440001');
-- SELECT update_cliente_qr_code_url('550e8400-e29b-41d4-a716-446655440001', 'https://example.com/qr.png');
-- SELECT list_cliente_qr_codes('550e8400-e29b-41d4-a716-446655440001');

