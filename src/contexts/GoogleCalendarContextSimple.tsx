import React, { createContext, useContext, useEffect, useState } from 'react';
import { googleCalendarServiceHybrid } from '@/lib/google-calendar-hybrid';
import { GoogleCalendarEvent } from '@/types/google-calendar';
import { sharedGoogleCredentialsService } from '@/lib/google-service.ts';
import { supabaseGoogleTokensService } from '@/lib/supabase-google-tokens';
import { useAuth } from './AuthContext';

interface GoogleCalendarContextType {
  isConnected: boolean;
  isLoading: boolean;
  events: GoogleCalendarEvent[];
  connect: () => void;
  disconnect: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  getCalendarList: () => Promise<any[]>;
  selectedCalendars: string[];
  setSelectedCalendars: (calendars: string[]) => void;
  getTokenInfo: () => { isValid: boolean; expiresAt?: Date; timeUntilExpiry?: number };
  forceRefreshToken: () => Promise<boolean>;
  createEvent: (event: Partial<GoogleCalendarEvent>, calendarId?: string) => Promise<GoogleCalendarEvent>;
  updateEvent: (eventId: string, event: Partial<GoogleCalendarEvent>, calendarId?: string) => Promise<GoogleCalendarEvent>;
  deleteEvent: (eventId: string, calendarId?: string, deleteScope?: 'single' | 'all', recurringEventId?: string) => Promise<boolean>;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

export function GoogleCalendarProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  // Função para salvar estado da conexão no localStorage (cache local apenas)
  const saveConnectionState = (connected: boolean) => {
    try {
      localStorage.setItem('google_calendar_connected', String(connected));
      console.log('💾 Estado da conexão Google Calendar salvo:', connected);
    } catch (error) {
      console.error('❌ Erro ao salvar estado da conexão:', error);
    }
  };

  // Função para limpar estado da conexão do localStorage (APENAS quando usuário clica em desconectar)
  const clearConnectionState = () => {
    localStorage.removeItem('google_calendar_connected');
    console.log('🧹 Estado da conexão Google Calendar limpo (desconexão manual)');
  };

  // Efeito para recarregar eventos quando calendários selecionados mudarem
  useEffect(() => {
    if (isConnected && selectedCalendars.length > 0) {
      console.log('🔄 Calendários selecionados mudaram, recarregando eventos...');
      refreshEvents();
    }
  }, [selectedCalendars]);

  useEffect(() => {
    // Aguardar o AuthContext terminar de carregar
    if (authLoading) {
      console.log('⏳ GoogleCalendarContext: Aguardando autenticação...');
      return;
    }

    // Verificar se já existe uma conexão salva no Supabase
    const initializeConnection = async () => {
      console.log('🔄 GoogleCalendarContext: Verificando conexão no Supabase...');
      
      if (!user) {
        console.log('❌ Usuário não autenticado - faça login primeiro');
        setIsConnected(false);
        setEvents([]);
        return;
      }

      try {
        // Atualizar último usuário
        const currentUserId = user.id;
        setLastUserId(currentUserId);
        
        // Definir cliente_id antes de verificar autenticação
        if (user.cliente_id) {
          console.log('🏢 Definindo cliente_id para Google Calendar:', user.cliente_id);
          sharedGoogleCredentialsService.setCurrentCliente(user.cliente_id);
          supabaseGoogleTokensService.setCurrentUser(user.cliente_id);
        }
        
        // Verificar se há tokens no Supabase (única fonte de verdade)
        const hasValidConnection = await googleCalendarServiceHybrid.hasValidConnection();
        
        if (hasValidConnection) {
          console.log('✅ Conexão Google Calendar encontrada no Supabase - conectando...');
          setIsConnected(true);
          saveConnectionState(true);
          
          // Buscar eventos
          setTimeout(async () => {
            console.log('🔄 Iniciando busca de eventos...');
            try {
              await refreshEvents();
            } catch (error) {
              console.log('⚠️ Erro ao buscar eventos, mas mantendo conexão ativa:', error);
            }
          }, 200);
        } else {
          console.log('❌ Nenhum token encontrado no Supabase - necessário conectar Google Calendar');
          setIsConnected(false);
          clearConnectionState();
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar conexão:', error);
        setIsConnected(false);
        setEvents([]);
      }
    };

    initializeConnection();
  }, [user, authLoading]);

  const connect = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Iniciando conexão com Google Calendar...');

      if (!user) {
        console.error('❌ Usuário não autenticado');
        return;
      }

      // Definir cliente_id antes de conectar
      if (user.cliente_id) {
        console.log('🏢 Definindo cliente_id para conexão:', user.cliente_id);
        sharedGoogleCredentialsService.setCurrentCliente(user.cliente_id);
        supabaseGoogleTokensService.setCurrentUser(user.cliente_id);
      }

      // Limpar cache e code verifier antigos
      googleCalendarServiceHybrid.clearTokenCache();
      localStorage.removeItem('google_code_verifier');
      console.log('🧹 Cache limpo, iniciando nova conexão...');
      
      const authUrl = await googleCalendarServiceHybrid.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erro ao gerar URL de autorização:', error);
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      // Limpar estado completo
      clearConnectionState();
      
      // Revogar token e limpar cache
      await googleCalendarServiceHybrid.revokeToken();
      
      // Atualizar estado
      setIsConnected(false);
      setEvents([]);
      
      console.log('✅ Google Calendar desconectado com sucesso - estado limpo');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const getCalendarList = async () => {
    try {
      // Garantir token válido via Supabase
      const tokenValid = await googleCalendarServiceHybrid.ensureValidToken();
      if (!tokenValid) {
        throw new Error('Token de acesso não encontrado ou inválido');
      }

      console.log('🔍 Buscando lista de calendários...');
      
      // getEvents já usa o accessToken internamente via ensureValidToken
      const tokenInfo = googleCalendarServiceHybrid.getTokenInfo();
      if (!tokenInfo.isValid) {
        throw new Error('Token de acesso inválido');
      }

      // Usar getAllEventsFromAllCalendars que já tem a lógica de buscar calendários
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${googleCalendarServiceHybrid['accessToken']}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta da API:', errorText);
        throw new Error(`Erro ao buscar calendários: ${response.status}`);
      }

      const data = await response.json();
      console.log('📅 Lista de calendários recebida:', data.items);
      return data.items || [];
    } catch (error) {
      console.error('❌ Erro ao buscar lista de calendários:', error);
      throw error;
    }
  };

  const refreshEvents = async () => {
    console.log('🔄 F5 - Recarregamento completo do calendário iniciado...');
    setIsLoading(true);
    
    // Limpar eventos atuais para feedback visual imediato
    setEvents([]);
    
    try {
      // Pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verificar e renovar token automaticamente se necessário (via Supabase)
      console.log('🔍 Verificando validade do token no Supabase...');
      const tokenValid = await googleCalendarServiceHybrid.ensureValidToken();
      if (!tokenValid) {
        console.log('❌ Token inválido e não foi possível renovar - necessário nova autenticação');
        setIsConnected(false);
        clearConnectionState();
        setEvents([]);
        return;
      }
      console.log('✅ Token válido - prosseguindo com busca de eventos');
      
      // Usar a nova função que busca em todas as agendas com período estendido
      const calendarEvents = await googleCalendarServiceHybrid.getAllEventsFromAllCalendars();
      console.log('📅 Total de eventos recebidos de todas as agendas:', calendarEvents.length);
      
      // Agrupar eventos por calendário para debug
      const eventsByCalendar = calendarEvents.reduce((acc: Record<string, number>, event: any) => {
        const calId = event.calendarId || 'sem-id';
        const calName = event.calendarSummary || 'Sem nome';
        const key = `${calName} (${calId})`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Eventos por calendário:', eventsByCalendar);
      
      // Filtrar eventos apenas dos calendários selecionados (se houver filtro ativo)
      let filteredEvents = calendarEvents;
      
      if (selectedCalendars.length > 0) {
        filteredEvents = calendarEvents.filter((event: any) => {
          return selectedCalendars.includes(event.calendarId || '');
        });
        console.log(`📅 Filtro ativo: ${selectedCalendars.length} calendários selecionados`);
        console.log(`📅 Eventos após filtro: ${filteredEvents.length} (de ${calendarEvents.length} total)`);
      } else {
        console.log('📅 Sem filtro ativo - mostrando TODOS os eventos');
      }
      
      setEvents(filteredEvents as GoogleCalendarEvent[]);
      console.log('✅ Calendário recarregado com sucesso');
      
      // Garantir que o estado de conexão seja salvo após sucesso
      saveConnectionState(true);
      setIsConnected(true);
      
    } catch (error: any) {
      console.error('❌ Erro ao recarregar calendário:', error);
      
      // Verificar se é erro de token expirado
      if (error.message && (error.message.includes('Token expirado') || error.message.includes('nova autenticação'))) {
        console.log('🔄 Token expirado - desconectando automaticamente');
        setIsConnected(false);
        clearConnectionState();
        setEvents([]);
        return;
      }
      
      // Para outros erros, verificar se ainda há conexão válida
      const stillValid = await googleCalendarServiceHybrid.hasValidConnection();
      if (stillValid) {
        console.log('🔗 Conexão ainda válida no Supabase - mantendo conectado');
        setIsConnected(true);
      } else {
        setIsConnected(false);
        clearConnectionState();
      }
    } finally {
      setIsLoading(false);
      console.log('🏁 Recarregamento do calendário finalizado');
    }
  };

  // Obter informações do token
  const getTokenInfo = () => {
    return googleCalendarServiceHybrid.getTokenInfo();
  };

  // Forçar renovação de token
  const forceRefreshToken = async () => {
    try {
      console.log('🔄 Forçando renovação de token...');
      const success = await googleCalendarServiceHybrid.forceRefreshToken();
      if (success) {
        console.log('✅ Token renovado com sucesso');
        // Recarregar eventos após renovação
        await refreshEvents();
      }
      return success;
    } catch (error) {
      console.error('❌ Erro ao forçar renovação de token:', error);
      return false;
    }
  };

  // Criar evento
  const createEvent = async (event: Partial<GoogleCalendarEvent>, calendarId?: string) => {
    try {
      setIsLoading(true);
      const newEvent = await googleCalendarServiceHybrid.createEvent(event, calendarId);
      // Recarregar eventos após criar
      await refreshEvents();
      return newEvent;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar evento
  const updateEvent = async (eventId: string, event: Partial<GoogleCalendarEvent>, calendarId?: string) => {
    try {
      setIsLoading(true);
      const updatedEvent = await googleCalendarServiceHybrid.updateEvent(eventId, event, calendarId);
      // Recarregar eventos após atualizar
      await refreshEvents();
      return updatedEvent;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar evento
  const deleteEvent = async (eventId: string, calendarId?: string, deleteScope: 'single' | 'all' = 'single', recurringEventId?: string) => {
    try {
      setIsLoading(true);
      await googleCalendarServiceHybrid.deleteEvent(eventId, calendarId, deleteScope, recurringEventId);
      await refreshEvents();
      return true;
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleCalendarContext.Provider value={{
      isConnected,
      isLoading,
      events,
      connect,
      disconnect,
      refreshEvents,
      getCalendarList,
      selectedCalendars,
      setSelectedCalendars,
      getTokenInfo,
      forceRefreshToken,
      createEvent,
      updateEvent,
      deleteEvent,
    }}>
      {children}
    </GoogleCalendarContext.Provider>
  );
}

export function useGoogleCalendar() {
  const context = useContext(GoogleCalendarContext);
  if (context === undefined) {
    throw new Error('useGoogleCalendar deve ser usado dentro de um GoogleCalendarProvider');
  }
  return context;
}
