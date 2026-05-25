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
  LogOut,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { useWhatsApp } from '@/contexts/WhatsAppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import { evolutionService } from '@/lib/evolution-service';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

// Tipos e helpers para WhatsApp
import { PatientWithWhatsApp, WhatsAppChatMessage } from '@/lib/whatsapp-types';
import {
  parseWhatsAppMessages,
  interactionsToMessages,
  formatTimestamp,
  getPatientName,
  getPatientPhone,
  formatPhoneNumber,
  getBrazilianAlternativePhone
} from '@/lib/whatsapp-helpers';
import { WhatsAppChat, WhatsAppChatContainer, WhatsAppChatSkeleton } from '@/components/WhatsAppChat';

interface ContactAvatarProps {
  phoneNumber: string;
  clienteId: string | undefined;
  name?: string;
  className?: string;
}

const getInitials = (name: string): string => {
  if (!name || name === 'Paciente sem nome') return '';
  
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '';
  
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const ContactAvatar: React.FC<ContactAvatarProps> = ({ phoneNumber, clienteId, name, className = "w-10 h-10" }) => {
  const profilePicture = useProfilePicture(phoneNumber, clienteId);
  const initials = name ? getInitials(name) : '';

  return (
    <Avatar className={`${className} flex-shrink-0`}>
      {profilePicture && (
        <AvatarImage 
          src={profilePicture} 
          alt="Profile"
          className="object-cover"
        />
      )}
      <AvatarFallback className="bg-red-50 dark:bg-red-950">
        {initials ? (
          <span className="text-[#E21929] font-semibold text-sm">{initials}</span>
        ) : (
          <User className="w-5 h-5 text-[#E21929]" />
        )}
      </AvatarFallback>
    </Avatar>
  );
};

export default function Automatizacoes() {
  const { connection, isLoading, connect, disconnect, logout, refreshQRCode } = useWhatsApp();
  const { user } = useAuth();
  const { read: supabase, config: supabaseConfig } = useSupabase();
  const { toast } = useToast();
  
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
  
  // Estado para controlar scroll automático (apenas ao abrir conversa ou enviar mensagem)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  
  // Estados para edição de nome
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isTogglingAtendimento, setIsTogglingAtendimento] = useState(false);

  const checkTrue = (val: unknown) => String(val) === 'true' || val === true;

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
      loadMessagesFromPatient(selectedPatient, () => {
        setShouldScrollToBottom(true);
        setTimeout(() => setShouldScrollToBottom(false), 500);
      });
    }
  }, [selectedPatient?.id]);

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
        .select('id, nome, telefone, lembrete, data_agendamento, atendimentofinal, topoucall, follow, followup, setdata, email, atende_humano, chatid')
        .not('whatsapp', 'is', null)
        .order('setdata', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pacientes:', error);
        return;
      }

      const sorted = (data || []) as PatientWithWhatsApp[];
      console.log(`✅ Encontrados ${sorted.length} pacientes com conversas WhatsApp`);
      setPatients(sorted);

    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    } finally {
      setLoadingPatients(false);
    }
  }, [supabase, user?.cliente_id]);

  // Busca o whatsapp de um paciente específico e carrega as mensagens
  // silent=true: não mostra skeleton (usado em refreshes em background para não resetar o scroll)
  const loadMessagesFromPatient = async (patient: PatientWithWhatsApp, onLoaded?: () => void, silent = false) => {
    if (!supabase) return;
    if (!silent) setLoadingMessages(true);
    try {
      const tableName = await getClienteTableName();
      const { data, error } = await supabase
        .from(tableName)
        .select('whatsapp, atendimentofinal')
        .eq('id', patient.id)
        .single();

      if (error) throw error;

      const interactions = parseWhatsAppMessages(data?.whatsapp);
      const chatMessages = interactionsToMessages(interactions);
      setMessages(chatMessages);
      if (data?.atendimentofinal !== undefined) {
        setSelectedPatient(prev => prev ? { ...prev, atendimentofinal: data.atendimentofinal } : prev);
      }
      console.log(`✅ Carregadas ${chatMessages.length} mensagens do paciente ${getPatientName(patient)}`);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
      if (onLoaded) onLoaded();
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

      if (!supabase) return;

      try {
        const tableName = await getClienteTableName();

        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .not('whatsapp', 'is', null)
          .order('setdata', { ascending: false });

        if (error) {
          console.error('Erro no refresh automático:', error);
          return;
        }

        setPatients((data || []) as PatientWithWhatsApp[]);
  
        // Se tem paciente selecionado, atualizar suas mensagens separadamente
        if (selectedPatientIdRef.current) {
          const { data: whatsappData, error: whatsappError } = await supabase
            .from(tableName)
            .select('whatsapp')
            .eq('id', selectedPatientIdRef.current)
            .single();

          if (!whatsappError && whatsappData) {
            const interactions = parseWhatsAppMessages(whatsappData.whatsapp);
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
        loadMessagesFromPatient(updatedPatient, undefined, true);
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
      const cleanPhone = phone.replace(/\D/g, '');
      const withCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      const whatsappNumber = `${withCountry}@s.whatsapp.net`;

      const ZERO_WIDTH_SPACE = '​';
      const markedMessage = `${ZERO_WIDTH_SPACE}${messageText}`;

      try {
        await evolutionService.sendMessage(user.cliente_id, whatsappNumber, markedMessage);
      } catch (sendError: any) {
        if (sendError?.message?.includes('"exists":false')) {
          const altPhone = getBrazilianAlternativePhone(withCountry);
          if (altPhone) {
            await evolutionService.sendMessage(user.cliente_id, `${altPhone}@s.whatsapp.net`, markedMessage);
          } else {
            throw sendError;
          }
        } else {
          throw sendError;
        }
      }
      
      setMessageText('');
      console.log('✅ Mensagem enviada com sucesso');
      
      // Ativar scroll automático após enviar mensagem
      setShouldScrollToBottom(true);
      setTimeout(() => setShouldScrollToBottom(false), 500);
      
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
    // Scroll ao fim é disparado em loadMessagesFromPatient (onLoaded) quando as mensagens carregam
  };

  const handleStartEditName = (currentName: string) => {
    setEditingName(currentName);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  const handleSaveName = async () => {
    if (!selectedPatient || !editingName.trim() || !user) {
      handleCancelEditName();
      return;
    }

    setIsSavingName(true);

    try {
      const tableName = await getClienteTableName();
      console.log('🔍 Atualizando nome do paciente na tabela:', tableName, 'ID:', selectedPatient.id);

      // Atualizar APENAS o campo nome do paciente
      const { error: updateError } = await supabase!
        .from(tableName)
        .update({ nome: editingName.trim() })
        .eq('id', selectedPatient.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar nome:', updateError);
        throw new Error('Erro ao atualizar o nome do paciente');
      }

      console.log('✅ Nome atualizado com sucesso para:', editingName.trim());

      toast({
        title: "Nome atualizado",
        description: "O nome do contato foi atualizado com sucesso!",
      });

      // Atualizar o estado local para refletir mudança imediata
      setPatients(prev => prev.map(p => 
        p.id === selectedPatient.id ? { ...p, nome: editingName.trim() } : p
      ));
      
      setSelectedPatient(prev => 
        prev ? { ...prev, nome: editingName.trim() } : null
      );

      handleCancelEditName();

    } catch (error) {
      console.error('❌ Erro ao salvar nome:', error);
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado ao tentar atualizar o nome.",
        variant: "destructive",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleToggleAtendimento = async () => {
    if (!selectedPatient || !user || !supabase) return;

    const currentVal = checkTrue(selectedPatient.atendimentofinal);
    const newVal = !currentVal;

    setPatients(prev => prev.map(p =>
      p.id === selectedPatient.id ? { ...p, atendimentofinal: newVal } : p
    ));
    setSelectedPatient(prev => prev ? { ...prev, atendimentofinal: newVal } : null);

    setIsTogglingAtendimento(true);
    try {
      const tableName = await getClienteTableName();
      const { error } = await supabase
        .from(tableName)
        .update({ atendimentofinal: newVal })
        .eq('id', selectedPatient.id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Atendimento ${newVal ? 'desativado' : 'ativado'} com sucesso.`,
      });
    } catch (err) {
      console.error('Erro ao atualizar atendimento:', err);
      setPatients(prev => prev.map(p =>
        p.id === selectedPatient.id ? { ...p, atendimentofinal: currentVal } : p
      ));
      setSelectedPatient(prev => prev ? { ...prev, atendimentofinal: currentVal } : null);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingAtendimento(false);
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
                              <ContactAvatar
                                phoneNumber={getPatientPhone(patient)}
                                clienteId={user?.cliente_id}
                                name={getPatientName(patient)}
                              />

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium truncate text-sm">
                                    {getPatientName(patient)}
                                  </p>
                                  {patient.setdata && (
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                      {formatTimestamp(patient.setdata)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {formatPhoneNumber(getPatientPhone(patient))}
                                </p>
                              </div>
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
                      <ContactAvatar 
                        phoneNumber={getPatientPhone(selectedPatient)} 
                        clienteId={user?.cliente_id}
                        name={getPatientName(selectedPatient)}
                      />
                      <div className="flex-1 min-w-0">
                        {isEditingName ? (
                          <div className="flex items-center gap-2 mb-1">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isSavingName) handleSaveName();
                                if (e.key === 'Escape') handleCancelEditName();
                              }}
                              className="h-7 text-sm font-semibold"
                              autoFocus
                              disabled={isSavingName}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSaveName}
                              disabled={isSavingName}
                              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Salvar"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEditName}
                              disabled={isSavingName}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Cancelar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-1 group">
                            <h3 className="font-semibold text-sm truncate">
                              {getPatientName(selectedPatient)}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEditName(getPatientName(selectedPatient))}
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                              title="Editar nome"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatPhoneNumber(getPatientPhone(selectedPatient))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Atendimento</span>
                        <Switch
                          checked={!checkTrue(selectedPatient.atendimentofinal)}
                          onCheckedChange={handleToggleAtendimento}
                          disabled={isTogglingAtendimento}
                          title={checkTrue(selectedPatient.atendimentofinal) ? 'Reativar atendimento' : 'Desativar atendimento'}
                        />
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
                          shouldScrollToBottom={shouldScrollToBottom}
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
