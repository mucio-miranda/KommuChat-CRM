-- Configuração do Supabase Storage para arquivos .env dos clientes

-- 1. Criar bucket para configurações dos clientes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-configs',
  'client-configs',
  false, -- Não público por segurança
  1048576, -- 1MB limite
  ARRAY['text/plain', 'application/octet-stream']
) ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas RLS para o bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política para permitir upload apenas para super admins
CREATE POLICY "Apenas super admins podem fazer upload de configs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-configs' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'super_admin'
      AND ativo = true
    )
  );

-- Política para permitir download apenas para super admins
CREATE POLICY "Apenas super admins podem baixar configs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-configs' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'super_admin'
      AND ativo = true
    )
  );

-- Política para permitir update apenas para super admins
CREATE POLICY "Apenas super admins podem atualizar configs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'client-configs' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'super_admin'
      AND ativo = true
    )
  );

-- Política para permitir delete apenas para super admins
CREATE POLICY "Apenas super admins podem deletar configs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'client-configs' AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'super_admin'
      AND ativo = true
    )
  );

-- 3. Criar função para limpar arquivos antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_client_configs()
RETURNS void AS $$
BEGIN
  -- Remove arquivos .env mais antigos que 30 dias
  DELETE FROM storage.objects 
  WHERE bucket_id = 'client-configs' 
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 4. Criar função para listar arquivos de um cliente
CREATE OR REPLACE FUNCTION list_client_config_files(p_cliente_id TEXT)
RETURNS TABLE (
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.name as file_name,
    o.name as file_path,
    o.metadata->>'size'::BIGINT as file_size,
    o.created_at,
    o.updated_at
  FROM storage.objects o
  WHERE o.bucket_id = 'client-configs'
  AND o.name LIKE 'cliente-' || p_cliente_id || '-%'
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Comentários para documentação
COMMENT ON FUNCTION cleanup_old_client_configs() IS 'Remove arquivos .env antigos do storage';
COMMENT ON FUNCTION list_client_config_files(TEXT) IS 'Lista arquivos de configuração de um cliente específico';
