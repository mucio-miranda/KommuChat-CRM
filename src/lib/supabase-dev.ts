import { createClient } from '@supabase/supabase-js'

// Configuração para desenvolvimento local
const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
