/**
 * Funções utilitárias para manipular conversas do WhatsApp
 */

import { 
  WhatsAppInteraction, 
  WhatsAppChatMessage, 
  WhatsAppChatPreview,
  PatientWithWhatsApp 
} from './whatsapp-types';

/**
 * Parseia os dados da coluna whatsapp do banco de dados
 * Trata casos de null, string vazia, ou JSON inválido
 */
export function parseWhatsAppMessages(jsonData: any): WhatsAppInteraction[] {
  // Se for null ou undefined, retorna array vazio
  if (jsonData === null || jsonData === undefined) {
    return [];
  }

  // Se for string, tenta parsear como JSON
  if (typeof jsonData === 'string') {
    if (jsonData.trim() === '' || jsonData.trim() === '[]') {
      return [];
    }
    
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (error) {
      console.error('Erro ao parsear JSON do WhatsApp:', error);
      return [];
    }
  }

  // Se já for um array, retorna direto
  if (Array.isArray(jsonData)) {
    return jsonData;
  }

  // Qualquer outro caso, retorna array vazio
  return [];
}

/**
 * Ordena mensagens por timestamp (do mais antigo para o mais recente)
 */
export function sortMessagesByTimestamp(messages: WhatsAppInteraction[]): WhatsAppInteraction[] {
  return [...messages].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateA - dateB;
  });
}

/**
 * Formata timestamp ISO para exibição legível
 * Exemplo: "16:36" ou "23/01 16:36" se for de outro dia
 */
export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Se for hoje, mostra apenas a hora
    if (messageDate.getTime() === today.getTime()) {
      return timeStr;
    }

    // Se for de outro dia, mostra data e hora
    const dateStr = date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });

    return `${dateStr} ${timeStr}`;
  } catch (error) {
    return 'Hora inválida';
  }
}

/**
 * Formata timestamp para exibição completa
 */
export function formatFullTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Data inválida';
  }
}

/**
 * Verifica se a interação tem mensagem do cliente (inbound)
 */
export function hasInboundMessage(interaction: WhatsAppInteraction): boolean {
  return !!interaction.message?.inbound && interaction.message.inbound.trim() !== '';
}

/**
 * Verifica se a interação tem resposta do agente (outbound)
 */
export function hasOutboundMessage(interaction: WhatsAppInteraction): boolean {
  return !!interaction.message?.outbound && interaction.message.outbound.trim() !== '';
}

/**
 * Converte interações em mensagens individuais para renderização
 * Cada interação pode gerar 1 ou 2 mensagens (inbound e/ou outbound)
 */
export function interactionsToMessages(interactions: WhatsAppInteraction[]): WhatsAppChatMessage[] {
  const messages: WhatsAppChatMessage[] = [];

  const sorted = sortMessagesByTimestamp(interactions);

  sorted.forEach((interaction, index) => {
    // Adiciona mensagem inbound (do cliente) se existir
    if (hasInboundMessage(interaction)) {
      messages.push({
        id: `${index}-inbound`,
        type: 'inbound',
        content: interaction.message.inbound!,
        from: interaction.from,
        timestamp: interaction.timestamp,
        formattedTime: formatTimestamp(interaction.timestamp)
      });
    }

    // Adiciona mensagem outbound (do agente ou atendimento humano) se existir
    if (hasOutboundMessage(interaction)) {
      messages.push({
        id: `${index}-outbound`,
        type: 'outbound',
        content: interaction.message.outbound!,
        from: interaction.from || 'Agente IA', // Usa o from do JSON, fallback para "Agente IA"
        timestamp: interaction.timestamp,
        formattedTime: formatTimestamp(interaction.timestamp)
      });
    }
  });

  return messages;
}

/**
 * Obtém preview da última mensagem para exibição na lista de chats
 */
export function getLastMessagePreview(interactions: WhatsAppInteraction[]): string {
  if (interactions.length === 0) {
    return 'Nenhuma mensagem';
  }

  const sorted = sortMessagesByTimestamp(interactions);
  const lastInteraction = sorted[sorted.length - 1];

  // Prioriza outbound (resposta) se existir, senão usa inbound
  if (hasOutboundMessage(lastInteraction)) {
    const preview = lastInteraction.message.outbound!;
    return preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
  }

  if (hasInboundMessage(lastInteraction)) {
    const preview = lastInteraction.message.inbound!;
    return preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
  }

  return 'Mensagem vazia';
}

/**
 * Obtém timestamp da última mensagem
 */
export function getLastMessageTimestamp(interactions: WhatsAppInteraction[]): string {
  if (interactions.length === 0) {
    return '';
  }

  const sorted = sortMessagesByTimestamp(interactions);
  return sorted[sorted.length - 1].timestamp;
}

/**
 * Cria preview do chat a partir dos dados do paciente
 */
export function createChatPreview(patient: PatientWithWhatsApp): WhatsAppChatPreview | null {
  const messages = parseWhatsAppMessages(patient.whatsapp);
  
  if (messages.length === 0) {
    return null;
  }

  const name = patient.nome || patient.name || 'Sem nome';
  const phone = patient.telefone || patient.phone || 'Sem telefone';

  return {
    patientId: patient.id,
    name,
    phone,
    lastMessagePreview: getLastMessagePreview(messages),
    lastMessageTime: formatTimestamp(getLastMessageTimestamp(messages)),
    messageCount: messages.length
  };
}

/**
 * Filtra pacientes que têm conversas do WhatsApp
 */
export function filterPatientsWithWhatsApp(patients: PatientWithWhatsApp[]): PatientWithWhatsApp[] {
  return patients.filter(patient => {
    const messages = parseWhatsAppMessages(patient.whatsapp);
    return messages.length > 0;
  });
}

/**
 * Ordena pacientes por timestamp da última mensagem (mais recente primeiro)
 */
export function sortPatientsByLastMessage(patients: PatientWithWhatsApp[]): PatientWithWhatsApp[] {
  return [...patients].sort((a, b) => {
    const messagesA = parseWhatsAppMessages(a.whatsapp);
    const messagesB = parseWhatsAppMessages(b.whatsapp);

    const timestampA = getLastMessageTimestamp(messagesA);
    const timestampB = getLastMessageTimestamp(messagesB);

    if (!timestampA && !timestampB) return 0;
    if (!timestampA) return 1;
    if (!timestampB) return -1;

    return new Date(timestampB).getTime() - new Date(timestampA).getTime();
  });
}

/**
 * Obtém nome do paciente de forma segura
 */
export function getPatientName(patient: PatientWithWhatsApp): string {
  return patient.nome || patient.name || 'Paciente sem nome';
}

/**
 * Obtém telefone do paciente de forma segura
 */
export function getPatientPhone(patient: PatientWithWhatsApp): string {
  return patient.telefone || patient.phone || 'Sem telefone';
}

/**
 * Formata número de telefone para exibição
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  }
  
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  }
  
  return phone;
}



