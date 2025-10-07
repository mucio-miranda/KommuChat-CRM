import { GoogleCalendarEvent } from '@/types/google-calendar';
import { sharedGoogleCredentialsService } from './google-service.ts';

// Configurações globais (fallback)
const DEFAULT_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DEFAULT_GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const DEFAULT_GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:8080/auth/google/callback';
const DEFAULT_CALENDAR_ID = 'primary';

// Declaração global para window.gapi
declare global {
  interface Window {
    gapi: any;
  }
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private isLoaded = false;
  private isAuthenticated = false;
  private accessToken: string | null = null;
  private currentCredentials: any = null;

  private constructor() {}

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  // Carregar a API do Google
  async loadGoogleAPI(): Promise<void> {
    if (this.isLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            });
            this.isLoaded = true;
            console.log('✅ Google API carregada com sucesso');
            resolve();
          } catch (error) {
            console.error('❌ Erro ao inicializar Google API:', error);
            reject(error);
          }
        });
      };
      script.onerror = () => reject(new Error('Falha ao carregar Google API'));
      document.head.appendChild(script);
    });
  }

  // Carregar credenciais do cliente atual
  private async loadCredentials(): Promise<any> {
    if (this.currentCredentials) {
      return this.currentCredentials;
    }

    try {
      console.log('🔍 Carregando credenciais do cliente atual...');
      
      // Buscar credenciais (específicas ou compartilhadas)
      const clientCredentials = await sharedGoogleCredentialsService.getCurrentUserGoogleCredentials();
      
      if (clientCredentials?.configured && clientCredentials.client_id) {
        console.log('✅ Usando credenciais específicas do cliente');
        this.currentCredentials = clientCredentials;
        return clientCredentials;
      }
      
      // Se não encontrar credenciais específicas, erro
      throw new Error('Credenciais Google não configuradas para este cliente. Configure as credenciais no Gerenciador de Usuários.');
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais:', error);
      throw error;
    }
  }

  // Obter URL de autorização
  async getAuthUrl(): string {
    console.log('🔗 Gerando URL de autorização...');
    
    const credentials = await this.loadCredentials();
    const { client_id, redirect_uri } = credentials;
    
    console.log('🔑 Client ID:', client_id);
    console.log('🔗 Redirect URI:', redirect_uri);
    
    if (!client_id) {
      throw new Error('Google Client ID não configurado');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const params = new URLSearchParams({
      client_id: client_id,
      redirect_uri: redirect_uri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'select_account consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('🔗 URL de autorização gerada:', authUrl);
    return authUrl;
  }

  // Trocar código de autorização por tokens
  async exchangeCodeForTokens(code: string): Promise<any> {
    console.log('🔄 Trocando código por tokens...');
    
    const credentials = await this.loadCredentials();
    const { client_id, client_secret, redirect_uri } = credentials;
    
    if (!client_id || !client_secret) {
      throw new Error('Credenciais Google não configuradas');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: client_id,
        client_secret: client_secret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Erro ao trocar código por tokens:', errorData);
      throw new Error(`Erro ao trocar código por tokens: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const tokens = await response.json();
    console.log('✅ Tokens obtidos com sucesso');
    
    // Salvar tokens no localStorage temporariamente
    localStorage.setItem('google_calendar_tokens', JSON.stringify(tokens));
    
    return tokens;
  }

  // Configurar autenticação com tokens
  async setAuthTokens(tokens: any): Promise<void> {
    console.log('🔐 Configurando autenticação...');
    
    if (!this.isLoaded) {
      await this.loadGoogleAPI();
    }

    window.gapi.client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    this.accessToken = tokens.access_token;
    this.isAuthenticated = true;
    console.log('✅ Autenticação configurada');
  }

  // Verificar se está autenticado
  isAuth(): boolean {
    return this.isAuthenticated;
  }

  // Buscar eventos do calendário
  async getEvents(startDate?: string, endDate?: string): Promise<GoogleCalendarEvent[]> {
    console.log('📅 Buscando eventos do Google Calendar...');
    
    if (!this.isAuthenticated) {
      throw new Error('Não autenticado com Google Calendar');
    }

    if (!this.isLoaded) {
      await this.loadGoogleAPI();
    }

    try {
      const credentials = await this.loadCredentials();
      const calendarId = credentials.calendar_id || DEFAULT_CALENDAR_ID;
      
      const response = await window.gapi.client.calendar.events.list({
        calendarId: calendarId,
        timeMin: startDate || new Date().toISOString(),
        timeMax: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.result.items || [];
      console.log(`✅ ${events.length} eventos encontrados`);
      return events;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      throw error;
    }
  }

  // Buscar eventos de TODAS as agendas com período estendido
  async getAllEventsFromAllCalendars(): Promise<GoogleCalendarEvent[]> {
    console.log('📅 Buscando eventos de TODAS as agendas do Google Calendar...');
    
    if (!this.isAuthenticated) {
      throw new Error('Não autenticado com Google Calendar');
    }

    if (!this.isLoaded) {
      await this.loadGoogleAPI();
    }

    try {
      // 1. Obter lista de todas as agendas
      const calendarsResponse = await window.gapi.client.calendar.calendarList.list();
      const calendars = calendarsResponse.result.items || [];
      
      console.log(`📅 Encontradas ${calendars.length} agendas:`);
      calendars.forEach(cal => {
        console.log(`  - ${cal.summary} (${cal.id})`);
      });

      // 2. Definir período: 1 ano para trás e 6 meses para frente
      const now = new Date();
      const timeMin = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()).toISOString();
      
      console.log(`📅 Período de busca: ${timeMin} até ${timeMax}`);

      // 3. Buscar eventos de cada agenda
      const allEvents = [];
      const promises = calendars.map(async (calendar) => {
        try {
          const response = await window.gapi.client.calendar.events.list({
            calendarId: calendar.id,
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
          });

          const events = response.result.items || [];
          
          // Adicionar informações da agenda a cada evento
          const eventsWithCalendar = events.map(event => ({
            ...event,
            calendarId: calendar.id,
            calendarSummary: calendar.summary,
            calendarColor: calendar.backgroundColor || '#1a73e8'
          }));
          
          console.log(`✅ ${events.length} eventos encontrados na agenda: ${calendar.summary}`);
          return eventsWithCalendar;
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

      console.log(`🎉 Total de eventos encontrados em todas as agendas: ${allEvents.length}`);
      return allEvents;

    } catch (error) {
      console.error('❌ Erro ao buscar eventos de todas as agendas:', error);
      throw error;
    }
  }

  // Criar evento
  async createEvent(event: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
    console.log('➕ Criando evento...');
    
    if (!this.isAuthenticated) {
      throw new Error('Não autenticado com Google Calendar');
    }

    if (!this.isLoaded) {
      await this.loadGoogleAPI();
    }

    try {
      const credentials = await this.loadCredentials();
      const calendarId = credentials.calendar_id || DEFAULT_CALENDAR_ID;
      
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
      });

      console.log('✅ Evento criado com sucesso');
      return response.result;
    } catch (error) {
      console.error('❌ Erro ao criar evento:', error);
      throw error;
    }
  }

  // Atualizar evento
  async updateEvent(eventId: string, event: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
    console.log('✏️ Atualizando evento...');
    
    if (!this.isAuthenticated) {
      throw new Error('Não autenticado com Google Calendar');
    }

    if (!this.isLoaded) {
      await this.loadGoogleAPI();
    }

    try {
      const credentials = await this.loadCredentials();
      const calendarId = credentials.calendar_id || DEFAULT_CALENDAR_ID;
      
      const response = await window.gapi.client.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: event,
      });

      console.log('✅ Evento atualizado com sucesso');
      return response.result;
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      throw error;
    }
  }

  // Deletar evento
  async deleteEvent(eventId: string): Promise<void> {
    console.log('🗑️ Deletando evento...');
    
    if (!this.isAuthenticated) {
      throw new Error('Não autenticado com Google Calendar');
    }

    if (!this.isLoaded) {
      await this.loadGoogleAPI();
    }

    try {
      const credentials = await this.loadCredentials();
      const calendarId = credentials.calendar_id || DEFAULT_CALENDAR_ID;
      
      await window.gapi.client.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
      });

      console.log('✅ Evento deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar evento:', error);
      throw error;
    }
  }

  // Limpar autenticação
  clearAuth(): void {
    this.isAuthenticated = false;
    this.accessToken = null;
    this.currentCredentials = null;
    localStorage.removeItem('google_calendar_tokens');
    console.log('🧹 Autenticação limpa');
  }

  // Limpar cache de credenciais
  clearCredentialsCache(): void {
    this.currentCredentials = null;
    console.log('🧹 Cache de credenciais limpo');
  }
}

export const googleCalendarService = GoogleCalendarService.getInstance();