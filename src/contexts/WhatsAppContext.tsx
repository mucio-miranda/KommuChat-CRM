import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { saveWhatsAppQRCode, updateWhatsAppQRCodeStatus, getActiveWhatsAppQRCode, getClienteSavedQRCode, hasClienteSavedQRCode } from '@/lib/supabase-crm';
import { useAuth } from './AuthContext';

export interface WhatsAppChat {
  id: string;
  name: string;
  phone: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isGroup?: boolean;
  profilePicture?: string;
}

export interface WhatsAppConnection {
  isConnected: boolean;
  qrCode?: string;
  qrCodeId?: string;
  phoneNumber?: string;
  name?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
}

interface WhatsAppContextType {
  connection: WhatsAppConnection;
  chats: WhatsAppChat[];
  isLoading: boolean;
  connect: (format?: 'simple' | 'complex') => Promise<void>;
  disconnect: () => void;
  logout: () => void;
  refreshChats: () => Promise<void>;
  sendMessage: (phone: string, message: string) => Promise<boolean>;
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
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Conectar ao backend via WebSocket
  useEffect(() => {
    console.log('🔌 Conectando ao WebSocket...');
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    });
    setSocket(newSocket);

    // Eventos do WebSocket
    newSocket.on('connect', () => {
      console.log('✅ WebSocket conectado:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      console.error('🔍 Detalhes do erro:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconectado após', attemptNumber, 'tentativas');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Erro na reconexão WebSocket:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Falha na reconexão WebSocket após todas as tentativas');
    });

    newSocket.on('whatsapp-qr', async (data) => {
      console.log('📱 QR Code recebido:', data);
      
      // Salvar QR code no banco de dados
      if (user?.cliente_id) {
        try {
          const qrCodeRecord = await saveWhatsAppQRCode(
            user.cliente_id,
            data.qrCode,
            data.qrCodeImage // Se a API enviar a imagem em base64
          );
          
          if (qrCodeRecord) {
            setConnection({
              isConnected: false,
              qrCode: data.qrCode,
              qrCodeId: qrCodeRecord.id,
              status: 'connecting'
            });
          } else {
            setConnection({
              isConnected: false,
              qrCode: data.qrCode,
              status: 'connecting'
            });
          }
        } catch (error) {
          console.error('❌ Erro ao salvar QR code no banco:', error);
          setConnection({
            isConnected: false,
            qrCode: data.qrCode,
            status: 'connecting'
          });
        }
      } else {
        setConnection({
          isConnected: false,
          qrCode: data.qrCode,
          status: 'connecting'
        });
      }
      
      setIsLoading(false);
    });

    newSocket.on('whatsapp-connected', async (userInfo) => {
      console.log('✅ WhatsApp conectado:', userInfo);
      
      // Atualizar status no banco de dados
      if (connection.qrCodeId) {
        try {
          await updateWhatsAppQRCodeStatus(
            connection.qrCodeId,
            'connected',
            userInfo.phoneNumber,
            userInfo.name
          );
        } catch (error) {
          console.error('❌ Erro ao atualizar status do QR code:', error);
        }
      }
      
      setConnection({
        isConnected: true,
        phoneNumber: userInfo.phoneNumber,
        name: userInfo.name,
        status: 'connected'
      });
      setIsLoading(false);
      
      // Salvar no localStorage
      localStorage.setItem('whatsapp_connection', JSON.stringify({
        isConnected: true,
        phoneNumber: userInfo.phoneNumber,
        name: userInfo.name,
        status: 'connected'
      }));
      
      loadChats();
    });

    newSocket.on('whatsapp-status', (data) => {
      console.log('📡 Status atualizado:', data);
      setConnection(prev => ({
        ...prev,
        status: data.status,
        isConnected: data.isConnected
      }));
    });

    newSocket.on('whatsapp-disconnected', () => {
      console.log('🔌 WhatsApp desconectado');
      setConnection({
        isConnected: false,
        status: 'disconnected',
        qrCode: null
      });
      setChats([]);
      setIsLoading(false);
      localStorage.removeItem('whatsapp_connection');
    });

    newSocket.on('whatsapp-error', (error) => {
      console.error('❌ Erro WhatsApp:', error);
      setConnection({
        isConnected: false,
        status: 'error',
        error: error.error,
        qrCode: null
      });
      setIsLoading(false);
    });

    newSocket.on('whatsapp-chats', (chatsData) => {
      console.log('💬 Chats recebidos:', chatsData);
      // Converter chats do Baileys para nosso formato
      const formattedChats = chatsData.map((chat: any) => ({
        id: chat.id,
        name: chat.name || chat.subject || 'Chat sem nome',
        phone: chat.id.replace('@s.whatsapp.net', '').replace('@g.us', ''),
        lastMessage: chat.lastMessage?.message?.conversation || 'Nenhuma mensagem',
        lastMessageTime: new Date(chat.lastMessage?.messageTimestamp * 1000).toISOString(),
        unreadCount: chat.unreadCount || 0,
        isGroup: chat.id.includes('@g.us')
      }));
      setChats(formattedChats);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const connect = async (format: 'simple' | 'complex' = 'simple') => {
    if (!socket) {
      console.error('Socket não conectado');
      return;
    }

    setIsLoading(true);
    setConnection(prev => ({ ...prev, status: 'connecting' }));

    try {
      // Verificar se há QR code salvo do cliente
      if (user?.cliente_id) {
        const hasSavedQR = await hasClienteSavedQRCode(user.cliente_id);
        if (hasSavedQR) {
          const savedQRCode = await getClienteSavedQRCode(user.cliente_id);
          if (savedQRCode) {
            console.log('📱 Usando QR code salvo do cliente:', savedQRCode);
            setConnection(prev => ({
              ...prev,
              qrCode: savedQRCode,
              status: 'connecting'
            }));
            setIsLoading(false);
            return;
          }
        }
      }

      // Se não há QR code salvo, solicitar conexão ao backend
      const response = await fetch('http://localhost:3001/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao conectar com o backend');
      }

      console.log('✅ Solicitação de conexão enviada');
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      setConnection({
        isConnected: false,
        status: 'error',
        error: 'Erro ao conectar com o backend'
      });
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Desconexão solicitada');
      }
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  };

  const logout = async () => {
    try {
      // Desconectar do backend
      await disconnect();
      
      // Limpar estado local
      setConnection({
        isConnected: false,
        status: 'disconnected'
      });
      
      setChats([]);
      localStorage.removeItem('whatsapp_connection');
      
      console.log('✅ WhatsApp logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  const loadChats = async () => {
    if (!connection.isConnected) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/whatsapp/chats');
      
      if (response.ok) {
        const chatsData = await response.json();
        console.log('💬 Chats carregados:', chatsData);
        
        // Converter chats do Baileys para nosso formato
        const formattedChats = chatsData.map((chat: any) => ({
          id: chat.id,
          name: chat.name || chat.subject || 'Chat sem nome',
          phone: chat.id.replace('@s.whatsapp.net', '').replace('@g.us', ''),
          lastMessage: chat.lastMessage?.message?.conversation || 'Nenhuma mensagem',
          lastMessageTime: new Date(chat.lastMessage?.messageTimestamp * 1000).toISOString(),
          unreadCount: chat.unreadCount || 0,
          isGroup: chat.id.includes('@g.us')
        }));
        
        setChats(formattedChats);
      } else {
        console.error('Erro ao carregar chats:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshChats = async () => {
    await loadChats();
  };

  const sendMessage = async (phone: string, message: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3001/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone,
          message
        })
      });

      if (response.ok) {
        console.log(`✅ Mensagem enviada para ${phone}: ${message}`);
        return true;
      } else {
        console.error('❌ Erro ao enviar mensagem:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      return false;
    }
  };


  const value: WhatsAppContextType = {
    connection,
    chats,
    isLoading,
    connect,
    disconnect,
    logout,
    refreshChats,
    sendMessage
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};
