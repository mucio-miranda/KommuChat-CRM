-- Corrigir o role do usuário admin-nutrivida
UPDATE usuarios 
SET role = 'admin_clinica' 
WHERE username = 'admin-nutrivida';

-- Verificar se foi alterado
SELECT id, username, nome, email, role, ativo 
FROM usuarios 
WHERE username = 'admin-nutrivida';






