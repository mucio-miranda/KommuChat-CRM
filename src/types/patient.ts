// Interface compartilhada para dados de pacientes
export interface Patient {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  chatid?: string;
  status: string;
  setdata?: string;
  followup?: string;
  follow?: string;
  topoucall?: string;
  atendimentofinal?: string;
  atende_humano?: string;
  data_agendamento?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  fonte: 'ia' | 'humano'; // Fonte dos dados: IA ou Humano
}

// Tipo para informações de paciente associado a evento
export interface EventPatientMetadata {
  patientId: number;
  patientSource: 'ia' | 'humano';
  patientName: string;
}





