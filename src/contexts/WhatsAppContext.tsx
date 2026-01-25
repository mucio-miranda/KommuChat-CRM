import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { hasEvolutionConfig } from '@/lib/supabase-crm';
import { evolutionService } from '@/lib/evolution-service';
import { useAuth } from './AuthContext';

export interface WhatsAppConnection {
  isConnected: boolean;
  qrCode?: string;
  phoneNumber?: string;
  name?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
}

interface WhatsAppContextType {
  connection: WhatsAppConnection;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  logout: () => Promise<void>;
  refreshQRCode: () => Promise<void>;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
};

interface WhatsAppProviderProps {
  children: ReactNode;
}

export const WhatsAppProvider: React.FC<WhatsAppProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [connection, setConnection] = useState<WhatsAppConnection>({
    isConnected: false,
    status: 'disconnected'
  });
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar status da conexão periodicamente quando estiver conectando
  useEffect(() => {
    if (connection.status === 'connecting' && user?.cliente_id) {
      console.log('🔄 Status é "connecting", iniciando polling...');
      startStatusPolling();
    } else {
      console.log('⏸️ Status não é "connecting", parando polling. Status atual:', connection.status);
      stopStatusPolling();
    }

    return () => {
      stopStatusPolling();
    };
  }, [connection.status, user?.cliente_id]);

  // Verificar status inicial ao carregar
  useEffect(() => {
    if (user?.cliente_id) {
      console.log('🔍 Verificando status inicial da conexão...');
      checkInitialStatus();
    }
  }, [user?.cliente_id]);

  // Verificar periodicamente se está conectado (mesmo quando não está em estado "connecting")
  // Isso garante que se conectar em outra aba/janela, a UI atualiza
  useEffect(() => {
    if (user?.cliente_id && !connection.isConnected && connection.status !== 'error') {
      const interval = setInterval(async () => {
        try {
          const isConnected = await evolutionService.isConnected(user.cliente_id);
          if (isConnected && !connection.isConnected) {
            console.log('✅ Conexão detectada em verificação periódica!');
            setConnection(prev => ({
              ...prev,
              isConnected: true,
              status: 'connected',
              qrCode: undefined,
              error: undefined
            }));
          }
        } catch (error) {
          // Ignorar erros silenciosamente nesta verificação periódica
        }
      }, 10000); // Verificar a cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [user?.cliente_id, connection.isConnected, connection.status]);

  const startStatusPolling = () => {
    stopStatusPolling(); // Garantir que não há polling duplicado
    
    console.log('🔄 Iniciando polling de status...');
    
    // Verificar imediatamente primeiro
    checkConnectionStatus();
    
    pollingIntervalRef.current = setInterval(() => {
      checkConnectionStatus();
    }, 3000); // Verificar a cada 3 segundos (mais frequente)
  };

  const checkConnectionStatus = async () => {
    if (!user?.cliente_id) {
      console.log('⚠️ Sem cliente_id, parando verificação');
      return;
    }

    // Se já está conectado, parar polling
    if (connection.isConnected && connection.status === 'connected') {
      console.log('✅ Já conectado, parando polling');
      stopStatusPolling();
      return;
    }

    try {
      console.log('🔍 Verificando status da conexão...');
      const isConnected = await evolutionService.isConnected(user.cliente_id);
      
      if (isConnected) {
        console.log('✅ CONEXÃO DETECTADA! Atualizando UI...');
        const status = await evolutionService.getInstanceStatus(user.cliente_id);
        
        setConnection(prev => {
          // Só atualizar se realmente mudou
          if (!prev.isConnected || prev.status !== 'connected') {
            console.log('🔄 Atualizando estado para conectado');
            return {
              ...prev,
              isConnected: true,
              status: 'connected',
              qrCode: undefined, // Limpar QR code quando conectar
              error: undefined // Limpar erros
            };
          }
          return prev;
        });
        
        stopStatusPolling();
        console.log('✅ Polling parado, conexão estabelecida');
      } else {
        console.log('⏳ Ainda não conectado, continuando polling...');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      // Não parar o polling em caso de erro, pode ser temporário
    }
  };

  const stopStatusPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const checkInitialStatus = async () => {
    if (!user?.cliente_id) return;

    try {
      const hasConfig = await hasEvolutionConfig(user.cliente_id);
      if (!hasConfig) {
        setConnection(prev => ({
          ...prev,
          status: 'error',
          error: 'Configuração da Evolution API não encontrada. Entre em contato com o administrador.'
        }));
        return;
      }

      const isConnected = await evolutionService.isConnected(user.cliente_id);
      if (isConnected) {
        setConnection(prev => ({
          ...prev,
          isConnected: true,
          status: 'connected'
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status inicial:', error);
    }
  };

  const connect = async () => {
    if (!user?.cliente_id) {
      setConnection({
        isConnected: false,
        status: 'error',
        error: 'Usuário não identificado'
      });
      return;
    }

    setIsLoading(true);
    setConnection(prev => ({ ...prev, status: 'connecting', error: undefined }));

    try {
      // Verificar se há configuração da Evolution API
      const hasConfig = await hasEvolutionConfig(user.cliente_id);
      if (!hasConfig) {
        setConnection({
          isConnected: false,
          status: 'error',
          error: 'Configuração da Evolution API não encontrada. Entre em contato com o administrador.'
        });
        setIsLoading(false);
        return;
      }

      // Primeiro verificar se já está conectado antes de tentar obter QR code
      console.log('🔍 Verificando se já está conectado antes de obter QR Code...');
      const isAlreadyConnected = await evolutionService.isConnected(user.cliente_id);
      console.log('🔍 Status de conexão inicial:', isAlreadyConnected);
      
      if (isAlreadyConnected) {
        console.log('✅ Já está conectado! Atualizando UI...');
        setConnection(prev => ({
          ...prev,
          isConnected: true,
          status: 'connected',
          qrCode: undefined,
          error: undefined
        }));
        setIsLoading(false);
        return;
      }

      // Se não está conectado, obter QR code
      console.log('🔄 Instância não conectada, obtendo QR Code da Evolution API...');
      const qrCode = await evolutionService.getQRCode(user.cliente_id);
      console.log('📱 QR Code obtido:', qrCode ? 'Sim' : 'Não', qrCode?.substring(0, 50) || '');
      
      if (!qrCode) {
        console.log('⚠️ QR Code não retornado, verificando novamente se conectou...');
        // Verificar novamente se conectou durante a obtenção do QR code
        const isConnectedNow = await evolutionService.isConnected(user.cliente_id);
        console.log('🔍 Status de conexão após tentativa:', isConnectedNow);
        
        if (isConnectedNow) {
          setConnection(prev => ({
            ...prev,
            isConnected: true,
            status: 'connected',
            qrCode: undefined
          }));
        } else {
          setConnection({
            isConnected: false,
            status: 'error',
            error: 'Não foi possível obter o QR Code. Verifique se a instância está configurada corretamente e se a Evolution API está acessível.'
          });
        }
        setIsLoading(false);
        return;
      }

      console.log('✅ QR Code obtido com sucesso, atualizando estado...');
      setConnection(prev => ({
        ...prev,
        qrCode,
        status: 'connecting'
      }));

      // Iniciar polling para verificar quando conectar
      startStatusPolling();
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      setConnection({
        isConnected: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro ao conectar com a Evolution API'
      });
      setIsLoading(false);
    }
  };

  const refreshQRCode = async () => {
    if (!user?.cliente_id) return;

    setIsLoading(true);
    try {
      const qrCode = await evolutionService.getQRCode(user.cliente_id);
      if (qrCode) {
        setConnection(prev => ({
          ...prev,
          qrCode,
          status: 'connecting',
          error: undefined
        }));
        startStatusPolling();
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar QR Code:', error);
      setConnection(prev => ({
        ...prev,
        error: 'Erro ao atualizar QR Code'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!user?.cliente_id) {
      setConnection({
        isConnected: false,
        status: 'disconnected'
      });
      return;
    }

    try {
      await evolutionService.disconnect(user.cliente_id);
      setConnection({
        isConnected: false,
        status: 'disconnected',
        qrCode: undefined
      });
      stopStatusPolling();
      console.log('✅ WhatsApp desconectado');
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
      // Mesmo com erro, limpar estado local
      setConnection({
        isConnected: false,
        status: 'disconnected',
        qrCode: undefined
      });
      stopStatusPolling();
    }
  };

  const logout = async () => {
    await disconnect();
    localStorage.removeItem('whatsapp_connection');
    console.log('✅ WhatsApp logout realizado');
  };


  const value: WhatsAppContextType = {
    connection,
    isLoading,
    connect,
    disconnect,
    logout,
    refreshQRCode
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};
