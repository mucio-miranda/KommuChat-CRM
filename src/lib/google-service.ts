import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase CRM (para credenciais Google)
const supabaseUrl = import.meta.env.VITE_CRM_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_CRM_SUPABASE_ANON_KEY;

console.log('🔍 Shared Google Credentials Supabase Config - URL:', supabaseUrl);
console.log('🔍 Shared Google Credentials Supabase Config - Key:', supabaseAnonKey ? 'Presente' : 'Ausente');

let supabase = null;

if (supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'your_crm_supabase_project_url' && 
    supabaseAnonKey !== 'your_crm_supabase_anon_key') {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Shared Google Credentials Supabase Client criado');
} else {
  console.warn('❌ Configurações do Supabase CRM não encontradas - credenciais Google não funcionarão');
}

export { supabase };

export interface GoogleCredentials {
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

export interface SharedGoogleCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  calendar_id?: string;
  usage_count: number;
  clientes_using: string[];
  first_created: string;
  last_updated: string;
}

export class SharedGoogleCredentialsService {
  private static instance: SharedGoogleCredentialsService;
  private currentClienteId: string | null = null;

  private constructor() {
    console.log('🏗️ SharedGoogleCredentialsService criado');
  }

  public static getInstance(): SharedGoogleCredentialsService {
    if (!SharedGoogleCredentialsService.instance) {
      SharedGoogleCredentialsService.instance = new SharedGoogleCredentialsService();
    }
    return SharedGoogleCredentialsService.instance;
  }

  private async initializeCliente() {
    try {
      // Verificar se há usuário no localStorage
      const savedUser = localStorage.getItem('kommuchat_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        this.currentClienteId = userData.cliente_id;
        console.log('🏢 Cliente inicializado do usuário:', this.currentClienteId);
      } else {
        // Fallback para modo visitante
        this.currentClienteId = 'cliente-demo-001';
        console.log('🏢 Cliente inicializado (sem usuário):', this.currentClienteId);
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar cliente:', error);
      this.currentClienteId = 'cliente-demo-001';
    }
  }

  // Método para definir o cliente atual
  public setCurrentCliente(clienteId: string) {
    this.currentClienteId = clienteId;
    console.log('🏢 Cliente atual definido:', this.currentClienteId);
  }

  // Método para atualizar o cliente baseado no usuário atual
  public updateCurrentCliente() {
    try {
      const savedUser = localStorage.getItem('kommuchat_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        this.currentClienteId = userData.cliente_id;
        console.log('🏢 Cliente atualizado do usuário:', this.currentClienteId);
      } else {
        this.currentClienteId = 'cliente-demo-001';
        console.log('🏢 Cliente atualizado (sem usuário):', this.currentClienteId);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      this.currentClienteId = 'cliente-demo-001';
    }
  }

  // Buscar credenciais Google do cliente atual (com suporte a credenciais compartilhadas)
  async getCurrentUserGoogleCredentials(): Promise<GoogleCredentials | null> {
    try {
      // Inicializar cliente se necessário
      if (!this.currentClienteId) {
        console.log('🔧 Cliente não inicializado - inicializando agora...');
        await this.initializeCliente();
      }

      if (!this.currentClienteId) {
        console.log('❌ Cliente não inicializado após tentativa - usando fallback');
        return null;
      }

      console.log('🔍 Buscando credenciais Google para cliente:', this.currentClienteId);

      // Primeiro, tentar buscar credenciais específicas do cliente
      const { data: specificCredentials, error: specificError } = await supabase
        .from('google_credentials')
        .select('*')
        .eq('cliente_id', this.currentClienteId)
        .single();

      if (specificCredentials && !specificError) {
        console.log('✅ Credenciais específicas encontradas para o cliente');
        return specificCredentials;
      }

      // Se não encontrar credenciais específicas, buscar credenciais compartilhadas
      console.log('🔍 Buscando credenciais compartilhadas...');
      
      const { data: sharedCredentials, error: sharedError } = await supabase
        .from('shared_google_credentials')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(1)
        .single();

      if (sharedCredentials && !sharedError) {
        console.log('✅ Credenciais compartilhadas encontradas:', {
          client_id: sharedCredentials.client_id ? 'Configurado' : 'Não configurado',
          usage_count: sharedCredentials.usage_count,
          clientes_using: sharedCredentials.clientes_using
        });

        // Retornar as credenciais compartilhadas no formato esperado
        return {
          id: 'shared',
          cliente_id: this.currentClienteId,
          client_id: sharedCredentials.client_id,
          client_secret: sharedCredentials.client_secret,
          redirect_uri: sharedCredentials.redirect_uri,
          calendar_id: sharedCredentials.calendar_id,
          configured: true,
          created_at: sharedCredentials.first_created,
          updated_at: sharedCredentials.last_updated
        };
      }

      console.log('ℹ️ Nenhuma credencial Google encontrada (específica ou compartilhada)');
      return null;

    } catch (error) {
      console.error('❌ Erro ao buscar credenciais Google do Supabase:', error);
      return null;
    }
  }

  // Salvar credenciais Google (com suporte a credenciais compartilhadas)
  async saveCredentials(credentials: Omit<GoogleCredentials, 'id' | 'created_at' | 'updated_at'>): Promise<GoogleCredentials | null> {
    try {
      if (!this.currentClienteId) {
        throw new Error('Cliente não inicializado');
      }

      console.log('💾 Salvando credenciais Google...');

      const credentialData = {
        cliente_id: this.currentClienteId,
        ...credentials,
        configured: true,
        updated_at: new Date().toISOString(),
      };

      // Usar upsert com a nova constraint composta
      const { data, error } = await supabase
        .from('google_credentials')
        .upsert(credentialData, { 
          onConflict: 'cliente_id,client_id,client_secret',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar credenciais Google:', error);
        throw error;
      }

      console.log('✅ Credenciais Google salvas com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao salvar credenciais Google no Supabase:', error);
      throw error;
    }
  }

  // Verificar se as credenciais estão configuradas
  async areCredentialsConfigured(): Promise<boolean> {
    try {
      const credentials = await this.getCurrentUserGoogleCredentials();
      return credentials?.configured === true && !!credentials?.client_id;
    } catch (error) {
      console.error('❌ Erro ao verificar credenciais:', error);
      return false;
    }
  }

  // Buscar credenciais Google por cliente ID (para o gerenciador)
  async getGoogleCredentials(clienteId: string): Promise<GoogleCredentials | null> {
    try {
      console.log('🔍 Buscando credenciais Google para cliente:', clienteId);

      const { data, error } = await supabase
        .from('google_credentials')
        .select('*')
        .eq('cliente_id', clienteId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Nenhuma credencial Google encontrada para este cliente');
          return null;
        }
        console.error('❌ Erro ao buscar credenciais Google:', error);
        throw error;
      }

      console.log('✅ Credenciais Google encontradas:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar credenciais Google do Supabase:', error);
      throw error;
    }
  }

  // Listar credenciais compartilhadas
  async getSharedCredentials(): Promise<SharedGoogleCredentials[]> {
    try {
      console.log('📋 Listando credenciais compartilhadas...');

      const { data, error } = await supabase
        .from('shared_google_credentials')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('❌ Erro ao listar credenciais compartilhadas:', error);
        throw error;
      }

      console.log('✅ Credenciais compartilhadas encontradas:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar credenciais compartilhadas:', error);
      return [];
    }
  }

  // Atualizar credenciais Google (para o gerenciador)
  async updateGoogleCredentials(
    clienteId: string, 
    clientId: string, 
    clientSecret: string,
    redirectUri: string, 
    calendarId?: string
  ): Promise<boolean> {
    try {
      console.log('💾 Atualizando credenciais Google para cliente:', clienteId);

      const credentialData = {
        cliente_id: clienteId,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        calendar_id: calendarId || null,
        configured: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('google_credentials')
        .upsert(credentialData, { 
          onConflict: 'cliente_id,client_id,client_secret',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('❌ Erro ao atualizar credenciais Google:', error);
        throw error;
      }

      console.log('✅ Credenciais Google atualizadas com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar credenciais Google no Supabase:', error);
      return false;
    }
  }

  // Verificar se um cliente já está usando credenciais específicas
  async isClientUsingCredentials(clientId: string, clientSecret: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('google_credentials')
        .select('cliente_id')
        .eq('client_id', clientId)
        .eq('client_secret', clientSecret)
        .eq('cliente_id', this.currentClienteId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar credenciais do cliente:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Erro ao verificar credenciais do cliente:', error);
      return false;
    }
  }
}

// Instância singleton
export const sharedGoogleCredentialsService = SharedGoogleCredentialsService.getInstance();

// Interface para compatibilidade com o componente
export interface ClienteGoogleConfig {
  cliente_id: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  calendar_id?: string;
}
