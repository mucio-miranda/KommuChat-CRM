import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton para gerenciar clientes Supabase e evitar múltiplas instâncias
class SupabaseClientManager {
  private static instance: SupabaseClientManager;
  private crmClient: SupabaseClient | null = null;
  private mainClient: SupabaseClient | null = null;
  private tokensClient: SupabaseClient | null = null;

  private constructor() {}

  public static getInstance(): SupabaseClientManager {
    if (!SupabaseClientManager.instance) {
      SupabaseClientManager.instance = new SupabaseClientManager();
    }
    return SupabaseClientManager.instance;
  }

  // Cliente para CRM (usuários, clientes, configurações)
  public getCrmClient(): SupabaseClient | null {
    if (!this.crmClient) {
      const supabaseUrl = import.meta.env.VITE_CRM_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_CRM_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey) {
        this.crmClient = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ CRM Supabase Client criado (singleton)');
      }
    }
    return this.crmClient;
  }

  // Cliente para dados principais (pacientes, contatos)
  public getMainClient(): SupabaseClient | null {
    if (!this.mainClient) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey) {
        this.mainClient = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Main Supabase Client criado (singleton)');
      }
    }
    return this.mainClient;
  }

  // Cliente para tokens Google (reutiliza CRM)
  public getTokensClient(): SupabaseClient | null {
    if (!this.tokensClient) {
      // Reutiliza o cliente CRM para tokens
      this.tokensClient = this.getCrmClient();
      console.log('✅ Tokens Supabase Client reutilizado (singleton)');
    }
    return this.tokensClient;
  }
}

// Instância singleton
export const supabaseClientManager = SupabaseClientManager.getInstance();

// Exports para compatibilidade
export const supabaseCrm = supabaseClientManager.getCrmClient();
export const supabase = supabaseClientManager.getMainClient();
export const supabaseTokens = supabaseClientManager.getTokensClient();
