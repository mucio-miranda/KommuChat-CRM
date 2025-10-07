import { supabase } from '@/lib/supabase'
import { supabaseCrm } from '@/lib/supabase-crm'
import { useAuth } from '@/contexts/AuthContext'

export function useSupabase() {
  const { isVisitor, user } = useAuth()
  
  
  // Para LEITURA de dados (pacientes, contatos) - sempre KommuChat
  // Para ESCRITA de dados (usuários, clientes) - sempre CRM
  // Para CONFIGURAÇÕES - sempre CRM
  
  return {
    // Para LEITURA de dados (pacientes, contatos) - sempre KommuChat
    read: supabase,
    // Para ESCRITA de dados (usuários, clientes) - sempre CRM
    write: supabaseCrm,
    // Para CONFIGURAÇÕES (tabela selecionada) - sempre CRM
    config: supabaseCrm
  };
}
