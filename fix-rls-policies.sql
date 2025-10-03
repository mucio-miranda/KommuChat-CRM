-- Script para corrigir políticas RLS da tabela google_calendar_tokens
-- Execute este script no SQL Editor do Supabase CRM: https://wywzdtyjzzmcehrsalvn.supabase.co

-- 1. Verificar políticas existentes
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
WHERE tablename = 'google_calendar_tokens'
  AND schemaname = 'public';

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir todas as operações google_calendar_tokens" ON google_calendar_tokens;
DROP POLICY IF EXISTS "Enable read access for all users" ON google_calendar_tokens;
DROP POLICY IF EXISTS "Enable insert for all users" ON google_calendar_tokens;
DROP POLICY IF EXISTS "Enable update for all users" ON google_calendar_tokens;
DROP POLICY IF EXISTS "Enable delete for all users" ON google_calendar_tokens;

-- 3. Criar políticas permissivas para desenvolvimento
CREATE POLICY "Allow all operations google_calendar_tokens" ON google_calendar_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'google_calendar_tokens'
  AND schemaname = 'public';

-- 5. Se RLS não estiver habilitado, habilitar
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- 6. Verificar políticas finais
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'google_calendar_tokens'
  AND schemaname = 'public';

-- 7. Teste de busca que estava falhando
SELECT * FROM google_calendar_tokens WHERE user_id = 'fantom.weblabs@gmail.com';

-- 8. Inserir um token de teste para o usuário real
INSERT INTO google_calendar_tokens (
  user_id, 
  access_token, 
  token_type,
  expires_in,
  scope
) VALUES (
  'fantom.weblabs@gmail.com',
  'test_access_token_real_user',
  'Bearer',
  3600,
  'calendar.readonly calendar.events'
) ON CONFLICT (user_id) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  updated_at = NOW();

-- 9. Verificar se o token foi inserido
SELECT 
  user_id,
  token_type,
  expires_in,
  scope,
  created_at
FROM google_calendar_tokens
WHERE user_id = 'fantom.weblabs@gmail.com';

-- 10. Contagem final
SELECT COUNT(*) as total_registros FROM google_calendar_tokens;
