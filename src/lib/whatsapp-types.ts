/**
 * Tipos para conversas do WhatsApp armazenadas na coluna JSON
 */

/**
 * Estrutura de uma interação no WhatsApp
 * Cada interação representa uma troca de mensagens (inbound + outbound)
 */
export interface WhatsAppInteraction {
  /** Nome do remetente da mensagem */
  from: string;
  /** Conteúdo das mensagens */
  message: {
    /** Mensagem enviada pelo cliente (entrada) */
    inbound: string | null;
    /** Resposta do agente IA (saída) */
    outbound: string | null;
  };
  /** Data e hora da mensagem em formato ISO 8601 */
  timestamp: string;
}

/**
 * Paciente com dados de WhatsApp
 * Extende os dados básicos do paciente com a coluna whatsapp
 */
export interface PatientWithWhatsApp {
  id: string | number;
  nome?: string;
  name?: string;
  telefone?: string;
  phone?: string;
  setdata?: string;
  whatsapp?: WhatsAppInteraction[] | string | null;
  /** Outros campos dinâmicos do paciente */
  [key: string]: any;
}

/**
 * Chat do WhatsApp para exibição na lista
 */
export interface WhatsAppChatPreview {
  /** ID do paciente */
  patientId: string | number;
  /** Nome do paciente/contato */
  name: string;
  /** Número de telefone */
  phone: string;
  /** Preview da última mensagem */
  lastMessagePreview: string;
  /** Timestamp da última mensagem */
  lastMessageTime: string;
  /** Total de mensagens no chat */
  messageCount: number;
}

/**
 * Mensagem individual para renderização no chat
 * Representa uma única mensagem (inbound OU outbound)
 */
export interface WhatsAppChatMessage {
  /** ID único da mensagem (gerado) */
  id: string;
  /** Se é mensagem de entrada (cliente) ou saída (agente) */
  type: 'inbound' | 'outbound';
  /** Conteúdo da mensagem */
  content: string;
  /** Nome do remetente */
  from: string;
  /** Timestamp da mensagem */
  timestamp: string;
  /** Timestamp formatado para exibição */
  formattedTime: string;
}

