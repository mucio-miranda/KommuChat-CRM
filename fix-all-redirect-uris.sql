-- Script para corrigir todas as redirect URIs para a porta correta (8080)
-- Execute este script no SQL Editor do Supabase CRM

-- 1. Verificar URIs atuais
SELECT 
    id,
    cliente_id,
    redirect_uri,
    created_at
FROM google_credentials 
ORDER BY created_at DESC;

-- 2. Atualizar todas as URIs para usar a porta 8080
UPDATE google_credentials 
SET redirect_uri = 'http://localhost:8080/auth/google/callback'
WHERE redirect_uri != 'http://localhost:8080/auth/google/callback';

-- 3. Verificar se a atualização funcionou
SELECT 
    id,
    cliente_id,
    redirect_uri,
    created_at,
    'Atualizado' as status
FROM google_credentials 
ORDER BY created_at DESC;

-- 4. Contar quantas foram atualizadas
SELECT 
    COUNT(*) as total_credentials,
    COUNT(CASE WHEN redirect_uri = 'http://localhost:8080/auth/google/callback' THEN 1 END) as correct_uri,
    COUNT(CASE WHEN redirect_uri != 'http://localhost:8080/auth/google/callback' THEN 1 END) as incorrect_uri
FROM google_credentials;






