import { supabaseClientManager } from './supabase-client-manager';

// Usar cliente singleton para evitar múltiplas instâncias
const supabase = supabaseClientManager.getTokensClient();

console.log('🔍 Google Tokens Supabase Config - Client:', supabase ? 'Criado (singleton)' : 'Não disponível');

export { supabase };

export interface GoogleTokens {
  id?: string;
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // Opcional por enquanto
  scope: string;
  token_type: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseGoogleTokensService {
  private static instance: SupabaseGoogleTokensService;
  private currentUserId: string | null = null;

  private constructor() {
    // Não inicializar aqui - será feito quando necessário
  }

  public static getInstance(): SupabaseGoogleTokensService {
    if (!SupabaseGoogleTokensService.instance) {
      SupabaseGoogleTokensService.instance = new SupabaseGoogleTokensService();
    }
    return SupabaseGoogleTokensService.instance;
  }

  // Método para definir o usuário atual
  public setCurrentUser(userId: string) {
    this.currentUserId = userId;
    console.log('👤 Usuário atual definido:', this.currentUserId);
  }

  // Método para obter o usuário atual (com inicialização automática)
  private getCurrentUser(): string {
    if (!this.currentUserId) {
      this.initializeUser();
    }
    return this.currentUserId || 'visitante@kommuchat.com';
  }

  private async initializeUser() {
    try {
      // Verificar se há usuário no localStorage
      const savedUser = localStorage.getItem('kommuchat_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        // Usar cliente_id em vez de email para consistência com credenciais
        this.currentUserId = userData.cliente_id || userData.email;
        console.log('👤 Usuário inicializado do localStorage:', this.currentUserId);
      } else {
        // Fallback para usuário visitante
        this.currentUserId = 'visitante@kommuchat.com';
        console.log('👤 Usuário inicializado (modo visitante):', this.currentUserId);
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar usuário:', error);
      this.currentUserId = 'visitante@kommuchat.com';
    }
  }

  // Salvar tokens no Supabase
  async saveTokens(tokens: Omit<GoogleTokens, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<GoogleTokens | null> {
    try {
      const userId = this.getCurrentUser();
      console.log('💾 Salvando tokens no Supabase para usuário:', userId);

      const tokenData = {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        // expires_at não incluído por enquanto (coluna não existe na tabela)
        updated_at: new Date().toISOString(),
      };

      // Usar o cliente Supabase diretamente
      if (!supabase) {
        throw new Error('Cliente Supabase não disponível');
      }

      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .insert(tokenData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar tokens:', error);
        throw new Error(`Erro ao salvar tokens: ${error.message}`);
      }

      console.log('✅ Tokens salvos com sucesso');
      return data;

    } catch (error) {
      console.error('❌ Erro ao salvar tokens no Supabase:', error);
      throw error;
    }
  }

  // Buscar tokens do Supabase
  async getTokens(): Promise<GoogleTokens | null> {
    try {
      const userId = this.getCurrentUser();
      console.log('🔍 Buscando tokens no Supabase para usuário:', userId);

      // Usar o cliente Supabase diretamente
      if (!supabase) {
        throw new Error('Cliente Supabase não disponível');
      }

      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar tokens:', error);
        throw new Error(`Erro ao buscar tokens: ${error.message}`);
      }

      if (data) {
        console.log('✅ Tokens encontrados:', data);
        return data;
      } else {
        console.log('ℹ️ Nenhum token encontrado para o usuário');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar tokens do Supabase:', error);
      throw error;
    }
  }

  // Deletar tokens do Supabase
  async deleteTokens(): Promise<boolean> {
    try {
      const userId = this.getCurrentUser();
      console.log('🗑️ Deletando tokens do Supabase para usuário:', userId);

      // Usar o cliente Supabase diretamente
      if (!supabase) {
        throw new Error('Cliente Supabase não disponível');
      }

      const { error } = await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao deletar tokens:', error);
        throw new Error(`Erro ao deletar tokens: ${error.message}`);
      }

      console.log('✅ Tokens deletados com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar tokens do Supabase:', error);
      throw error;
    }
  }

  // Verificar se os tokens estão expirados
  isTokenExpired(tokens: GoogleTokens): boolean {
    if (!tokens.expires_at) {
      return false; // Se não há data de expiração, assumimos que não expira
    }

    const now = Date.now();
    const expiresAt = tokens.expires_at * 1000; // Converter para milissegundos
    
    return now >= expiresAt;
  }

  // Renovar tokens se necessário
  async refreshTokensIfNeeded(tokens: GoogleTokens): Promise<GoogleTokens | null> {
    if (!this.isTokenExpired(tokens)) {
      console.log('✅ Tokens ainda válidos');
      return tokens;
    }

    if (!tokens.refresh_token) {
      console.log('❌ Token expirado e sem refresh_token');
      return null;
    }

    try {
      console.log('🔄 Renovando tokens expirados...');
      
      // Aqui você implementaria a lógica de renovação de tokens
      // Por enquanto, vamos apenas retornar null para forçar nova autenticação
      console.log('⚠️ Renovação de tokens não implementada, requer nova autenticação');
      return null;
    } catch (error) {
      console.error('❌ Erro ao renovar tokens:', error);
      return null;
    }
  }
}

// Instância singleton
export const supabaseGoogleTokensService = SupabaseGoogleTokensService.getInstance();
