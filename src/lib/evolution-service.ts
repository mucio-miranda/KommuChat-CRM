import { getEvolutionConfig } from './supabase-crm';

export interface EvolutionConfig {
  evo_base_url: string;
  evo_instance: string;
  evo_api_key: string;
}

export interface EvolutionInstanceStatus {
  instance: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting' | 'connected' | 'disconnected';
    status?: string;
    qrcode?: {
      code?: string;
      base64?: string;
    };
    webhook?: {
      url?: string;
      events?: string[];
    };
  };
}

export interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
      mimetype?: string;
    };
    videoMessage?: {
      caption?: string;
      mimetype?: string;
    };
    audioMessage?: {
      mimetype?: string;
    };
    documentMessage?: {
      fileName?: string;
      mimetype?: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
}

export interface EvolutionConversation {
  id: string;
  name: string;
  unreadCount: number;
  lastMessage?: {
    message: string;
    timestamp: number;
  };
}

export class EvolutionService {
  private static instance: EvolutionService;

  private constructor() {}

  public static getInstance(): EvolutionService {
    if (!EvolutionService.instance) {
      EvolutionService.instance = new EvolutionService();
    }
    return EvolutionService.instance;
  }

  /**
   * Busca configurações da Evolution API do cliente
   */
  private async getConfig(clienteId: string): Promise<EvolutionConfig | null> {
    try {
      const config = await getEvolutionConfig(clienteId);
      if (!config) {
        console.error('❌ Configuração da Evolution API não encontrada para o cliente');
        return null;
      }
      return config;
    } catch (error) {
      console.error('❌ Erro ao buscar configuração da Evolution API:', error);
      return null;
    }
  }

  /**
   * Faz requisição para a Evolution API
   */
  private async makeRequest(
    config: EvolutionConfig,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    try {
      const url = `${config.evo_base_url.replace(/\/$/, '')}${endpoint}`;
      
      const headers: HeadersInit = {
        'apikey': config.evo_api_key,
        'Content-Type': 'application/json',
      };

      const options: RequestInit = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      console.log(`🌐 Evolution API Request: ${method} ${url}`);
      console.log(`🔑 Headers:`, { apikey: config.evo_api_key.substring(0, 10) + '...' });

      const response = await fetch(url, options);

      console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Evolution API Error: ${response.status} ${response.statusText}`);
        console.error(`❌ Error Body:`, errorText);
        
        // Tentar parsear como JSON se possível
        try {
          const errorJson = JSON.parse(errorText);
          console.error(`❌ Error JSON:`, errorJson);
          throw new Error(errorJson.message || errorJson.error || `Evolution API Error: ${response.status} ${response.statusText}`);
        } catch {
          throw new Error(`Evolution API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }
      }

      const contentType = response.headers.get('content-type');
      console.log(`📦 Response Content-Type:`, contentType);

      // Verificar se a resposta é JSON
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ Response Data:`, JSON.stringify(data, null, 2).substring(0, 500));
        return data;
      } else {
        // Se não for JSON, retornar como texto
        const text = await response.text();
        console.log(`✅ Response Text:`, text.substring(0, 500));
        return text;
      }
    } catch (error) {
      console.error('❌ Erro na requisição para Evolution API:', error);
      throw error;
    }
  }

  /**
   * Obtém QR Code da instância
   */
  async getQRCode(clienteId: string): Promise<string | null> {
    try {
      const config = await this.getConfig(clienteId);
      if (!config) {
        throw new Error('Configuração da Evolution API não encontrada');
      }

      console.log('🔍 Buscando QR Code para instância:', config.evo_instance);
      console.log('🔍 Base URL:', config.evo_base_url);

      // Primeiro verificar se já está conectado
      const isAlreadyConnected = await this.isConnected(clienteId);
      if (isAlreadyConnected) {
        console.log('✅ Instância já está conectada, não precisa de QR code');
        return null; // Retornar null indica que está conectado (não precisa QR)
      }

      // Tentar primeiro com GET, depois com POST se necessário
      let endpoint = `/instance/connect/${config.evo_instance}`;
      let data: any;

      try {
        // Primeiro tenta GET
        data = await this.makeRequest(config, endpoint, 'GET');
        console.log('📥 Resposta GET /connect:', JSON.stringify(data, null, 2));
      } catch (getError: any) {
        // Se GET falhar, tenta POST
        console.log('⚠️ GET /connect falhou, tentando POST...');
        try {
          data = await this.makeRequest(config, endpoint, 'POST');
          console.log('📥 Resposta POST /connect:', JSON.stringify(data, null, 2));
        } catch (postError: any) {
          // Se ambos falharem, tenta endpoint alternativo
          console.log('⚠️ POST /connect falhou, tentando endpoint alternativo...');
          endpoint = `/instance/create/${config.evo_instance}`;
          try {
            data = await this.makeRequest(config, endpoint, 'POST', {
              instanceName: config.evo_instance,
              qrcode: true
            });
            console.log('📥 Resposta endpoint alternativo:', JSON.stringify(data, null, 2));
          } catch (altError: any) {
            throw new Error(`Erro ao conectar instância: ${getError.message || postError.message || altError.message}`);
          }
        }
      }

      // A Evolution API pode retornar o QR code em diferentes formatos
      // Verificar múltiplas estruturas possíveis
      let qrCodeBase64: string | null = null;

      // Formato 1: data.qrcode.base64
      if (data.qrcode?.base64) {
        qrCodeBase64 = data.qrcode.base64;
        console.log('✅ QR Code encontrado em data.qrcode.base64');
      }
      // Formato 2: data.instance.qrcode.base64
      else if (data.instance?.qrcode?.base64) {
        qrCodeBase64 = data.instance.qrcode.base64;
        console.log('✅ QR Code encontrado em data.instance.qrcode.base64');
      }
      // Formato 3: data.base64
      else if (data.base64) {
        qrCodeBase64 = data.base64;
        console.log('✅ QR Code encontrado em data.base64');
      }
      // Formato 4: data.qr
      else if (data.qr) {
        qrCodeBase64 = data.qr;
        console.log('✅ QR Code encontrado em data.qr');
      }
      // Formato 5: data.qrcode.code (código do QR, não base64)
      else if (data.qrcode?.code) {
        // Se for apenas o código, pode precisar gerar a imagem
        // Por enquanto, retornamos como está e deixamos o frontend lidar
        console.log('⚠️ QR Code retornado como código (não base64)');
        return data.qrcode.code;
      }
      // Formato 6: data.instance.qrcode.code
      else if (data.instance?.qrcode?.code) {
        console.log('⚠️ QR Code retornado como código (não base64)');
        return data.instance.qrcode.code;
      }
      // Formato 7: data diretamente como base64 string
      else if (typeof data === 'string' && data.startsWith('data:image')) {
        console.log('✅ QR Code retornado como string data URI');
        return data;
      }

      if (qrCodeBase64) {
        // Se já começar com data:image, retornar direto
        if (qrCodeBase64.startsWith('data:image')) {
          console.log('✅ QR Code formatado corretamente');
          return qrCodeBase64;
        }
        // Se for apenas base64, adicionar prefixo
        const formattedQR = `data:image/png;base64,${qrCodeBase64}`;
        console.log('✅ QR Code formatado com sucesso');
        return formattedQR;
      }

      console.warn('⚠️ QR Code não encontrado na resposta da Evolution API');
      console.warn('📋 Estrutura completa da resposta:', JSON.stringify(data, null, 2));
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter QR Code:', error);
      throw error;
    }
  }

  /**
   * Verifica status da instância
   */
  async getInstanceStatus(clienteId: string): Promise<EvolutionInstanceStatus | any> {
    try {
      const config = await this.getConfig(clienteId);
      if (!config) {
        throw new Error('Configuração da Evolution API não encontrada');
      }

      console.log('🔍 Verificando status da instância:', config.evo_instance);
      
      // A Evolution API pode usar diferentes endpoints
      // Primeiro tenta o endpoint de status específico
      let endpoint = `/instance/status/${config.evo_instance}`;
      let data: any;

      try {
        data = await this.makeRequest(config, endpoint, 'GET');
        // Se retornou com estrutura instance, usar direto
        if (data.instance) {
          console.log('📊 Status retornado do endpoint /status:', JSON.stringify(data, null, 2));
          return data;
        }
      } catch (error: any) {
        console.log('⚠️ Endpoint /status não disponível, usando /fetchInstances...');
      }

      // Se o endpoint de status não funcionou, buscar na lista de instâncias
      endpoint = `/instance/fetchInstances`;
      try {
        const instances = await this.makeRequest(config, endpoint, 'GET');
        console.log('📋 Lista de instâncias recebida:', instances);
        
        // Procurar a instância específica na lista
        let foundInstance: any = null;
        
        if (Array.isArray(instances)) {
          foundInstance = instances.find((inst: any) => 
            inst.name === config.evo_instance || 
            inst.instanceName === config.evo_instance ||
            inst.id === config.evo_instance
          );
        } else if (instances.data && Array.isArray(instances.data)) {
          foundInstance = instances.data.find((inst: any) => 
            inst.name === config.evo_instance || 
            inst.instanceName === config.evo_instance ||
            inst.id === config.evo_instance
          );
        }
        
        if (foundInstance) {
          console.log('✅ Instância encontrada na lista:', foundInstance);
          // Normalizar para o formato esperado
          return {
            instance: {
              instanceName: foundInstance.name || foundInstance.instanceName || foundInstance.id,
              state: foundInstance.connectionStatus || foundInstance.state || 'unknown',
              status: foundInstance.connectionStatus || foundInstance.state
            },
            // Manter dados originais também
            raw: foundInstance
          };
        } else {
          console.warn('⚠️ Instância não encontrada na lista');
          return null;
        }
      } catch (altError) {
        console.error('❌ Erro ao buscar lista de instâncias:', altError);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status da instância:', error);
      return null;
    }
  }

  /**
   * Verifica se a instância está conectada
   */
  async isConnected(clienteId: string): Promise<boolean> {
    try {
      const status = await this.getInstanceStatus(clienteId);
      if (!status) {
        console.log('⚠️ Status não retornado');
        return false;
      }

      console.log('🔍 Status completo da instância:', JSON.stringify(status, null, 2));

      // Verificar diferentes formatos de resposta
      // A resposta pode vir em diferentes estruturas
      let state: string | undefined;
      
      // Tentar diferentes caminhos para encontrar o estado
      // Prioridade: raw.connectionStatus > instance.state > state > connectionStatus > status
      if (status.raw?.connectionStatus) {
        state = status.raw.connectionStatus;
        console.log('📌 Estado encontrado em status.raw.connectionStatus');
      } else if (status.instance?.state) {
        state = status.instance.state;
        console.log('📌 Estado encontrado em status.instance.state');
      } else if ((status as any).connectionStatus) {
        state = (status as any).connectionStatus;
        console.log('📌 Estado encontrado em status.connectionStatus');
      } else if ((status as any).state) {
        state = (status as any).state;
        console.log('📌 Estado encontrado em status.state');
      } else if ((status as any).status) {
        state = (status as any).status;
        console.log('📌 Estado encontrado em status.status');
      }

      const instanceName = status.instance?.instanceName || status.raw?.name || (status as any).name || (status as any).instanceName;

      console.log(`🔍 Estado da instância: ${state}, Nome: ${instanceName}`);

      if (!state) {
        console.warn('⚠️ Não foi possível determinar o estado da instância');
        return false;
      }

      // Estados que indicam conexão (case-insensitive)
      const connectedStates = ['connected', 'open', 'CONNECTED', 'OPEN', 'online', 'ONLINE'];
      const stateLower = state.toLowerCase();
      const isConnected = connectedStates.some(s => s.toLowerCase() === stateLower);

      if (isConnected) {
        console.log('✅ Instância está CONECTADA!');
      } else {
        console.log(`⚠️ Instância NÃO está conectada. Estado atual: ${state}`);
      }

      return isConnected;
    } catch (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      return false;
    }
  }

  /**
   * Envia mensagem via Evolution API
   */
  async sendMessage(
    clienteId: string,
    to: string,
    message: string,
    options?: {
      delay?: number;
      presence?: 'composing' | 'available' | 'unavailable';
    }
  ): Promise<boolean> {
    try {
      const config = await this.getConfig(clienteId);
      if (!config) {
        throw new Error('Configuração da Evolution API não encontrada');
      }

      // Formatar número (remover caracteres especiais, adicionar @s.whatsapp.net se necessário)
      let formattedNumber = to.replace(/\D/g, '');
      if (!formattedNumber.includes('@')) {
        formattedNumber = `${formattedNumber}@s.whatsapp.net`;
      }

      const endpoint = `/message/sendText/${config.evo_instance}`;
      const body = {
        number: formattedNumber,
        text: message,
        delay: options?.delay || 1000,
        presence: options?.presence || 'composing'
      };

      await this.makeRequest(config, endpoint, 'POST', body);
      console.log('✅ Mensagem enviada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Lista mensagens recebidas
   */
  async listMessages(clienteId: string, limit: number = 50): Promise<EvolutionMessage[]> {
    try {
      const config = await this.getConfig(clienteId);
      if (!config) {
        throw new Error('Configuração da Evolution API não encontrada');
      }

      const endpoint = `/chat/fetchMessages/${config.evo_instance}?limit=${limit}`;
      const data = await this.makeRequest(config, endpoint, 'GET');

      // A Evolution API pode retornar em diferentes formatos
      if (Array.isArray(data)) {
        return data;
      } else if (data.messages) {
        return data.messages;
      } else if (data.data) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Erro ao listar mensagens:', error);
      return [];
    }
  }

  /**
   * Lista conversas com última mensagem (tenta v2 e v1 da Evolution API)
   */
  async listConversations(clienteId: string): Promise<EvolutionConversation[]> {
    const config = await this.getConfig(clienteId);
    if (!config) throw new Error('Configuração da Evolution API não encontrada');

    let data: any;

    // Evolution API v2: POST /chat/findChats/{instance}
    try {
      data = await this.makeRequest(config, `/chat/findChats/${config.evo_instance}`, 'POST', {});
    } catch {
      // Evolution API v1: GET /chat/fetchChats/{instance}
      data = await this.makeRequest(config, `/chat/fetchChats/${config.evo_instance}`, 'GET');
    }

    let chats: any[] = [];
    if (Array.isArray(data)) {
      chats = data;
    } else if (data?.chats) {
      chats = data.chats;
    } else if (data?.data) {
      chats = data.data;
    }

    return chats.map((chat: any) => ({
      id: chat.id || chat.remoteJid || chat.jid || '',
      name: chat.name || chat.pushName || chat.contact?.name || 'Sem nome',
      unreadCount: chat.unreadCount || chat.unread || 0,
      lastMessage: chat.lastMessage ? {
        message: chat.lastMessage.message?.conversation ||
                 chat.lastMessage.message?.extendedTextMessage?.text ||
                 '[Mídia]',
        timestamp: chat.lastMessage.messageTimestamp || Date.now()
      } : undefined
    }));
  }

  /**
   * Busca a URL da foto de perfil de um contato do WhatsApp
   */
  async fetchProfilePicture(
    clienteId: string,
    phoneNumber: string
  ): Promise<string | null> {
    try {
      const config = await this.getConfig(clienteId);
      if (!config) {
        return null;
      }

      let formattedNumber = phoneNumber.replace(/\D/g, '');
      if (!formattedNumber) {
        return null;
      }

      // Adicionar código do país (55 - Brasil) se necessário
      if (formattedNumber.length === 11 || formattedNumber.length === 10) {
        formattedNumber = `55${formattedNumber}`;
      }

      const jid = `${formattedNumber}@s.whatsapp.net`;
      const endpoint = `/chat/fetchProfilePictureUrl/${config.evo_instance}`;
      
      const data = await this.makeRequest(config, endpoint, 'POST', { number: jid });
      
      const profileUrl = data?.profilePictureUrl || null;
      console.log(`📷 Foto de perfil ${formattedNumber}: ${profileUrl ? '✅ OK' : '❌ Não disponível'}`);
      
      return profileUrl;
    } catch (error: any) {
      // Silenciar erros 404 (contato sem foto ou privacidade)
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        console.log(`📷 Foto de perfil ${phoneNumber}: ❌ Privacidade ou sem foto`);
      } else {
        console.warn(`⚠️ Erro ao buscar foto de perfil para ${phoneNumber}:`, error?.message || error);
      }
      return null;
    }
  }

  /**
   * Desconecta a instância
   */
  async disconnect(clienteId: string): Promise<boolean> {
    try {
      const config = await this.getConfig(clienteId);
      if (!config) {
        throw new Error('Configuração da Evolution API não encontrada');
      }

      const endpoint = `/instance/logout/${config.evo_instance}`;
      await this.makeRequest(config, endpoint, 'DELETE');
      console.log('✅ Instância desconectada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao desconectar instância:', error);
      throw error;
    }
  }

  /**
   * Reinicia a instância
   */
  async restart(clienteId: string): Promise<boolean> {
    try {
      const config = await this.getConfig(clienteId);
      if (!config) {
        throw new Error('Configuração da Evolution API não encontrada');
      }

      const endpoint = `/instance/restart/${config.evo_instance}`;
      await this.makeRequest(config, endpoint, 'PUT');
      console.log('✅ Instância reiniciada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao reiniciar instância:', error);
      throw error;
    }
  }
}

// Exportar instância singleton
export const evolutionService = EvolutionService.getInstance();

