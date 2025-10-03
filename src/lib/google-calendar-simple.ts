import { GoogleCalendarEvent } from '@/types/google-calendar';

// Configurações do Google Calendar API (usando .env diretamente)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:8080/auth/google/callback';

// Scopes necessários para acessar o Google Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];

// ID do calendário padrão (primary = calendário principal do usuário)
const DEFAULT_CALENDAR_ID = 'primary';

// Função para gerar code verifier (PKCE)
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Função para gerar code challenge (PKCE)
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export class GoogleCalendarServiceSimple {
  private accessToken: string | null = null;

  constructor() {
    // Carregar token salvo no localStorage
    this.loadSavedToken();
  }

  // Carregar token salvo
  private loadSavedToken(): void {
    try {
      const savedTokens = localStorage.getItem('google_calendar_tokens');
      if (savedTokens) {
        const tokens = JSON.parse(savedTokens);
        this.accessToken = tokens.access_token;
        console.log('✅ Token carregado do localStorage');
      }
    } catch (error) {
      console.log('⚠️ Nenhum token salvo encontrado');
    }
  }

  // Salvar token no localStorage
  private saveToken(tokens: any): void {
    try {
      localStorage.setItem('google_calendar_tokens', JSON.stringify(tokens));
      this.accessToken = tokens.access_token;
      console.log('✅ Token salvo no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar token:', error);
    }
  }

  // Gerar URL de autorização com PKCE
  async getAuthUrl(): Promise<string> {
    console.log('🔗 Gerando URL de autorização...');
    
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Salvar code verifier no localStorage para persistir durante o redirecionamento
    localStorage.setItem('google_code_verifier', codeVerifier);
    console.log('💾 Code verifier salvo no localStorage');
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      scope: SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'select_account consent',
      include_granted_scopes: 'true',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    console.log('🔗 Gerando URL de autorização com credenciais do .env');
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Trocar código de autorização por tokens usando PKCE
  async exchangeCodeForTokens(code: string) {
    try {
      console.log('🔄 Iniciando troca de código por tokens...');
      
      const codeVerifier = localStorage.getItem('google_code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier não encontrado no localStorage');
      }

      const requestBody = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
        code_verifier: codeVerifier,
      });

      console.log('📤 Enviando requisição para obter tokens...');

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
      });

      console.log('📡 Status da resposta:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erro detalhado da API:', errorData);
        throw new Error(`Erro ao obter tokens: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const tokens = await response.json();
      console.log('✅ Tokens recebidos com sucesso');
      
      // Limpar code verifier após uso
      localStorage.removeItem('google_code_verifier');
      
      // Salvar tokens
      this.saveToken(tokens);
      
      return tokens;
    } catch (error) {
      console.error('❌ Erro ao obter tokens:', error);
      throw error;
    }
  }

  // Obter eventos do calendário
  async getEvents(calendarId: string = DEFAULT_CALENDAR_ID, maxResults: number = 50) {
    try {
      if (!this.accessToken) {
        console.error('❌ Access token não encontrado');
        throw new Error('Não autenticado');
      }

      console.log('🔍 Buscando eventos do Google Calendar...');

      // Buscar eventos dos próximos 30 dias
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const params = new URLSearchParams({
        timeMin: timeMin,
        timeMax: timeMax,
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
      console.log('🌐 URL da requisição:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        
        if (response.status === 401) {
          throw new Error('Token de acesso inválido ou expirado');
        } else if (response.status === 403) {
          throw new Error('Permissões insuficientes para acessar o calendário');
        } else if (response.status === 404) {
          throw new Error('Calendário não encontrado');
        } else {
          throw new Error(`Erro ao buscar eventos: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('✅ Dados recebidos:', data);
      console.log('📊 Número de eventos:', data.items?.length || 0);

      return data.items || [];
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      throw error;
    }
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Fazer logout
  async revokeToken() {
    try {
      if (this.accessToken) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST',
        });
      }
      this.accessToken = null;
      localStorage.removeItem('google_calendar_tokens');
      console.log('🧹 Tokens removidos');
    } catch (error) {
      console.error('Erro ao revogar token:', error);
    }
  }
}

// Instância singleton
export const googleCalendarServiceSimple = new GoogleCalendarServiceSimple();
