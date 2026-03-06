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
  expires_at?: string;
  scope?: string;
  token_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SaveTokensInput {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
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

  // Salvar tokens no Supabase (UPSERT - insere ou atualiza)
  async saveTokens(tokens: SaveTokensInput): Promise<GoogleTokens | null> {
    try {
      const userId = this.getCurrentUser();
      console.log('💾 Salvando tokens no Supabase para usuário:', userId);

      // Calcular expires_at baseado em expires_in (segundos)
      // expires_in vem do Google, geralmente ~3600 (1 hora)
      const expiresAt = tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString(); // Default 1 hora

      const tokenData = {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope || 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
        token_type: tokens.token_type || 'Bearer',
        updated_at: new Date().toISOString(),
      };

      console.log('📤 Dados a salvar:', { 
        user_id: tokenData.user_id, 
        expires_at: tokenData.expires_at,
        has_refresh_token: !!tokenData.refresh_token 
      });

      // Usar UPSERT: insere ou atualiza se user_id já existir
      const response = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(tokenData)
      });

      console.log('📡 Status da resposta:', response.status);

      if (response.ok) {
        const savedData = await response.json();
        console.log('✅ Tokens salvos com sucesso no Supabase');
        return Array.isArray(savedData) ? savedData[0] : savedData;
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

  // Atualizar apenas access_token após renovação
  async updateAccessToken(accessToken: string, expiresIn: number): Promise<boolean> {
    try {
      const userId = this.getCurrentUser();
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      console.log('🔄 Atualizando access_token no Supabase para usuário:', userId);

      const response = await fetch(
        `${supabaseUrl}/rest/v1/google_calendar_tokens?user_id=eq.${encodeURIComponent(userId)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (response.ok) {
        console.log('✅ Access token atualizado no Supabase');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao atualizar access_token:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar access_token no Supabase:', error);
      return false;
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

  // Verificar se os tokens estão expirados ou próximos de expirar
  isTokenExpired(tokens: GoogleTokens, bufferMinutes: number = 5): boolean {
    if (!tokens.expires_at) {
      console.log('⚠️ Token sem expires_at - considerando como não expirado');
      return false;
    }

    const now = Date.now();
    const expiresAt = new Date(tokens.expires_at).getTime();
    const bufferTime = bufferMinutes * 60 * 1000;
    
    const isExpired = now >= (expiresAt - bufferTime);
    
    if (isExpired) {
      console.log('⏰ Token expirado ou próximo de expirar');
    }
    
    return isExpired;
  }

  // Verificar se há conexão válida (tem tokens no Supabase)
  async hasValidConnection(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      return tokens !== null && !!tokens.refresh_token;
    } catch {
      return false;
    }
  }

  // Obter tempo restante até expiração (em milissegundos)
  getTimeUntilExpiry(tokens: GoogleTokens): number {
    if (!tokens.expires_at) {
      return Infinity;
    }
    const expiresAt = new Date(tokens.expires_at).getTime();
    return Math.max(0, expiresAt - Date.now());
  }
}

// Instância singleton
export const supabaseGoogleTokensService = SupabaseGoogleTokensService.getInstance();
