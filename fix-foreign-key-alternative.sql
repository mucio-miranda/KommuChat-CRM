-- Alternativa: Manter foreign key mas permitir inserções
-- Execute este SQL no painel do Supabase

-- Opção 1: Remover foreign key constraint (mais simples)
ALTER TABLE pacientes_manuais DROP CONSTRAINT IF EXISTS pacientes_manuais_cliente_id_fkey;

-- Opção 2: Se quiser manter a foreign key, criar uma referência válida
-- (Descomente as linhas abaixo se quiser usar esta opção)

-- -- Criar um usuário fictício na tabela auth.users (se necessário)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--     '3b5bc943-7643-48ce-bc2d-168ab72c5d02',
--     'usuario@teste.com',
--     '$2a$10$dummy.hash.for.testing',
--     NOW(),
--     NOW(),
--     NOW()
-- ) ON CONFLICT (id) DO NOTHING;

-- -- Ou criar uma referência na tabela usuarios (se existir)
-- INSERT INTO usuarios (id, email, cliente_id, created_at, updated_at)
-- VALUES (
--     '3b5bc943-7643-48ce-bc2d-168ab72c5d02',
--     'usuario@teste.com',
--     '3b5bc943-7643-48ce-bc2d-168ab72c5d02',
--     NOW(),
--     NOW()
-- ) ON CONFLICT (id) DO NOTHING;

SELECT 'Foreign key constraint removida! Agora você pode inserir pacientes.' as resultado;





