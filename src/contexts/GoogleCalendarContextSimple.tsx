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
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

export function GoogleCalendarProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  // Função para salvar estado da conexão no localStorage (ULTRA-PERSISTENTE)
  const saveConnectionState = (connected: boolean) => {
    try {
      localStorage.setItem('google_calendar_connected', JSON.stringify(connected));
      localStorage.setItem('google_calendar_ultra_persistent', JSON.stringify(true));
      console.log('💾 Estado da conexão Google Calendar salvo (ULTRA-PERSISTENTE):', connected);
    } catch (error) {
      console.error('❌ Erro ao salvar estado da conexão:', error);
    }
  };

  // Função para carregar estado da conexão do localStorage (ULTRA-PERSISTENTE)
  const loadConnectionState = (): boolean => {
    try {
      const savedState = localStorage.getItem('google_calendar_connected');
      const ultraPersistent = localStorage.getItem('google_calendar_ultra_persistent');
      
      if (savedState && ultraPersistent) {
        const parsedState = JSON.parse(savedState);
        console.log('📅 Estado da conexão Google Calendar carregado (ULTRA-PERSISTENTE):', parsedState);
        return parsedState;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estado da conexão:', error);
    }
    return false;
  };

  // Função para limpar estado da conexão do localStorage (APENAS quando usuário clica em desconectar)
  const clearConnectionState = () => {
    localStorage.removeItem('google_calendar_connected');
    localStorage.removeItem('google_calendar_ultra_persistent');
    console.log('🧹 Estado da conexão Google Calendar limpo (desconexão manual)');
  };

  // Função para tentar renovar tokens automaticamente (ULTRA-PERSISTENTE)
  const tryRenewTokens = async () => {
    try {
      const tokens = localStorage.getItem('google_calendar_tokens');
      if (tokens) {
        const tokenData = JSON.parse(tokens);
        
        // Verificar se o token está próximo do vencimento (renovar 5 minutos antes)
        if (tokenData.expires_in) {
          const now = Date.now();
          const expiresAt = tokenData.created_at + (tokenData.expires_in * 1000);
          const fiveMinutes = 5 * 60 * 1000;
          
          if (now > (expiresAt - fiveMinutes)) {
            console.log('🔄 Token próximo do vencimento - tentando renovar...');
            // Aqui poderia implementar renovação automática se necessário
            // Por enquanto, apenas log
            console.log('⚠️ Renovação automática não implementada - mantendo conexão ativa');
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao verificar renovação de tokens:', error);
    }
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

    // Verificar se já existe uma conexão salva
    const initializeConnection = async () => {
      console.log('🔄 GoogleCalendarContext: Verificando conexão...');
      
      if (!user) {
        console.log('❌ Usuário não autenticado - faça login primeiro');
        // Limpar estado quando não há usuário
        setIsConnected(false);
        setEvents([]);
        return;
      }

      try {
        // Verificar se o usuário mudou (ULTRA-PERSISTENTE)
        const currentUserId = user.id;
        if (lastUserId && lastUserId !== currentUserId) {
          console.log('🔄 Usuário mudou - MANTENDO conexão Google Calendar (ULTRA-PERSISTENTE)...');
          // NUNCA limpar tokens do Google Calendar - conexão ultra-persistente
          // localStorage.removeItem('google_calendar_tokens'); // NUNCA REMOVER
          
          // Verificar se há tokens e forçar reconexão se necessário
          const hasTokens = localStorage.getItem('google_calendar_tokens');
          const hasConnectionState = localStorage.getItem('google_calendar_connected');
          
          if (hasTokens && hasConnectionState) {
            console.log('🔗 Tokens encontrados - forçando reconexão automática...');
            // Forçar reconexão sem limpar nada
            setTimeout(async () => {
              await refreshEvents();
            }, 1000);
          }
        }
        
        // Atualizar último usuário
        setLastUserId(currentUserId);
        
        // Definir cliente_id antes de verificar autenticação
        if (user.cliente_id) {
          console.log('🏢 Definindo cliente_id para Google Calendar:', user.cliente_id);
          sharedGoogleCredentialsService.setCurrentCliente(user.cliente_id);
          supabaseGoogleTokensService.setCurrentUser(user.cliente_id);
        }
        
        // Verificar se há estado de conexão salvo (ULTRA-PERSISTENTE)
        const savedConnectionState = loadConnectionState();
        const hasTokens = localStorage.getItem('google_calendar_tokens');
        
        // Estratégia ultra-persistente: se há tokens OU estado de conexão, manter conectado
        if ((googleCalendarServiceHybrid.isAuthenticated() || hasTokens) && savedConnectionState) {
          console.log('✅ Conexão Google Calendar encontrada (ULTRA-PERSISTENTE) - mantendo conectado');
          setIsConnected(true);
          
          // Forçar salvamento do estado para garantir persistência
          saveConnectionState(true);
          
          // Aguardar um tick para garantir que o estado seja atualizado
          setTimeout(async () => {
            console.log('🔄 Iniciando busca de eventos após conexão (ULTRA-PERSISTENTE)...');
            try {
              // Tentar renovar tokens se necessário
              await tryRenewTokens();
              await refreshEvents();
            } catch (error) {
              console.log('⚠️ Erro ao buscar eventos, mas mantendo conexão ativa:', error);
              // Mesmo com erro, manter como conectado
            }
          }, 200);
        } else if (hasTokens) {
          // Se há tokens mas não há estado de conexão, forçar reconexão
          console.log('🔗 Tokens encontrados sem estado - forçando reconexão (ULTRA-PERSISTENTE)');
          setIsConnected(true);
          saveConnectionState(true);
          
          setTimeout(async () => {
            try {
              await refreshEvents();
            } catch (error) {
              console.log('⚠️ Erro ao buscar eventos, mas mantendo conexão ativa:', error);
            }
          }, 500);
        } else {
          console.log('❌ Nenhum token encontrado - necessário conectar Google Calendar');
          setIsConnected(false);
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar conexão:', error);
        // Em caso de erro, limpar estado
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

      // Limpar dados antigos antes de iniciar nova conexão
      localStorage.removeItem('google_calendar_tokens');
      localStorage.removeItem('google_code_verifier');
      console.log('🧹 Dados antigos limpos, iniciando nova conexão...');
      
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
      // Buscar token do localStorage
      const tokensData = localStorage.getItem('google_calendar_tokens');
      if (!tokensData) {
        throw new Error('Token de acesso não encontrado');
      }

      const tokens = JSON.parse(tokensData);
      const accessToken = tokens.access_token;
      
      if (!accessToken) {
        throw new Error('Token de acesso inválido');
      }

      console.log('🔍 Buscando lista de calendários...');
      
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
    // Estratégia ultra-persistente: tentar buscar eventos mesmo se não estiver "autenticado"
    const hasTokens = localStorage.getItem('google_calendar_tokens');
    
    if (!googleCalendarServiceHybrid.isAuthenticated() && !hasTokens) {
      console.log('❌ Nenhum token encontrado, pulando busca de eventos');
      return;
    }
    
    console.log('🔄 F5 - Recarregamento completo do calendário iniciado...');
    setIsLoading(true);
    
    // Limpar eventos atuais para feedback visual imediato
    setEvents([]);
    
    try {
      // Pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verificar e renovar token automaticamente se necessário
      console.log('🔍 Verificando validade do token...');
      const tokenValid = await googleCalendarServiceHybrid.ensureValidToken();
      if (!tokenValid) {
        console.log('❌ Token inválido e não foi possível renovar - necessário nova autenticação');
        setIsConnected(false);
        saveConnectionState(false);
        setEvents([]);
        return;
      }
      console.log('✅ Token válido - prosseguindo com busca de eventos');
      
      // Usar a nova função que busca em todas as agendas com período estendido
      const calendarEvents = await googleCalendarServiceHybrid.getAllEventsFromAllCalendars();
      console.log('📅 Eventos recebidos de todas as agendas (F5):', calendarEvents);
      
      // Filtrar eventos apenas dos calendários selecionados
      const filteredEvents = calendarEvents.filter(event => {
        if (selectedCalendars.length === 0) {
          return true; // Se nenhum calendário selecionado, mostrar todos
        }
        return selectedCalendars.includes(event.calendarId || '');
      });
      
      console.log('📅 Eventos filtrados por calendários selecionados:', filteredEvents);
      setEvents(filteredEvents as GoogleCalendarEvent[]);
      console.log('✅ Calendário recarregado com sucesso (F5)');
      
      // Garantir que o estado de conexão seja salvo após sucesso
      saveConnectionState(true);
      
      // Feedback visual adicional
      console.log('🎉 F5 concluído - Calendário atualizado!');
      
    } catch (error) {
      console.error('❌ Erro ao recarregar calendário (F5):', error);
      
      // Verificar se é erro de token expirado
      if (error.message && (error.message.includes('Token expirado') || error.message.includes('nova autenticação'))) {
        console.log('🔄 Token expirado - desconectando automaticamente');
        setIsConnected(false);
        saveConnectionState(false);
        setEvents([]);
        return;
      }
      
      // ESTRATÉGIA ULTRA-PERSISTENTE: NÃO desconectar automaticamente para outros erros
      // Mesmo com erro, manter como conectado se há tokens
      if (hasTokens) {
        console.log('🔗 Tokens encontrados - mantendo conexão ativa mesmo com erro');
        setIsConnected(true);
        saveConnectionState(true);
      }
      
      // Log do erro mas não desconectar
      console.log('⚠️ Erro ignorado - conexão mantida (ULTRA-PERSISTENTE)');
    } finally {
      setIsLoading(false);
      console.log('🏁 F5 - Recarregamento do calendário finalizado');
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
