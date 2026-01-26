import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  QrCode, 
  Smartphone, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Send,
  Search,
  User,
  LogOut
} from 'lucide-react';
import { useWhatsApp } from '@/contexts/WhatsAppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { evolutionService } from '@/lib/evolution-service';

// Tipos e helpers para WhatsApp
import { PatientWithWhatsApp, WhatsAppChatMessage } from '@/lib/whatsapp-types';
import {
  parseWhatsAppMessages,
  interactionsToMessages,
  filterPatientsWithWhatsApp,
  sortPatientsByLastMessage,
  getLastMessagePreview,
  getLastMessageTimestamp,
  formatTimestamp,
  getPatientName,
  getPatientPhone,
  formatPhoneNumber
} from '@/lib/whatsapp-helpers';
import { WhatsAppChat, WhatsAppChatContainer, WhatsAppChatSkeleton } from '@/components/WhatsAppChat';

export default function Automatizacoes() {
  const { connection, isLoading, connect, disconnect, logout, refreshQRCode } = useWhatsApp();
  const { user } = useAuth();
  const { read: supabase, config: supabaseConfig } = useSupabase();
  
  // Estados de conexão
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Estados para pacientes e conversas (nova estrutura)
  const [patients, setPatients] = useState<PatientWithWhatsApp[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithWhatsApp | null>(null);
  const [messages, setMessages] = useState<WhatsAppChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de loading
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Estado para mensagem a enviar
  const [messageText, setMessageText] = useState('');

  // Carregar pacientes quando conectar ou iniciar
  useEffect(() => {
    if (connection.isConnected && user?.cliente_id) {
      console.log('✅ Conexão detectada, carregando pacientes com conversas...');
      loadPatientsWithConversations();
    }
  }, [connection.isConnected, user?.cliente_id]);

  // Carregar mensagens quando selecionar paciente
  useEffect(() => {
    if (selectedPatient) {
      loadMessagesFromPatient(selectedPatient);
    }
  }, [selectedPatient]);

  // Função para buscar a tabela configurada do cliente
  const getClienteTableName = async (): Promise<string> => {
    if (!user || !supabaseConfig) {
      return 'kommuchat_mvp'; // Tabela padrão
    }

    try {
      const { data: configData, error: configError } = await supabaseConfig
        .from('configuracoes_cliente')
        .select('valor')
        .eq('cliente_id', user.cliente_id)
        .eq('chave', 'tabela_supabase')
        .single();

      if (!configError && configData?.valor && configData.valor.trim() !== '') {
        return configData.valor;
      }
    } catch (error) {
      console.error('Erro ao buscar configuração da tabela:', error);
    }

    return 'kommuchat_mvp';
  };

  // Carregar pacientes que têm conversas do WhatsApp
  const loadPatientsWithConversations = useCallback(async () => {
    if (!supabase) {
      console.log('❌ Supabase não disponível');
      return;
    }

    setLoadingPatients(true);
    try {
      const tableName = await getClienteTableName();
      console.log('🔍 Buscando pacientes da tabela:', tableName);

      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error('Erro ao buscar pacientes:', error);
        return;
      }

      // Filtrar apenas pacientes que têm conversas no WhatsApp
      const patientsData = (data || []) as PatientWithWhatsApp[];
      const patientsWithWhatsApp = filterPatientsWithWhatsApp(patientsData);
      
      // Ordenar por última mensagem (mais recente primeiro)
      const sortedPatients = sortPatientsByLastMessage(patientsWithWhatsApp);

      console.log(`✅ Encontrados ${sortedPatients.length} pacientes com conversas WhatsApp`);
      setPatients(sortedPatients);

    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    } finally {
      setLoadingPatients(false);
    }
  }, [supabase, user?.cliente_id]);

  // Carregar mensagens de um paciente específico
  const loadMessagesFromPatient = (patient: PatientWithWhatsApp) => {
    setLoadingMessages(true);
    try {
      const interactions = parseWhatsAppMessages(patient.whatsapp);
      const chatMessages = interactionsToMessages(interactions);
      setMessages(chatMessages);
      console.log(`✅ Carregadas ${chatMessages.length} mensagens do paciente ${getPatientName(patient)}`);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Referência para o ID do paciente selecionado (para uso no refresh automático)
  const selectedPatientIdRef = useRef<string | number | null>(null);
  
  useEffect(() => {
    selectedPatientIdRef.current = selectedPatient?.id || null;
  }, [selectedPatient]);

  // Refresh automático das conversas a cada 10 segundos
  useEffect(() => {
    if (!connection.isConnected || !user?.cliente_id) {
      return;
    }

    const REFRESH_INTERVAL = 10000; // 10 segundos

    const refreshConversations = async () => {
      console.log('🔄 Refresh automático das conversas...');
      
      // Recarregar lista de pacientes
      if (!supabase) return;
      
      try {
        const tableName = await getClienteTableName();
        const { data, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) {
          console.error('Erro no refresh automático:', error);
          return;
        }

        const patientsData = (data || []) as PatientWithWhatsApp[];
        const patientsWithWhatsApp = filterPatientsWithWhatsApp(patientsData);
        const sortedPatients = sortPatientsByLastMessage(patientsWithWhatsApp);
        
        setPatients(sortedPatients);

        // Se tem um paciente selecionado, atualizar suas mensagens também
        if (selectedPatientIdRef.current) {
          const updatedPatient = sortedPatients.find(p => p.id === selectedPatientIdRef.current);
          if (updatedPatient) {
            const interactions = parseWhatsAppMessages(updatedPatient.whatsapp);
            const chatMessages = interactionsToMessages(interactions);
            setMessages(chatMessages);
          }
        }
      } catch (error) {
        console.error('Erro no refresh automático:', error);
      }
    };

    const intervalId = setInterval(refreshConversations, REFRESH_INTERVAL);

    // Cleanup ao desmontar ou quando desconectar
    return () => {
      clearInterval(intervalId);
    };
  }, [connection.isConnected, user?.cliente_id, supabase]);

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
      setPatients([]);
      setMessages([]);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const handleRefreshQR = async () => {
    setIsConnecting(true);
    try {
      await refreshQRCode();
    } catch (error) {
      console.error('Erro ao atualizar QR Code:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefreshConversations = async () => {
    await loadPatientsWithConversations();
    // Se tem um paciente selecionado, recarregar suas mensagens também
    if (selectedPatient) {
      // Buscar versão atualizada do paciente
      const updatedPatient = patients.find(p => p.id === selectedPatient.id);
      if (updatedPatient) {
        loadMessagesFromPatient(updatedPatient);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedPatient || !user?.cliente_id) return;

    const phone = getPatientPhone(selectedPatient);
    if (!phone || phone === 'Sem telefone') {
      console.error('Paciente não tem telefone cadastrado');
      return;
    }

    setSendingMessage(true);
    try {
      // Formatar número para WhatsApp (apenas dígitos + @s.whatsapp.net)
      const cleanPhone = phone.replace(/\D/g, '');
      const whatsappNumber = cleanPhone.length === 11 
        ? `55${cleanPhone}@s.whatsapp.net` 
        : `${cleanPhone}@s.whatsapp.net`;

      await evolutionService.sendMessage(
        user.cliente_id,
        whatsappNumber,
        messageText
      );
      
      setMessageText('');
      console.log('✅ Mensagem enviada com sucesso');
      
      // Recarregar conversas após alguns segundos (tempo para n8n processar)
      setTimeout(() => {
        handleRefreshConversations();
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectPatient = (patient: PatientWithWhatsApp) => {
    setSelectedPatient(patient);
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

  // Filtrar pacientes pelo termo de busca
  const filteredPatients = patients.filter(patient => {
    const name = getPatientName(patient).toLowerCase();
    const phone = getPatientPhone(patient).toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || phone.includes(term);
  });

  // Se conectado, mostrar interface de chat em tela cheia
  if (connection.isConnected) {
    return (
      <Layout>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Header compacto com botão de desconectar */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background flex-shrink-0">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-red-500" />
              <div>
                <h1 className="text-lg font-semibold">Chat</h1>
                <p className="text-xs text-muted-foreground">
                  {patients.length} conversa{patients.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleRefreshConversations}
                disabled={loadingPatients}
                variant="ghost"
                size="icon"
                title="Atualizar conversas"
              >
                {loadingPatients ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
              <Button 
                onClick={logout}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Desconectar
              </Button>
            </div>
          </div>

          {/* Chat em tela cheia */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full overflow-hidden">
              {/* Lista de Conversas */}
              <div className="md:col-span-1 border-r flex flex-col h-full overflow-hidden bg-background">
                {/* Busca */}
                <div className="p-3 border-b flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar conversa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Lista */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-gray">
                  {loadingPatients ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {searchTerm 
                          ? 'Nenhuma conversa encontrada'
                          : 'Nenhuma conversa disponível'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        As conversas aparecem quando há mensagens salvas no banco de dados
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredPatients.map((patient) => {
                        const interactions = parseWhatsAppMessages(patient.whatsapp);
                        const lastTimestamp = getLastMessageTimestamp(interactions);
                        const isSelected = selectedPatient?.id === patient.id;
                        
                        return (
                          <div
                            key={patient.id}
                            onClick={() => handleSelectPatient(patient)}
                            className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                              isSelected ? 'bg-muted' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium truncate text-sm">
                                    {getPatientName(patient)}
                                  </p>
                                  {lastTimestamp && (
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                      {formatTimestamp(lastTimestamp)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {formatPhoneNumber(getPatientPhone(patient))}
                                </p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {getLastMessagePreview(interactions)}
                                </p>
                              </div>
                              
                              {/* Badge de quantidade */}
                              {interactions.length > 0 && (
                                <Badge variant="secondary" className="flex-shrink-0 text-xs">
                                  {interactions.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Área de Mensagens */}
              <div className="md:col-span-2 flex flex-col h-full min-h-0 overflow-hidden">
                {selectedPatient ? (
                  <>
                    {/* Header da Conversa */}
                    <div className="border-b p-3 flex items-center gap-3 flex-shrink-0 bg-background">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">
                          {getPatientName(selectedPatient)}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatPhoneNumber(getPatientPhone(selectedPatient))}
                        </p>
                      </div>
                    </div>

                    {/* Mensagens */}
                    <WhatsAppChatContainer className="flex-1">
                      {loadingMessages ? (
                        <WhatsAppChatSkeleton />
                      ) : (
                        <WhatsAppChat 
                          messages={messages} 
                          patientName={getPatientName(selectedPatient)} 
                        />
                      )}
                    </WhatsAppChatContainer>

                    {/* Input de Mensagem */}
                    <div className="border-t p-3 flex gap-2 flex-shrink-0 bg-background">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Digite sua mensagem..."
                        disabled={sendingMessage}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendingMessage}
                        size="icon"
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted/30">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">
                        Selecione uma conversa para ver as mensagens
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Se não conectado, mostrar tela de conexão
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="w-8 h-8" />
              Chat
            </h1>
            <p className="text-muted-foreground mt-2">
              Conecte sua conta do WhatsApp para iniciar
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
              Conexão
            </CardTitle>
            <CardDescription>
              Conecte sua conta do WhatsApp para usar o Chat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* QR Code Section */}
              {connection.status === 'connecting' && connection.qrCode && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="w-4 h-4" />
                    <span>Escaneie o QR Code com seu WhatsApp</span>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg shadow-lg">
                      {connection.qrCode.startsWith('data:image') ? (
                        <img 
                          src={connection.qrCode} 
                          alt="QR Code WhatsApp" 
                          className="w-64 h-64"
                          onError={(e) => {
                            console.error('❌ Erro ao carregar imagem do QR Code');
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                          <div className="text-center p-4">
                            <AlertCircle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                            <p className="text-sm text-muted-foreground">
                              QR Code em formato não suportado
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

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
                    Conectar WhatsApp
                  </Button>
                )}

                {connection.status === 'connecting' && (
                  <Button 
                    onClick={handleRefreshQR}
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
                    <strong>Erro na conexão:</strong> {connection.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
