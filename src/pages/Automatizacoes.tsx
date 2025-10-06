import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  QrCode, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Zap,
  Users,
  Calendar,
  Mail
} from 'lucide-react';
import { useWhatsApp } from '@/contexts/WhatsAppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getClienteSavedQRCode, hasClienteSavedQRCode } from '@/lib/supabase-crm';

export default function Automatizacoes() {
  const { connection, isLoading, connect, disconnect, logout } = useWhatsApp();
  const { user } = useAuth();
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [savedQRCode, setSavedQRCode] = useState<string | null>(null);
  const [hasSavedQR, setHasSavedQR] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Carregar QR code salvo do cliente
  useEffect(() => {
    const loadSavedQRCode = async () => {
      if (user?.cliente_id) {
        try {
          const hasQR = await hasClienteSavedQRCode(user.cliente_id);
          setHasSavedQR(hasQR);
          
          if (hasQR) {
            const qrCodeUrl = await getClienteSavedQRCode(user.cliente_id);
            setSavedQRCode(qrCodeUrl);
          }
        } catch (error) {
          console.error('Erro ao carregar QR code salvo:', error);
        }
      }
    };

    loadSavedQRCode();
  }, [user?.cliente_id]);

  // Simular QR code (em produção viria da API)
  useEffect(() => {
    if (connection.qrCode) {
      setQrCodeImage(connection.qrCode);
    }
  }, [connection.qrCode]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error('Erro ao conectar:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setQrCodeImage(null);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const getStatusBadge = () => {
    switch (connection.status) {
      case 'connected':
        return <Badge className="bg-green-500 hover:bg-green-600">Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Conectando...</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconectado</Badge>;
    }
  };

  const automationFeatures = [
    {
      title: "Mensagens Automáticas",
      description: "Envie mensagens automáticas para novos pacientes",
      icon: MessageCircle,
      status: "Ativo",
      color: "text-green-600"
    },
    {
      title: "Lembretes de Consulta",
      description: "Envie lembretes automáticos antes das consultas",
      icon: Mail,
      status: "Ativo",
      color: "text-green-600"
    },
    {
      title: "Follow-up Pós Consulta",
      description: "Mensagens de acompanhamento após consultas",
      icon: Users,
      status: "Ativo",
      color: "text-green-600"
    },
    {
      title: "Integração com Calendário",
      description: "Sincronização automática com Google Calendar",
      icon: Calendar,
      status: "Ativo",
      color: "text-green-600"
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automatizações</h1>
          <p className="text-muted-foreground mt-2">
            Configure e gerencie suas automações do WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* WhatsApp Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conexão WhatsApp
          </CardTitle>
          <CardDescription>
            Conecte sua conta do WhatsApp para ativar as automações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!connection.isConnected ? (
            <div className="space-y-4">
              {/* QR Code Section */}
              {((connection.status === 'connecting' && qrCodeImage) || (hasSavedQR && savedQRCode)) && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="w-4 h-4" />
                    <span>
                      {hasSavedQR && savedQRCode ? 
                        'QR Code pré-configurado - Escaneie com seu WhatsApp' : 
                        'Escaneie o QR Code com seu WhatsApp'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg shadow-lg">
                      <img 
                        src={hasSavedQR && savedQRCode ? savedQRCode : qrCodeImage} 
                        alt="QR Code WhatsApp" 
                        className="w-64 h-64"
                      />
                    </div>
                  </div>

                  {hasSavedQR && savedQRCode && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>QR Code pré-configurado encontrado!</strong>
                        <br />
                        Este QR code foi carregado automaticamente da sua configuração.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Como conectar:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Abra o WhatsApp no seu celular</li>
                        <li>Toque em "Menu" ou "Configurações"</li>
                        <li>Toque em "Dispositivos conectados"</li>
                        <li>Toque em "Conectar um dispositivo"</li>
                        <li>Escaneie este QR Code</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Informação sobre QR Code salvo */}
              {!hasSavedQR && connection.status === 'disconnected' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Nenhum QR Code pré-configurado encontrado.</strong>
                    <br />
                    Clique em "Conectar WhatsApp" para gerar um novo QR Code ou configure um QR Code na criação do usuário.
                  </AlertDescription>
                </Alert>
              )}

              {/* Connection Buttons */}
              <div className="flex gap-3">
                {connection.status === 'disconnected' && (
                  <Button 
                    onClick={handleConnect}
                    disabled={isConnecting || isLoading}
                    className="flex items-center gap-2"
                  >
                    {isConnecting || isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                    {hasSavedQR && savedQRCode ? 'Usar QR Code Salvo' : 'Conectar WhatsApp'}
                  </Button>
                )}

                {connection.status === 'connecting' && (
                  <Button 
                    onClick={handleConnect}
                    disabled={isConnecting || isLoading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isConnecting || isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Atualizar QR Code
                  </Button>
                )}

                {connection.status === 'error' && (
                  <Button 
                    onClick={handleConnect}
                    disabled={isConnecting || isLoading}
                    className="flex items-center gap-2"
                  >
                    {isConnecting || isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Tentar Novamente
                  </Button>
                )}
              </div>

              {connection.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erro na conexão: {connection.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>WhatsApp conectado com sucesso!</strong>
                  <br />
                  Número: {connection.phoneNumber}
                  {connection.name && <><br />Nome: {connection.name}</>}
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  onClick={handleDisconnect}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Desconectar
                </Button>
                <Button 
                  onClick={logout}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Logout Completo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Automation Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Recursos de Automação</h2>
        <p className="text-muted-foreground">
          Configure e gerencie suas automações do WhatsApp
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automationFeatures.map((feature, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  {feature.title}
                </CardTitle>
                <CardDescription>
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-start">
                  <Badge 
                    variant="default"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {feature.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming Soon Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Próximas Funcionalidades
          </CardTitle>
          <CardDescription>
            Recursos que serão adicionados em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Campanhas de Marketing</h4>
              <p className="text-sm text-muted-foreground">
                Envie campanhas promocionais para sua base
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Integração com Whatsapp</h4>
              <p className="text-sm text-muted-foreground">
                Veja suas mensagens e interaja com pacientes
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Relatórios de Envio</h4>
              <p className="text-sm text-muted-foreground">
                Acompanhe o desempenho das suas campanhas
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Chatbot Inteligente</h4>
              <p className="text-sm text-muted-foreground">
                IA para responder perguntas comuns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}
