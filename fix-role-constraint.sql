-- Remover a constraint antiga
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_role_check;

-- Adicionar nova constraint que permite admin_clinica
ALTER TABLE usuarios ADD CONSTRAINT usuarios_role_check 
CHECK (role IN ('super_admin', 'admin_clinica', 'funcionario'));

-- Verificar se foi aplicada
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'usuarios'::regclass 
AND conname = 'usuarios_role_check';


