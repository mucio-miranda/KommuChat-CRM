-- Verificar a estrutura da tabela usuarios
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se existem registros na tabela usuarios
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- Verificar os últimos usuários criados
SELECT id, username, email, nome, role, cliente_id, ativo, created_at 
FROM usuarios 
ORDER BY created_at DESC 
LIMIT 5;


