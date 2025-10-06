-- Verificar a constraint de role na tabela usuarios
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'usuarios'::regclass 
AND conname LIKE '%role%';

-- Verificar os valores permitidos na constraint
SELECT 
    conname,
    pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'usuarios'::regclass 
AND contype = 'c';






