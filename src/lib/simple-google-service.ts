import { supabaseCrm } from './supabase-crm';

export interface SimpleGoogleCredentials {
  id?: string;
  cliente_id: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  calendar_id?: string;
  configured: boolean;
  created_at?: string;
  updated_at?: string;
}

export class SimpleGoogleCredentialsService {
  private static instance: SimpleGoogleCredentialsService;
  private currentClienteId: string | null = null;

  private constructor() {}

  public static getInstance(): SimpleGoogleCredentialsService {
    if (!SimpleGoogleCredentialsService.instance) {
      SimpleGoogleCredentialsService.instance = new SimpleGoogleCredentialsService();
    }
    return SimpleGoogleCredentialsService.instance;
  }

  // Definir cliente atual
  public setCurrentCliente(clienteId: string) {
    this.currentClienteId = clienteId;
    console.log('🏢 Cliente atual definido para credenciais:', clienteId);
  }

  // Atualizar cliente atual baseado no usuário logado
  public updateCurrentCliente() {
    try {
      const savedUser = localStorage.getItem('kommuchat_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.cliente_id) {
          this.setCurrentCliente(userData.cliente_id);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente atual:', error);
    }
  }

  // Salvar credenciais Google (sem criptografia)
  async saveCredentials(credentials: Omit<SimpleGoogleCredentials, 'id' | 'created_at' | 'updated_at'>): Promise<SimpleGoogleCredentials | null> {
    try {
      console.log('💾 Salvando credenciais Google para cliente:', credentials.cliente_id);

      const credentialData = {
        cliente_id: credentials.cliente_id,
        client_id: credentials.client_id, // Sem criptografia
        client_secret: credentials.client_secret, // Sem criptografia
        redirect_uri: credentials.redirect_uri,
        calendar_id: credentials.calendar_id,
        configured: credentials.configured,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseCrm
        .from('google_credentials')
        .upsert(credentialData, { 
          onConflict: 'cliente_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar credenciais Google:', error);
        throw error;
      }

      console.log('✅ Credenciais Google salvas com sucesso');
      return data;
    } catch (error) {
      console.error('❌ Erro ao salvar credenciais Google:', error);
      return null;
    }
  }

  // Buscar credenciais Google (sem descriptografia)
  async getCredentials(clienteId: string): Promise<SimpleGoogleCredentials | null> {
    try {
      console.log('🔍 Buscando credenciais Google para cliente:', clienteId);

      const { data, error } = await supabaseCrm
        .from('google_credentials')
        .select('*')
        .eq('cliente_id', clienteId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Nenhuma credencial encontrada para o cliente');
          return null;
        }
        console.error('❌ Erro ao buscar credenciais Google:', error);
        throw error;
      }

      console.log('✅ Credenciais Google encontradas');
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar credenciais Google:', error);
      return null;
    }
  }

  // Buscar credenciais do usuário atual
  async getCurrentUserGoogleCredentials(): Promise<SimpleGoogleCredentials | null> {
    try {
      this.updateCurrentCliente();
      
      if (!this.currentClienteId) {
        throw new Error('Cliente atual não definido');
      }

      return await this.getCredentials(this.currentClienteId);
    } catch (error) {
      console.error('❌ Erro ao buscar credenciais do usuário atual:', error);
      return null;
    }
  }

  // Atualizar credenciais
  async updateCredentials(
    clienteId: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    calendarId?: string
  ): Promise<boolean> {
    try {
      console.log('🔄 Atualizando credenciais Google para cliente:', clienteId);

      const updateData = {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        calendar_id: calendarId,
        configured: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseCrm
        .from('google_credentials')
        .update(updateData)
        .eq('cliente_id', clienteId);

      if (error) {
        console.error('❌ Erro ao atualizar credenciais Google:', error);
        throw error;
      }

      console.log('✅ Credenciais Google atualizadas com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar credenciais Google:', error);
      return false;
    }
  }

  // Deletar credenciais
  async deleteCredentials(clienteId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deletando credenciais Google para cliente:', clienteId);

      const { error } = await supabaseCrm
        .from('google_credentials')
        .delete()
        .eq('cliente_id', clienteId);

      if (error) {
        console.error('❌ Erro ao deletar credenciais Google:', error);
        throw error;
      }

      console.log('✅ Credenciais Google deletadas com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar credenciais Google:', error);
      return false;
    }
  }

  // Verificar se credenciais existem
  async hasCredentials(clienteId: string): Promise<boolean> {
    try {
      const credentials = await this.getCredentials(clienteId);
      return credentials !== null && credentials.configured;
    } catch (error) {
      console.error('❌ Erro ao verificar credenciais:', error);
      return false;
    }
  }

  // Criar credenciais padrão para um novo cliente
  async createDefaultCredentials(clienteId: string): Promise<SimpleGoogleCredentials | null> {
    try {
      console.log('🆕 Criando credenciais padrão para cliente:', clienteId);

      const defaultCredentials = {
        cliente_id: clienteId,
        client_id: '', // Será preenchido pelo admin
        client_secret: '', // Será preenchido pelo admin
        redirect_uri: 'http://localhost:8080/auth/google/callback',
        calendar_id: '',
        configured: false,
      };

      return await this.saveCredentials(defaultCredentials);
    } catch (error) {
      console.error('❌ Erro ao criar credenciais padrão:', error);
      return null;
    }
  }
}

// Instância singleton
export const simpleGoogleCredentialsService = SimpleGoogleCredentialsService.getInstance();





