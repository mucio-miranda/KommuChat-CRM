import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase - usar projeto CRM para tokens
const supabaseUrl = import.meta.env.VITE_CRM_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_CRM_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Configurações do Supabase CRM não encontradas - usando fallback');
}

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

      // Usar fetch diretamente para evitar problemas com o cliente Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(tokenData)
      });

      console.log('📡 Status da resposta:', response.status);

      if (response.ok) {
        console.log('✅ Tokens salvos com sucesso');
        return tokenData as GoogleTokens;
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro ao salvar tokens: ${response.status} ${response.statusText}`);
      }
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

      // Usar fetch diretamente para evitar problemas com o cliente Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&user_id=eq.${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📡 Status da resposta:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          console.log('✅ Tokens encontrados:', data[0]);
          return data[0];
        } else {
          console.log('ℹ️ Nenhum token encontrado para o usuário');
          return null;
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro ao buscar tokens: ${response.status} ${response.statusText}`);
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

      // Usar fetch diretamente para evitar problemas com o cliente Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?user_id=eq.${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📡 Status da resposta:', response.status);

      if (response.ok) {
        console.log('✅ Tokens deletados com sucesso');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro ao deletar tokens: ${response.status} ${response.statusText}`);
      }
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
