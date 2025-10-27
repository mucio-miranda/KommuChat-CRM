import { createClient } from '@supabase/supabase-js'

// Supabase para pacientes (APENAS LEITURA)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Supabase Config - URL:', supabaseUrl);
console.log('🔍 Supabase Config - Key:', supabaseAnonKey ? 'Presente' : 'Ausente');

// Criar cliente Supabase apenas se as credenciais estiverem configuradas
const isValidConfig = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key';

console.log('🔍 Supabase Config - isValid:', isValidConfig);

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log('🔍 Supabase Config - Client:', supabase);

// Tipos para o CRM KOMMUchat
export interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  tipo: 'clinica' | 'profissional'
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  email: string
  nome: string
  role: 'admin' | 'funcionario'
  cliente_id: string
  created_at: string
  updated_at: string
}

export interface Paciente {
  id: string
  nome: string
  telefone: string
  chat_id: string
  status: 'novo' | 'followup' | 'topoucall' | 'atendimentofinal' | 'cancelou_agendamento'
  cliente_id: string
  ultimo_contato: string
  created_at: string
  updated_at: string
}

export interface Conversa {
  id: string
  paciente_id: string
  mensagem: string
  tipo: 'entrada' | 'saida'
  timestamp: string
  cliente_id: string
  created_at: string
}

export interface Agendamento {
  id: string
  paciente_id: string
  data_hora: string
  tipo: 'consulta' | 'retorno' | 'exame'
  status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado'
  observacoes?: string
  cliente_id: string
  created_at: string
  updated_at: string
}
