import { supabaseClientManager } from './supabase-client-manager';

// Usar cliente singleton para evitar múltiplas instâncias
export const supabase = supabaseClientManager.getMainClient();

console.log('🔍 Supabase Config - Client:', supabase ? 'Criado (singleton)' : 'Não disponível');

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
  status: 'novo' | 'followup' | 'topoucall' | 'atende_humano' | 'atendimentofinal'
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
