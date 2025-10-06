import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getClienteSavedQRCode, hasClienteSavedQRCode } from '@/lib/supabase-crm';
import { useAuth } from './AuthContext';

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
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  logout: () => void;
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

  // Carregar QR code salvo do cliente ao inicializar
  useEffect(() => {
    const loadSavedQRCode = async () => {
      if (user?.cliente_id) {
        try {
          const hasSavedQR = await hasClienteSavedQRCode(user.cliente_id);
          if (hasSavedQR) {
            const savedQRCode = await getClienteSavedQRCode(user.cliente_id);
            if (savedQRCode) {
              console.log('📱 QR Code salvo encontrado:', savedQRCode);
              setConnection(prev => ({
                ...prev,
                qrCode: savedQRCode,
                status: 'connecting'
              }));
            }
          }
        } catch (error) {
          console.error('❌ Erro ao carregar QR code salvo:', error);
        }
      }
    };

    loadSavedQRCode();
  }, [user?.cliente_id]);

  const connect = async () => {
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

      // Se não há QR code salvo, mostrar erro
      console.log('⚠️ Nenhum QR code salvo encontrado');
      setConnection({
        isConnected: false,
        status: 'error',
        error: 'Nenhum QR code configurado. Configure um QR code primeiro.'
      });
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      setConnection({
        isConnected: false,
        status: 'error',
        error: 'Erro ao carregar QR code'
      });
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setConnection({
      isConnected: false,
      status: 'disconnected'
    });
    console.log('✅ WhatsApp desconectado');
  };

  const logout = () => {
    // Limpar estado local
    setConnection({
      isConnected: false,
      status: 'disconnected'
    });
    
    localStorage.removeItem('whatsapp_connection');
    console.log('✅ WhatsApp logout realizado');
  };


  const value: WhatsAppContextType = {
    connection,
    isLoading,
    connect,
    disconnect,
    logout
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};
