import React, { createContext, useContext, useEffect, useState } from 'react';
import { googleCalendarServiceSimple, GoogleCalendarEvent } from '@/lib/google-calendar-simple';
import { sharedGoogleCredentialsService } from '@/lib/google-service.ts';
import { useAuth } from './AuthContext';

interface GoogleCalendarContextType {
  isConnected: boolean;
  isLoading: boolean;
  events: GoogleCalendarEvent[];
  connect: () => void;
  disconnect: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  createEvent: (event: Partial<GoogleCalendarEvent>) => Promise<any>;
  updateEvent: (eventId: string, event: Partial<GoogleCalendarEvent>) => Promise<any>;
  deleteEvent: (eventId: string) => Promise<boolean>;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

export function GoogleCalendarProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const { user } = useAuth();

  // Função para salvar estado da conexão no localStorage
  const saveConnectionState = (connected: boolean) => {
    try {
      localStorage.setItem('google_calendar_connected', JSON.stringify(connected));
      console.log('💾 Estado da conexão Google Calendar salvo:', connected);
    } catch (error) {
      console.error('❌ Erro ao salvar estado da conexão:', error);
    }
  };

  // Função para carregar estado da conexão do localStorage
  const loadConnectionState = (): boolean => {
    try {
      const savedState = localStorage.getItem('google_calendar_connected');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        console.log('📅 Estado da conexão Google Calendar carregado:', parsedState);
        return parsedState;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estado da conexão:', error);
    }
    return false;
  };

  // Função para limpar estado da conexão do localStorage
  const clearConnectionState = () => {
    localStorage.removeItem('google_calendar_connected');
    localStorage.removeItem('google_calendar_tokens');
    console.log('🧹 Estado da conexão Google Calendar limpo');
  };

  useEffect(() => {
    // Verificar se já existe uma conexão salva
    const initializeConnection = async () => {
      console.log('🔄 GoogleCalendarContext: Verificando conexão...');
      
      if (!user) {
        console.log('❌ Usuário não autenticado - faça login primeiro');
        return;
      }

      try {
        // Atualizar cliente atual
        sharedGoogleCredentialsService.updateCurrentCliente();
        
        // Verificar se há estado de conexão salvo
        const savedConnectionState = loadConnectionState();
        
        // Verificar tokens salvos no localStorage
        const savedTokens = localStorage.getItem('google_calendar_tokens');
        if (savedTokens && savedConnectionState) {
          console.log('📦 Tokens e estado de conexão encontrados no localStorage');
          const tokens = JSON.parse(savedTokens);
          await googleCalendarServiceSimple.setAuthTokens(tokens);
          setIsConnected(true);
          
          // Aguardar um tick para garantir que o estado seja atualizado
          setTimeout(async () => {
            console.log('🔄 Iniciando busca de eventos após conexão...');
            await refreshEvents();
          }, 200);
        } else {
          console.log('❌ Nenhum token ou estado de conexão encontrado - necessário conectar Google Calendar');
          setIsConnected(false);
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar conexão:', error);
        setIsConnected(false);
      }
    };

    initializeConnection();
  }, [user]);

  const connect = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Iniciando conexão com Google Calendar...');
      
      if (!user) {
        console.error('❌ Usuário não autenticado');
        return;
      }

      // Atualizar cliente atual e limpar cache
      sharedGoogleCredentialsService.updateCurrentCliente();
      googleCalendarServiceSimple.clearCredentialsCache();
      
      const authUrl = await googleCalendarServiceSimple.getAuthUrl();
      console.log('🔗 Redirecionando para:', authUrl);
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('❌ Erro ao conectar Google Calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      // Limpar estado completo
      clearConnectionState();
      
      // Limpar autenticação do serviço
      googleCalendarServiceSimple.clearAuth();
      
      // Atualizar estado
      setIsConnected(false);
      setEvents([]);
      
      console.log('✅ Google Calendar desconectado com sucesso');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const refreshEvents = async () => {
    if (!googleCalendarServiceSimple.isAuth()) {
      console.log('❌ Não autenticado, pulando busca de eventos');
      return;
    }
    
    console.log('🔄 Iniciando busca de eventos...');
    setIsLoading(true);
    try {
      const calendarEvents = await googleCalendarServiceSimple.getEvents();
      console.log('📅 Eventos recebidos:', calendarEvents);
      setEvents(calendarEvents);
      console.log('✅ Eventos atualizados no estado');
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
    } finally {
      setIsLoading(false);
      console.log('🏁 Busca de eventos finalizada');
    }
  };

  const createEvent = async (event: Partial<GoogleCalendarEvent>) => {
    try {
      const newEvent = await googleCalendarServiceSimple.createEvent(event);
      await refreshEvents();
      return newEvent;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  };

  const updateEvent = async (eventId: string, event: Partial<GoogleCalendarEvent>) => {
    try {
      const updatedEvent = await googleCalendarServiceSimple.updateEvent(eventId, event);
      await refreshEvents();
      return updatedEvent;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await googleCalendarServiceSimple.deleteEvent(eventId);
      await refreshEvents();
      return true;
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
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