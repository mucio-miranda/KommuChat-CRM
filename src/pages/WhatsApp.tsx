import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { WhatsAppSetup } from '@/components/WhatsAppSetup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Phone, 
  Clock, 
  CheckCircle,
  Send,
  RefreshCw,
  MoreVertical,
  User,
  LogOut
} from 'lucide-react';
import { useWhatsApp } from '@/contexts/WhatsAppContext';

export default function WhatsApp() {
  const { connection, chats, isLoading, refreshChats, sendMessage, logout } = useWhatsApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.phone.includes(searchTerm)
  );

  const handleSendMessage = async () => {
    if (!selectedChat || !messageText.trim()) return;

    const chat = chats.find(c => c.id === selectedChat);
    if (!chat) return;

    const success = await sendMessage(chat.phone, messageText);
    if (success) {
      setMessageText('');
      // Aqui você poderia atualizar a lista de mensagens
    }
  };

  const handleLogout = () => {
    logout();
  };

  const formatLastMessageTime = (timeString?: string) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (!connection.isConnected) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
              <p className="text-muted-foreground mt-1">
                Conecte sua conta WhatsApp para gerenciar chats e mensagens
              </p>
            </div>
          </div>

          <WhatsAppSetup />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
            <p className="text-muted-foreground mt-1">
              Conectado como {connection.name} ({connection.phoneNumber})
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshChats}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Chats */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversas ({chats.length})
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {filteredChats.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
                    </div>
                  ) : (
                    filteredChats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`p-4 border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${
                          selectedChat === chat.id ? 'bg-primary/5 border-primary/20' : ''
                        }`}
                        onClick={() => setSelectedChat(chat.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-foreground truncate">
                                {chat.name}
                              </h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {chat.unreadCount && chat.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {chat.unreadCount}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatLastMessageTime(chat.lastMessageTime)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {chat.lastMessage || 'Nenhuma mensagem'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-mono">
                                {chat.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área de Mensagens */}
          <div className="lg:col-span-2">
            {selectedChat ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-4">
                  {(() => {
                    const chat = chats.find(c => c.id === selectedChat);
                    return chat ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{chat.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {chat.phone}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : null;
                  })()}
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* Área de mensagens (simulada) */}
                  <div className="flex-1 bg-muted/20 rounded-lg p-4 mb-4">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Área de mensagens</p>
                      <p className="text-sm">Em produção, aqui apareceriam as mensagens da conversa</p>
                    </div>
                  </div>

                  {/* Input de mensagem */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Selecione uma conversa
                  </h3>
                  <p className="text-muted-foreground">
                    Escolha uma conversa da lista para visualizar as mensagens
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Status da Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Status da Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Conectado</div>
                  <div className="text-sm text-green-600">WhatsApp ativo</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">{chats.length} Conversas</div>
                  <div className="text-sm text-blue-600">Total de chats</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium text-orange-800">Última atualização</div>
                  <div className="text-sm text-orange-600">Agora</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}