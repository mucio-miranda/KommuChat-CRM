import { GoogleCalendarEvent } from '@/types/google-calendar';
import { sharedGoogleCredentialsService } from './google-service.ts';

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

export class GoogleCalendarServiceHybrid {
  private accessToken: string | null = null;
  private currentCredentials: any = null;

  constructor() {
    // Carregar token salvo no localStorage
    this.loadSavedToken();
  }

  // Carregar credenciais do cliente atual do Supabase
  private async loadCredentials(): Promise<any> {
    if (this.currentCredentials) {
      console.log('🔄 Usando credenciais em cache:', this.currentCredentials.client_id);
      return this.currentCredentials;
    }

    try {
      console.log('🔍 Carregando credenciais do cliente atual...');
      
      // Buscar credenciais específicas do cliente no Supabase
      const clientCredentials = await sharedGoogleCredentialsService.getCurrentUserGoogleCredentials();
      
      if (clientCredentials?.configured && clientCredentials.client_id) {
        console.log('✅ Usando credenciais específicas do cliente');
        this.currentCredentials = clientCredentials;
        return clientCredentials;
      }
      
      throw new Error('Credenciais Google não configuradas para este cliente. Configure as credenciais no Gerenciador de Usuários.');
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais:', error);
      throw error;
    }
  }

  // Carregar token salvo
  private loadSavedToken(): void {
    try {
      const savedTokens = localStorage.getItem('google_calendar_tokens');
      if (savedTokens) {
        const tokens = JSON.parse(savedTokens);
        this.accessToken = tokens.access_token;
        console.log('✅ Token carregado do localStorage');
        
        // Verificar se o token está expirado
        if (tokens.expires_at && new Date() > new Date(tokens.expires_at)) {
          console.log('⚠️ Token expirado, será necessário renovar');
          this.accessToken = null;
          localStorage.removeItem('google_calendar_tokens');
        }
      }
    } catch (error) {
      console.log('⚠️ Nenhum token salvo encontrado');
    }
  }

  // Salvar token no localStorage
  private saveToken(tokens: any): void {
    try {
      // Adicionar timestamp de expiração se não existir
      if (!tokens.expires_at && tokens.expires_in) {
        tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
      }
      
      localStorage.setItem('google_calendar_tokens', JSON.stringify(tokens));
      this.accessToken = tokens.access_token;
      console.log('✅ Token salvo no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar token:', error);
    }
  }

  // Verificar se o token está expirado ou próximo da expiração
  private isTokenExpiredOrNearExpiry(tokens: any, bufferMinutes: number = 5): boolean {
    if (!tokens.expires_at) {
      return false; // Se não há data de expiração, assumir que não expira
    }

    const now = Date.now();
    const expiresAt = tokens.expires_at;
    const bufferTime = bufferMinutes * 60 * 1000; // Converter minutos para milissegundos

    return now >= (expiresAt - bufferTime);
  }

  // Renovar token usando refresh token
  async refreshAccessToken(): Promise<boolean> {
    try {
      console.log('🔄 Iniciando renovação de token...');
      
      const savedTokens = localStorage.getItem('google_calendar_tokens');
      if (!savedTokens) {
        console.log('❌ Nenhum token salvo encontrado para renovação');
        return false;
      }

      const tokens = JSON.parse(savedTokens);
      if (!tokens.refresh_token) {
        console.log('❌ Refresh token não encontrado - necessário nova autenticação');
        return false;
      }

      // Obter credenciais do cliente atual
      const credentials = await this.loadCredentials();

      const requestBody = new URLSearchParams({
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      });

      console.log('📤 Enviando requisição para renovar token...');

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erro ao renovar token:', errorData);
        return false;
      }

      const newTokens = await response.json();
      console.log('✅ Token renovado com sucesso');

      // Manter o refresh_token original se não foi fornecido um novo
      if (!newTokens.refresh_token && tokens.refresh_token) {
        newTokens.refresh_token = tokens.refresh_token;
      }

      // Salvar novos tokens
      this.saveToken(newTokens);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      return false;
    }
  }

  // Verificar e renovar token se necessário
  async ensureValidToken(): Promise<boolean> {
    try {
      const savedTokens = localStorage.getItem('google_calendar_tokens');
      if (!savedTokens) {
        console.log('❌ Nenhum token encontrado');
        return false;
      }

      const tokens = JSON.parse(savedTokens);
      
      // Verificar se o token está expirado ou próximo da expiração
      if (this.isTokenExpiredOrNearExpiry(tokens)) {
        console.log('⚠️ Token expirado ou próximo da expiração - renovando...');
        return await this.refreshAccessToken();
      }

      console.log('✅ Token ainda válido');
      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar token:', error);
      return false;
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
    
    // Obter credenciais do cliente atual
    const credentials = await this.loadCredentials();
    
    const params = new URLSearchParams({
      client_id: credentials.client_id,
      redirect_uri: credentials.redirect_uri,
      scope: SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'select_account consent',
      include_granted_scopes: 'true',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    console.log('🔗 Gerando URL de autorização com credenciais do cliente');
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

      // Obter credenciais do cliente atual
      const credentials = await this.loadCredentials();

      const requestBody = new URLSearchParams({
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: credentials.redirect_uri,
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
      // Verificar e renovar token se necessário antes de fazer a requisição
      const tokenValid = await this.ensureValidToken();
      if (!tokenValid) {
        console.error('❌ Token inválido e não foi possível renovar');
        throw new Error('Token expirado - necessário nova autenticação');
      }

      if (!this.accessToken) {
        console.error('❌ Access token não encontrado após verificação');
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

  // Obter eventos de TODAS as agendas com período estendido
  async getAllEventsFromAllCalendars(maxResults: number = 1500) {
    try {
      // Verificar e renovar token se necessário antes de fazer a requisição
      const tokenValid = await this.ensureValidToken();
      if (!tokenValid) {
        console.error('❌ Token inválido e não foi possível renovar');
        throw new Error('Token expirado - necessário nova autenticação');
      }

      if (!this.accessToken) {
        console.error('❌ Access token não encontrado após verificação');
        throw new Error('Não autenticado');
      }

      console.log('🔍 Buscando eventos de TODAS as agendas do Google Calendar...');

      // 1. Primeiro, obter lista de todas as agendas
      const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!calendarsResponse.ok) {
        throw new Error(`Erro ao buscar agendas: ${calendarsResponse.status}`);
      }

      const calendarsData = await calendarsResponse.json();
      const calendars = calendarsData.items || [];
      
      console.log(`📅 Encontradas ${calendars.length} agendas:`);
      calendars.forEach(cal => {
        console.log(`  - ${cal.summary} (${cal.id}) - Selecionada: ${cal.selected !== false}`);
      });

      // 2. Definir período: 3 meses para trás e 3 meses para frente
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()).toISOString();
      
      console.log(`📅 Período de busca: ${timeMin} até ${timeMax}`);

      // 3. Buscar eventos de cada agenda
      const allEvents = [];
      const promises = calendars.map(async (calendar) => {
        try {
          console.log(`🔍 Buscando eventos da agenda: ${calendar.summary} (${calendar.id})...`);
          
          const params = new URLSearchParams({
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: maxResults.toString(),
            singleEvents: 'true',
            orderBy: 'startTime',
            showDeleted: 'false', // Não mostrar eventos deletados
          });

          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const events = data.items || [];
            
            console.log(`📊 Agenda "${calendar.summary}": ${events.length} eventos encontrados`);
            
            // Log detalhado dos primeiros 3 eventos (para debug)
            if (events.length > 0) {
              console.log(`📋 Primeiros eventos de "${calendar.summary}":`);
              events.slice(0, 3).forEach(event => {
                const startDate = event.start?.dateTime || event.start?.date || 'sem data';
                console.log(`  - ${event.summary || 'Sem título'} (${startDate})`);
              });
            }
            
            // Adicionar informações da agenda a cada evento
            const eventsWithCalendar = events.map(event => ({
              ...event,
              calendarId: calendar.id,
              calendarSummary: calendar.summary,
              calendarColor: calendar.backgroundColor || '#1a73e8'
            }));
            
            console.log(`✅ ${events.length} eventos processados da agenda: ${calendar.summary}`);
            return eventsWithCalendar;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Erro ao buscar eventos da agenda ${calendar.summary}: ${response.status} - ${errorText}`);
            return [];
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar eventos da agenda ${calendar.summary}:`, error);
          return [];
        }
      });

      // 4. Aguardar todas as buscas e combinar resultados
      const results = await Promise.all(promises);
      results.forEach(events => {
        allEvents.push(...events);
      });

      // 5. Ordenar todos os eventos por data de início
      allEvents.sort((a, b) => {
        const dateA = new Date(a.start?.dateTime || a.start?.date || 0);
        const dateB = new Date(b.start?.dateTime || b.start?.date || 0);
        return dateA.getTime() - dateB.getTime();
      });

      console.log(`\n🎉 ========== RESUMO DA BUSCA ==========`);
      console.log(`📅 Total de calendários verificados: ${calendars.length}`);
      console.log(`📊 Total de eventos encontrados: ${allEvents.length}`);
      console.log(`📅 Período: ${new Date(timeMin).toLocaleDateString('pt-BR')} até ${new Date(timeMax).toLocaleDateString('pt-BR')}`);
      console.log(`=======================================\n`);
      
      return allEvents;

    } catch (error) {
      console.error('❌ Erro ao buscar eventos de todas as agendas:', error);
      throw error;
    }
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Obter informações sobre o token atual
  getTokenInfo(): { isValid: boolean; expiresAt?: Date; timeUntilExpiry?: number } {
    try {
      const savedTokens = localStorage.getItem('google_calendar_tokens');
      if (!savedTokens) {
        return { isValid: false };
      }

      const tokens = JSON.parse(savedTokens);
      if (!tokens.expires_at) {
        return { isValid: true }; // Se não há data de expiração, assumir válido
      }

      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      return {
        isValid: timeUntilExpiry > 0,
        expiresAt,
        timeUntilExpiry: Math.max(0, timeUntilExpiry)
      };
    } catch (error) {
      console.error('❌ Erro ao obter informações do token:', error);
      return { isValid: false };
    }
  }

  // Método público para forçar renovação de token
  async forceRefreshToken(): Promise<boolean> {
    console.log('🔄 Forçando renovação de token...');
    return await this.refreshAccessToken();
  }

  // Validar se o token ainda é válido
  async validateToken(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    try {
      // Fazer uma requisição simples para testar o token
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        console.log('❌ Token inválido ou expirado');
        this.accessToken = null;
        localStorage.removeItem('google_calendar_tokens');
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error('❌ Erro ao validar token:', error);
      return false;
    }
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

  // Criar evento no Google Calendar
  async createEvent(event: Partial<GoogleCalendarEvent>, calendarId: string = DEFAULT_CALENDAR_ID): Promise<GoogleCalendarEvent> {
    try {
      // Verificar e renovar token se necessário
      const tokenValid = await this.ensureValidToken();
      if (!tokenValid) {
        throw new Error('Token expirado - necessário nova autenticação');
      }

      if (!this.accessToken) {
        throw new Error('Não autenticado');
      }

      console.log('➕ Criando evento no Google Calendar...');

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao criar evento:', errorText);
        throw new Error(`Erro ao criar evento: ${response.status} ${response.statusText}`);
      }

      const createdEvent = await response.json();
      console.log('✅ Evento criado com sucesso:', createdEvent.id);
      return createdEvent;
    } catch (error) {
      console.error('❌ Erro ao criar evento:', error);
      throw error;
    }
  }

  // Atualizar evento no Google Calendar
  async updateEvent(eventId: string, event: Partial<GoogleCalendarEvent>, calendarId: string = DEFAULT_CALENDAR_ID): Promise<GoogleCalendarEvent> {
    try {
      // Verificar e renovar token se necessário
      const tokenValid = await this.ensureValidToken();
      if (!tokenValid) {
        throw new Error('Token expirado - necessário nova autenticação');
      }

      if (!this.accessToken) {
        throw new Error('Não autenticado');
      }

      console.log('✏️ Atualizando evento no Google Calendar...', eventId);

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao atualizar evento:', errorText);
        throw new Error(`Erro ao atualizar evento: ${response.status} ${response.statusText}`);
      }

      const updatedEvent = await response.json();
      console.log('✅ Evento atualizado com sucesso:', updatedEvent.id);
      return updatedEvent;
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      throw error;
    }
  }

  // Deletar evento no Google Calendar
  async deleteEvent(eventId: string, calendarId: string = DEFAULT_CALENDAR_ID): Promise<boolean> {
    try {
      // Verificar e renovar token se necessário
      const tokenValid = await this.ensureValidToken();
      if (!tokenValid) {
        throw new Error('Token expirado - necessário nova autenticação');
      }

      if (!this.accessToken) {
        throw new Error('Não autenticado');
      }

      console.log('🗑️ Deletando evento no Google Calendar...', eventId);

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao deletar evento:', errorText);
        throw new Error(`Erro ao deletar evento: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Evento deletado com sucesso:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar evento:', error);
      throw error;
    }
  }
}

// Instância singleton
export const googleCalendarServiceHybrid = new GoogleCalendarServiceHybrid();
