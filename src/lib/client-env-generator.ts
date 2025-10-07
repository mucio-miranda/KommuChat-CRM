import { supabaseCrm } from './supabase-crm';
import CryptoJS from 'crypto-js';

interface ClientEnvConfig {
  cliente_id: string;
  cliente_nome: string;
  google_credentials: {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    calendar_id?: string;
  };
  supabase_config: {
    url: string;
    anon_key: string;
  };
  app_config: {
    name: string;
    version: string;
    environment: 'development' | 'production';
  };
}

export class ClientEnvGenerator {
  private static instance: ClientEnvGenerator;
  private encryptionKey: string;

  private constructor() {
    this.encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'kommuchat-encryption-key-2024';
  }

  public static getInstance(): ClientEnvGenerator {
    if (!ClientEnvGenerator.instance) {
      ClientEnvGenerator.instance = new ClientEnvGenerator();
    }
    return ClientEnvGenerator.instance;
  }

  /**
   * Criptografa dados sensíveis
   */
  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
  }

  /**
   * Descriptografa dados sensíveis
   */
  private decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Gera conteúdo do .env para um cliente específico
   */
  async generateClientEnv(clienteId: string): Promise<string> {
    try {
      console.log('🔧 Gerando .env para cliente:', clienteId);

      // 1. Buscar credenciais Google do cliente
      const { data: credentials, error: credError } = await supabaseCrm
        .from('google_credentials')
        .select('*')
        .eq('cliente_id', clienteId)
        .single();

      if (credError || !credentials) {
        throw new Error(`Credenciais Google não encontradas para cliente ${clienteId}`);
      }

      // 2. Buscar dados do cliente
      const { data: cliente, error: clienteError } = await supabaseCrm
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (clienteError || !cliente) {
        throw new Error(`Cliente não encontrado: ${clienteId}`);
      }

      // 3. Descriptografar credenciais
      const decryptedCredentials = {
        client_id: this.decrypt(credentials.client_id),
        client_secret: this.decrypt(credentials.client_secret),
        redirect_uri: credentials.redirect_uri,
        calendar_id: credentials.calendar_id || ''
      };

      // 4. Gerar conteúdo do .env
      const envContent = this.buildEnvContent({
        cliente_id: clienteId,
        cliente_nome: cliente.nome,
        google_credentials: decryptedCredentials,
        supabase_config: {
          url: import.meta.env.VITE_CRM_SUPABASE_URL,
          anon_key: import.meta.env.VITE_CRM_SUPABASE_ANON_KEY
        },
        app_config: {
          name: `KOMMUchat CRM - ${cliente.nome}`,
          version: '1.0.0',
          environment: 'production'
        }
      });

      console.log('✅ .env gerado com sucesso para cliente:', cliente.nome);
      return envContent;

    } catch (error) {
      console.error('❌ Erro ao gerar .env para cliente:', error);
      throw error;
    }
  }

  /**
   * Constrói o conteúdo do arquivo .env
   */
  private buildEnvContent(config: ClientEnvConfig): string {
    const timestamp = new Date().toISOString();
    
    return `# KOMMUchat CRM - Configuração do Cliente
# Cliente: ${config.cliente_nome}
# Gerado em: ${timestamp}
# Cliente ID: ${config.cliente_id}

# ===========================================
# CONFIGURAÇÃO SUPABASE
# ===========================================
VITE_SUPABASE_URL=${config.supabase_config.url}
VITE_SUPABASE_ANON_KEY=${config.supabase_config.anon_key}

# ===========================================
# CONFIGURAÇÃO GOOGLE CALENDAR
# ===========================================
VITE_GOOGLE_CLIENT_ID=${config.google_credentials.client_id}
VITE_GOOGLE_CLIENT_SECRET=${config.google_credentials.client_secret}
VITE_GOOGLE_REDIRECT_URI=${config.google_credentials.redirect_uri}
VITE_GOOGLE_CALENDAR_ID=${config.google_credentials.calendar_id || 'primary'}

# ===========================================
# CONFIGURAÇÃO DO APLICATIVO
# ===========================================
VITE_APP_NAME=${config.app_config.name}
VITE_APP_VERSION=${config.app_config.version}
VITE_APP_ENVIRONMENT=${config.app_config.environment}
VITE_CLIENT_ID=${config.cliente_id}

# ===========================================
# CONFIGURAÇÃO DE CRIPTOGRAFIA
# ===========================================
VITE_ENCRYPTION_KEY=${this.encryptionKey}

# ===========================================
# CONFIGURAÇÃO DE SEGURANÇA
# ===========================================
VITE_ENABLE_RLS=true
VITE_CLIENT_ISOLATION=true

# ===========================================
# CONFIGURAÇÃO DE LOGS
# ===========================================
VITE_LOG_LEVEL=info
VITE_ENABLE_ANALYTICS=false

# ===========================================
# CONFIGURAÇÃO DE DESENVOLVIMENTO
# ===========================================
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
`;
  }

  /**
   * Salva o .env gerado no storage do Supabase
   */
  async saveClientEnv(clienteId: string, envContent: string): Promise<string> {
    try {
      console.log('💾 Salvando .env para cliente:', clienteId);

      // Converter para Blob
      const blob = new Blob([envContent], { type: 'text/plain' });
      const fileName = `cliente-${clienteId}-.env`;
      const filePath = `client-envs/${fileName}`;

      // Upload para Supabase Storage
      const { data, error } = await supabaseCrm.storage
        .from('client-configs')
        .upload(filePath, blob, {
          contentType: 'text/plain',
          upsert: true
        });

      if (error) {
        throw error;
      }

      console.log('✅ .env salvo com sucesso:', data.path);
      return data.path;

    } catch (error) {
      console.error('❌ Erro ao salvar .env:', error);
      throw error;
    }
  }

  /**
   * Baixa o .env de um cliente
   */
  async downloadClientEnv(clienteId: string): Promise<string> {
    try {
      const fileName = `cliente-${clienteId}-.env`;
      const filePath = `client-envs/${fileName}`;

      const { data, error } = await supabaseCrm.storage
        .from('client-configs')
        .download(filePath);

      if (error) {
        throw error;
      }

      return await data.text();

    } catch (error) {
      console.error('❌ Erro ao baixar .env:', error);
      throw error;
    }
  }

  /**
   * Lista todos os .env de clientes
   */
  async listClientEnvs(): Promise<Array<{cliente_id: string, file_path: string, created_at: string}>> {
    try {
      const { data, error } = await supabaseCrm.storage
        .from('client-configs')
        .list('client-envs');

      if (error) {
        throw error;
      }

      return data.map(file => ({
        cliente_id: file.name.replace('cliente-', '').replace('-.env', ''),
        file_path: `client-envs/${file.name}`,
        created_at: file.created_at
      }));

    } catch (error) {
      console.error('❌ Erro ao listar .envs:', error);
      throw error;
    }
  }

  /**
   * Atualiza .env quando credenciais mudam
   */
  async updateClientEnv(clienteId: string): Promise<string> {
    try {
      console.log('🔄 Atualizando .env para cliente:', clienteId);
      
      // Gerar novo .env
      const envContent = await this.generateClientEnv(clienteId);
      
      // Salvar no storage
      const filePath = await this.saveClientEnv(clienteId, envContent);
      
      console.log('✅ .env atualizado com sucesso');
      return filePath;

    } catch (error) {
      console.error('❌ Erro ao atualizar .env:', error);
      throw error;
    }
  }

  /**
   * Gera .env para todos os clientes ativos
   */
  async generateAllClientEnvs(): Promise<Array<{cliente_id: string, status: 'success' | 'error', message: string}>> {
    try {
      console.log('🚀 Gerando .env para todos os clientes ativos');

      // Buscar todos os clientes ativos
      const { data: clientes, error } = await supabaseCrm
        .from('clientes')
        .select('id, nome')
        .eq('ativo', true);

      if (error) {
        throw error;
      }

      const results = [];

      for (const cliente of clientes) {
        try {
          await this.updateClientEnv(cliente.id);
          results.push({
            cliente_id: cliente.id,
            status: 'success' as const,
            message: `✅ .env gerado para ${cliente.nome}`
          });
        } catch (error) {
          results.push({
            cliente_id: cliente.id,
            status: 'error' as const,
            message: `❌ Erro para ${cliente.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          });
        }
      }

      console.log('🏁 Geração de .envs concluída');
      return results;

    } catch (error) {
      console.error('❌ Erro ao gerar .envs para todos os clientes:', error);
      throw error;
    }
  }
}

// Instância singleton
export const clientEnvGenerator = ClientEnvGenerator.getInstance();
