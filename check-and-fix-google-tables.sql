-- Script para verificar e corrigir tabelas do Google Calendar
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. Verificar se as tabelas existem
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('google_credentials', 'google_calendar_tokens')
  AND schemaname = 'public';

-- 2. Verificar se as políticas existem
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('google_credentials', 'google_calendar_tokens')
  AND schemaname = 'public';

-- 3. Verificar RLS (Row Level Security)
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('google_credentials', 'google_calendar_tokens')
  AND schemaname = 'public';

-- 4. Se necessário, criar apenas as tabelas que não existem
DO $$
BEGIN
  -- Criar google_credentials se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_credentials') THEN
    CREATE TABLE google_credentials (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      cliente_id UUID NOT NULL,
      client_id TEXT NOT NULL,
      client_secret TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      calendar_id TEXT,
      configured BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(cliente_id)
    );
    RAISE NOTICE 'Tabela google_credentials criada';
  ELSE
    RAISE NOTICE 'Tabela google_credentials já existe';
  END IF;

  -- Criar google_calendar_tokens se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_calendar_tokens') THEN
    CREATE TABLE google_calendar_tokens (
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
    RAISE NOTICE 'Tabela google_calendar_tokens criada';
  ELSE
    RAISE NOTICE 'Tabela google_calendar_tokens já existe';
  END IF;
END $$;

-- 5. Habilitar RLS se não estiver habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'google_credentials' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE google_credentials ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado para google_credentials';
  ELSE
    RAISE NOTICE 'RLS já habilitado para google_credentials';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'google_calendar_tokens' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado para google_calendar_tokens';
  ELSE
    RAISE NOTICE 'RLS já habilitado para google_calendar_tokens';
  END IF;
END $$;

-- 6. Criar políticas apenas se não existirem
DO $$
BEGIN
  -- Política para google_credentials
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_credentials' 
    AND policyname = 'Permitir todas as operações google_credentials'
  ) THEN
    CREATE POLICY "Permitir todas as operações google_credentials" ON google_credentials
      FOR ALL USING (true) WITH CHECK (true);
    RAISE NOTICE 'Política criada para google_credentials';
  ELSE
    RAISE NOTICE 'Política já existe para google_credentials';
  END IF;

  -- Política para google_calendar_tokens
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_calendar_tokens' 
    AND policyname = 'Permitir todas as operações google_calendar_tokens'
  ) THEN
    CREATE POLICY "Permitir todas as operações google_calendar_tokens" ON google_calendar_tokens
      FOR ALL USING (true) WITH CHECK (true);
    RAISE NOTICE 'Política criada para google_calendar_tokens';
  ELSE
    RAISE NOTICE 'Política já existe para google_calendar_tokens';
  END IF;
END $$;

-- 7. Verificação final
SELECT 
  'google_credentials' as tabela,
  COUNT(*) as registros,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'google_credentials') as rls_habilitado,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'google_credentials') as politicas
FROM google_credentials
UNION ALL
SELECT 
  'google_calendar_tokens' as tabela,
  COUNT(*) as registros,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'google_calendar_tokens') as rls_habilitado,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'google_calendar_tokens') as politicas
FROM google_calendar_tokens;

-- 8. Teste de inserção (opcional - remova se não quiser dados de teste)
-- INSERT INTO google_calendar_tokens (user_id, access_token, token_type) 
-- VALUES ('test@example.com', 'test_token', 'Bearer')
-- ON CONFLICT (user_id) DO NOTHING;
