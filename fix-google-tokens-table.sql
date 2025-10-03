-- Script específico para corrigir a tabela google_calendar_tokens
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. Verificar se a tabela existe
SELECT 
  'google_calendar_tokens' as tabela,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_calendar_tokens') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as status;

-- 2. Criar a tabela se não existir
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_in INTEGER,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir todas as operações google_calendar_tokens" ON google_calendar_tokens;

-- 5. Criar nova política permissiva
CREATE POLICY "Permitir todas as operações google_calendar_tokens" ON google_calendar_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'google_calendar_tokens'
  AND schemaname = 'public';

-- 7. Verificar políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'google_calendar_tokens'
  AND schemaname = 'public';

-- 8. Teste de inserção
INSERT INTO google_calendar_tokens (user_id, access_token, token_type) 
VALUES ('test@example.com', 'test_token', 'Bearer')
ON CONFLICT (user_id) DO NOTHING;

-- 9. Verificar contagem final
SELECT 
  'google_calendar_tokens' as tabela,
  COUNT(*) as registros
FROM google_calendar_tokens;
