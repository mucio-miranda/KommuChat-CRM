import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  MessageSquare, 
  QrCode, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  LogOut,
  Phone,
  User,
  Clock
} from 'lucide-react';
import { useWhatsApp } from '@/contexts/WhatsAppContext';

interface WhatsAppSetupProps {
  onConnect?: () => void;
  isConnected?: boolean;
}

export const WhatsAppSetup: React.FC<WhatsAppSetupProps> = ({ 
  onConnect, 
  isConnected: propIsConnected 
}) => {
  const { connection, isLoading, connect, disconnect, logout, refreshChats } = useWhatsApp();
  const [qrCodeExpired, setQrCodeExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutos em segundos

  const isConnected = propIsConnected ?? connection.isConnected;

  // Contador de tempo para expiração do QR Code
  useEffect(() => {
    if (connection.qrCode && !isConnected && !qrCodeExpired) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setQrCodeExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (isConnected || !connection.qrCode) {
      setTimeLeft(120);
      setQrCodeExpired(false);
    }
  }, [connection.qrCode, isConnected, qrCodeExpired]);

  // Debug: Log do estado da conexão
  useEffect(() => {
    console.log('🔍 WhatsAppSetup - Estado da conexão:', {
      isConnected,
      status: connection.status,
      hasQrCode: !!connection.qrCode,
      qrCodeExpired,
      isLoading
    });
  }, [isConnected, connection.status, connection.qrCode, qrCodeExpired, isLoading]);

  // Formatar tempo restante
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleConnect = async () => {
    await connect();
    onConnect?.();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleLogout = () => {
    logout();
  };

  const handleRefreshQR = async () => {
    setQrCodeExpired(false);
    setTimeLeft(120);
    await connect();
  };


  // Determinar se deve mostrar o QR code
  const shouldShowQRCode = connection.qrCode && !isConnected && (connection.status === 'connecting' || connection.status === 'disconnected');
  const shouldShowConnecting = !isConnected && (connection.status === 'connecting' || isLoading) && !connection.qrCode;
  const shouldShowDisconnected = !isConnected && connection.status === 'disconnected' && !isLoading && !connection.qrCode;

  console.log('🔍 WhatsAppSetup - Condições de exibição:', {
    shouldShowQRCode,
    shouldShowConnecting,
    shouldShowDisconnected,
    connectionStatus: connection.status,
    hasQrCode: !!connection.qrCode,
    isConnected
  });

  if (isConnected) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            WhatsApp Conectado
          </CardTitle>
          <CardDescription className="text-green-700">
            Sua conta WhatsApp está conectada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-green-800">{connection.name}</div>
              <div className="text-sm text-green-600">{connection.phoneNumber}</div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Conectado
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshChats}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar Chats
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Desconectar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá encerrar a sessão atual. Você precisará escanear o QR Code novamente para reconectar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDisconnect}>
                    Sim, desconectar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja fazer logout do WhatsApp? 
                    <br />
                    <strong>Todos os dados serão removidos</strong>, incluindo:
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>Informações da conexão</li>
                      <li>Lista de chats</li>
                      <li>Histórico de mensagens</li>
                      <li>Configurações salvas</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sim, fazer logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (shouldShowQRCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Conectar WhatsApp
          </CardTitle>
          <CardDescription>
            Escaneie o QR Code com seu WhatsApp para conectar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Conexão Real com Baileys:</strong>
              <p className="mt-2 text-sm">
                Este sistema usa a biblioteca Baileys para conectar realmente ao WhatsApp.
              </p>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li><strong>QR Code Real</strong> - Gerado pelo WhatsApp</li>
                <li><strong>Conexão Real</strong> - Via Baileys (não oficial)</li>
                <li><strong>Chats Reais</strong> - Sincronizados do WhatsApp</li>
                <li><strong>Mensagens Reais</strong> - Envio e recebimento</li>
              </ul>
              <p className="mt-2 text-xs">
                ⚠️ <strong>Atenção:</strong> Baileys é não oficial e pode parar de funcionar.
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <div className="relative">
              {qrCodeExpired ? (
                <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">QR Code expirado</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRefreshQR}
                      className="mt-2"
                    >
                      Gerar novo QR Code
                    </Button>
                  </div>
                </div>
              ) : connection.qrCode ? (
                <div className="w-80 h-80 bg-white rounded-lg border-2 border-border flex items-center justify-center p-6 shadow-lg">
                  <img 
                    src={connection.qrCode} 
                    alt="QR Code WhatsApp" 
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
              ) : (
                <div className="w-64 h-64 bg-white rounded-lg border-2 border-border flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Aguardando escaneamento do QR Code...
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Conectando...</span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <p className="text-xs text-blue-800">
                  <strong>Dica:</strong> Escaneie o QR Code com seu WhatsApp
                </p>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-mono text-blue-800">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
              {timeLeft < 30 && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-orange-600">
                    ⚠️ QR Code expirando em breve!
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRefreshQR}
                      className="text-xs h-6 px-2"
                    >
                      Novo QR
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (connection.status === 'error') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            Erro na Conexão
          </CardTitle>
          <CardDescription className="text-red-700">
            Não foi possível conectar ao WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {connection.error || 'Erro desconhecido ao conectar WhatsApp'}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
            className="mt-4 w-full"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (shouldShowConnecting && !shouldShowQRCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Conectando WhatsApp
          </CardTitle>
          <CardDescription>
            Aguarde enquanto estabelecemos a conexão...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">
                Iniciando conexão com WhatsApp...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Isso pode levar alguns segundos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Conectar WhatsApp
        </CardTitle>
        <CardDescription>
          Conecte sua conta WhatsApp para sincronizar chats e mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">Sincronização de Chats</div>
              <div className="text-sm text-muted-foreground">
                Visualize e gerencie suas conversas do WhatsApp
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">Contatos dos Pacientes</div>
              <div className="text-sm text-muted-foreground">
                Integre contatos com o sistema de pacientes
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">Envio de Mensagens</div>
              <div className="text-sm text-muted-foreground">
                Envie lembretes e confirmações via WhatsApp
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleConnect} 
          disabled={isLoading}
          className="w-full gradient-primary"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4 mr-2" />
              Conectar WhatsApp
            </>
          )}
        </Button>


        <div className="text-xs text-muted-foreground text-center">
          <p>
            <strong>Importante:</strong> Esta conexão é segura e usa apenas leitura de dados.
            <br />
            Suas mensagens pessoais não serão acessadas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
