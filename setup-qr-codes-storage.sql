-- Configurar bucket para QR codes no Supabase Storage
-- Este script deve ser executado no Supabase Dashboard > Storage

-- 1. Criar bucket para QR codes (execute no Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'qr-codes',
--   'qr-codes',
--   true, -- Público para facilitar acesso
--   5242880, -- 5MB limite
--   ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
-- );

-- 2. Políticas de acesso para o bucket qr-codes

-- Política para permitir upload de QR codes (apenas para usuários autenticados)
CREATE POLICY "Allow authenticated users to upload QR codes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'qr-codes' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'cliente-' || auth.uid()::text
);

-- Política para permitir visualização pública dos QR codes
CREATE POLICY "Allow public access to QR codes" ON storage.objects
FOR SELECT USING (bucket_id = 'qr-codes');

-- Política para permitir atualização de QR codes (apenas do próprio cliente)
CREATE POLICY "Allow users to update their own QR codes" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'qr-codes' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'cliente-' || auth.uid()::text
);

-- Política para permitir exclusão de QR codes (apenas do próprio cliente)
CREATE POLICY "Allow users to delete their own QR codes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'qr-codes' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'cliente-' || auth.uid()::text
);

-- 3. Função para limpar QR codes expirados (opcional)
CREATE OR REPLACE FUNCTION cleanup_expired_qr_codes()
RETURNS void AS $$
BEGIN
  -- Deletar registros de QR codes expirados
  DELETE FROM whatsapp_qr_codes 
  WHERE expires_at < NOW() 
  AND status IN ('pending', 'expired');
  
  -- Log da limpeza
  RAISE NOTICE 'QR codes expirados removidos: %', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- 4. Função para obter URL pública do QR code
CREATE OR REPLACE FUNCTION get_qr_code_public_url(cliente_id_param UUID, file_name_param TEXT)
RETURNS TEXT AS $$
DECLARE
  public_url TEXT;
BEGIN
  -- Construir o caminho do arquivo
  SELECT INTO public_url
    'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/qr-codes/cliente-' || cliente_id_param::text || '/' || file_name_param;
  
  RETURN public_url;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para salvar QR code com upload automático
CREATE OR REPLACE FUNCTION save_qr_code_with_upload(
  cliente_id_param UUID,
  file_name_param TEXT,
  file_size_param INTEGER,
  mime_type_param TEXT,
  qr_code_data_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  qr_code_id UUID;
  public_url TEXT;
BEGIN
  -- Gerar URL pública
  public_url := get_qr_code_public_url(cliente_id_param, file_name_param);
  
  -- Inserir registro na tabela
  INSERT INTO whatsapp_qr_codes (
    cliente_id,
    qr_code_data,
    qr_code_image_url,
    file_name,
    file_size,
    mime_type,
    status,
    expires_at
  ) VALUES (
    cliente_id_param,
    qr_code_data_param,
    public_url,
    file_name_param,
    file_size_param,
    mime_type_param,
    'pending',
    NOW() + INTERVAL '5 minutes' -- QR code expira em 5 minutos
  ) RETURNING id INTO qr_code_id;
  
  RETURN qr_code_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Comentários para documentação
COMMENT ON FUNCTION cleanup_expired_qr_codes() IS 'Remove QR codes expirados da tabela';
COMMENT ON FUNCTION get_qr_code_public_url(UUID, TEXT) IS 'Retorna URL pública para acessar QR code no storage';
COMMENT ON FUNCTION save_qr_code_with_upload(UUID, TEXT, INTEGER, TEXT, TEXT) IS 'Salva QR code na tabela com metadados do arquivo';

-- 7. Exemplo de uso (comentado):
-- SELECT save_qr_code_with_upload(
--   'cliente-uuid-here',
--   'qr_code_123.png',
--   1024,
--   'image/png',
--   'QR_CODE_DATA_HERE'
-- );


