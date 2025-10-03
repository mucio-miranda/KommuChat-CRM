import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Database,
  MessageCircle,
  Calendar,
  Bell,
  Shield,
  Globe,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { useGoogleCalendar } from '@/contexts/GoogleCalendarContext';
import { useWhatsApp } from '@/contexts/WhatsAppContext';
import { toast } from '@/components/ui/use-toast';

interface ConfiguracaoGeral {
  nome_clinica: string;
  email_contato: string;
  telefone_contato: string;
  endereco: string;
  cnpj: string;
  horario_funcionamento: string;
  timezone: string;
}

interface ConfiguracaoWhatsApp {
  ativo: boolean;
  mensagem_boas_vindas: string;
  mensagem_lembrete: string;
  mensagem_followup: string;
  horario_envio_inicio: string;
  horario_envio_fim: string;
  dias_semana: string[];
}

interface ConfiguracaoGoogleCalendar {
  ativo: boolean;
  calendario_principal: string;
  sincronizacao_automatica: boolean;
  notificacoes_email: boolean;
}

interface ConfiguracaoNotificacoes {
  email_ativo: boolean;
  whatsapp_ativo: boolean;
  lembrete_consulta: boolean;
  followup_automatico: boolean;
  relatorios_semanais: boolean;
}

export default function Configuracoes() {
  const { user, isVisitor } = useAuth();
  const { config: supabaseConfig } = useSupabase();
  const { isConnected: googleConnected, connect: googleConnect, disconnect: googleDisconnect } = useGoogleCalendar();
  const { connection: whatsappConnection, connect: whatsappConnect, disconnect: whatsappDisconnect } = useWhatsApp();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estados das configurações
  const [configGeral, setConfigGeral] = useState<ConfiguracaoGeral>({
    nome_clinica: '',
    email_contato: '',
    telefone_contato: '',
    endereco: '',
    cnpj: '',
    horario_funcionamento: '08:00 - 18:00',
    timezone: 'America/Sao_Paulo'
  });

  const [configWhatsApp, setConfigWhatsApp] = useState<ConfiguracaoWhatsApp>({
    ativo: false,
    mensagem_boas_vindas: 'Olá! Bem-vindo à nossa clínica. Como posso ajudá-lo hoje?',
    mensagem_lembrete: 'Lembrete: Você tem uma consulta agendada para amanhã às {hora}.',
    mensagem_followup: 'Como foi sua consulta? Gostaria de agendar um retorno?',
    horario_envio_inicio: '08:00',
    horario_envio_fim: '18:00',
    dias_semana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta']
  });

  const [configGoogleCalendar, setConfigGoogleCalendar] = useState<ConfiguracaoGoogleCalendar>({
    ativo: false,
    calendario_principal: '',
    sincronizacao_automatica: true,
    notificacoes_email: true
  });

  const [configNotificacoes, setConfigNotificacoes] = useState<ConfiguracaoNotificacoes>({
    email_ativo: true,
    whatsapp_ativo: true,
    lembrete_consulta: true,
    followup_automatico: true,
    relatorios_semanais: false
  });

  // Carregar configurações existentes
  useEffect(() => {
    const loadConfigurations = async () => {
      if (!supabaseConfig || isVisitor) return;

      setLoading(true);
      try {
        const { data, error } = await supabaseConfig
          .from('configuracoes_cliente')
          .select('*')
          .eq('cliente_id', user?.cliente_id);

        if (error) throw error;

        // Processar configurações
        const configs = data.reduce((acc, config) => {
          acc[config.chave] = config.valor;
          return acc;
        }, {} as Record<string, string>);

        // Atualizar estados com configurações existentes
        setConfigGeral(prev => ({
          ...prev,
          nome_clinica: configs.nome_clinica || prev.nome_clinica,
          email_contato: configs.email_contato || prev.email_contato,
          telefone_contato: configs.telefone_contato || prev.telefone_contato,
          endereco: configs.endereco || prev.endereco,
          cnpj: configs.cnpj || prev.cnpj,
          horario_funcionamento: configs.horario_funcionamento || prev.horario_funcionamento,
          timezone: configs.timezone || prev.timezone
        }));

        setConfigWhatsApp(prev => ({
          ...prev,
          ativo: configs.whatsapp_ativo === 'true',
          mensagem_boas_vindas: configs.mensagem_boas_vindas || prev.mensagem_boas_vindas,
          mensagem_lembrete: configs.mensagem_lembrete || prev.mensagem_lembrete,
          mensagem_followup: configs.mensagem_followup || prev.mensagem_followup,
          horario_envio_inicio: configs.horario_envio_inicio || prev.horario_envio_inicio,
          horario_envio_fim: configs.horario_envio_fim || prev.horario_envio_fim,
          dias_semana: configs.dias_semana ? JSON.parse(configs.dias_semana) : prev.dias_semana
        }));

        setConfigGoogleCalendar(prev => ({
          ...prev,
          ativo: configs.google_calendar_ativo === 'true',
          calendario_principal: configs.calendario_principal || prev.calendario_principal,
          sincronizacao_automatica: configs.sincronizacao_automatica === 'true',
          notificacoes_email: configs.notificacoes_email === 'true'
        }));

        setConfigNotificacoes(prev => ({
          ...prev,
          email_ativo: configs.email_ativo === 'true',
          whatsapp_ativo: configs.whatsapp_ativo === 'true',
          lembrete_consulta: configs.lembrete_consulta === 'true',
          followup_automatico: configs.followup_automatico === 'true',
          relatorios_semanais: configs.relatorios_semanais === 'true'
        }));

      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfigurations();
  }, [supabaseConfig, user, isVisitor]);

  // Salvar configurações
  const saveConfiguration = async (chave: string, valor: string) => {
    if (!supabaseConfig || isVisitor) return;

    try {
      const { error } = await supabaseConfig
        .from('configuracoes_cliente')
        .upsert({
          cliente_id: user?.cliente_id,
          chave,
          valor,
          tipo: 'string'
        });

      if (error) throw error;
    } catch (error) {
      console.error(`Erro ao salvar configuração ${chave}:`, error);
      throw error;
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Salvar configurações gerais
      await Promise.all([
        saveConfiguration('nome_clinica', configGeral.nome_clinica),
        saveConfiguration('email_contato', configGeral.email_contato),
        saveConfiguration('telefone_contato', configGeral.telefone_contato),
        saveConfiguration('endereco', configGeral.endereco),
        saveConfiguration('cnpj', configGeral.cnpj),
        saveConfiguration('horario_funcionamento', configGeral.horario_funcionamento),
        saveConfiguration('timezone', configGeral.timezone),
        
        // Salvar configurações WhatsApp
        saveConfiguration('whatsapp_ativo', configWhatsApp.ativo.toString()),
        saveConfiguration('mensagem_boas_vindas', configWhatsApp.mensagem_boas_vindas),
        saveConfiguration('mensagem_lembrete', configWhatsApp.mensagem_lembrete),
        saveConfiguration('mensagem_followup', configWhatsApp.mensagem_followup),
        saveConfiguration('horario_envio_inicio', configWhatsApp.horario_envio_inicio),
        saveConfiguration('horario_envio_fim', configWhatsApp.horario_envio_fim),
        saveConfiguration('dias_semana', JSON.stringify(configWhatsApp.dias_semana)),
        
        // Salvar configurações Google Calendar
        saveConfiguration('google_calendar_ativo', configGoogleCalendar.ativo.toString()),
        saveConfiguration('calendario_principal', configGoogleCalendar.calendario_principal),
        saveConfiguration('sincronizacao_automatica', configGoogleCalendar.sincronizacao_automatica.toString()),
        saveConfiguration('notificacoes_email', configGoogleCalendar.notificacoes_email.toString()),
        
        // Salvar configurações de notificações
        saveConfiguration('email_ativo', configNotificacoes.email_ativo.toString()),
        saveConfiguration('whatsapp_ativo', configNotificacoes.whatsapp_ativo.toString()),
        saveConfiguration('lembrete_consulta', configNotificacoes.lembrete_consulta.toString()),
        saveConfiguration('followup_automatico', configNotificacoes.followup_automatico.toString()),
        saveConfiguration('relatorios_semanais', configNotificacoes.relatorios_semanais.toString())
      ]);

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const diasSemana = [
    { value: 'segunda', label: 'Segunda' },
    { value: 'terca', label: 'Terça' },
    { value: 'quarta', label: 'Quarta' },
    { value: 'quinta', label: 'Quinta' },
    { value: 'sexta', label: 'Sexta' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
              <p className="text-muted-foreground mt-1">
                Carregando configurações...
              </p>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              Carregando configurações do sistema...
            </div>
          </div>
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
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as configurações do seu sistema CRM
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              disabled={saving}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
            <Button 
              onClick={handleSaveAll}
              disabled={saving || isVisitor}
              className="gradient-primary"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Todas
            </Button>
          </div>
        </div>

        {isVisitor && (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo Visitante:</strong> As configurações são apenas para visualização. 
              Faça login para editar as configurações.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geral" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="calendario" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Configurações Gerais */}
          <TabsContent value="geral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Informações da Clínica
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas da sua clínica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_clinica">Nome da Clínica</Label>
                    <Input
                      id="nome_clinica"
                      value={configGeral.nome_clinica}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, nome_clinica: e.target.value }))}
                      placeholder="Digite o nome da clínica"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={configGeral.cnpj}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, cnpj: e.target.value }))}
                      placeholder="00.000.000/0000-00"
                      disabled={isVisitor}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={configGeral.endereco}
                    onChange={(e) => setConfigGeral(prev => ({ ...prev, endereco: e.target.value }))}
                    placeholder="Rua, número, bairro, cidade - UF"
                    disabled={isVisitor}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_contato">Email de Contato</Label>
                    <Input
                      id="email_contato"
                      type="email"
                      value={configGeral.email_contato}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, email_contato: e.target.value }))}
                      placeholder="contato@clinica.com"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone_contato">Telefone de Contato</Label>
                    <Input
                      id="telefone_contato"
                      value={configGeral.telefone_contato}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, telefone_contato: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      disabled={isVisitor}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horario_funcionamento">Horário de Funcionamento</Label>
                    <Input
                      id="horario_funcionamento"
                      value={configGeral.horario_funcionamento}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, horario_funcionamento: e.target.value }))}
                      placeholder="08:00 - 18:00"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Input
                      id="timezone"
                      value={configGeral.timezone}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, timezone: e.target.value }))}
                      placeholder="America/Sao_Paulo"
                      disabled={isVisitor}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações WhatsApp */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Configurações WhatsApp
                </CardTitle>
                <CardDescription>
                  Configure as mensagens automáticas e integração WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>WhatsApp Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar/desativar funcionalidades do WhatsApp
                    </p>
                  </div>
                  <Switch
                    checked={configWhatsApp.ativo}
                    onCheckedChange={(checked) => setConfigWhatsApp(prev => ({ ...prev, ativo: checked }))}
                    disabled={isVisitor}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mensagem_boas_vindas">Mensagem de Boas-vindas</Label>
                    <Textarea
                      id="mensagem_boas_vindas"
                      value={configWhatsApp.mensagem_boas_vindas}
                      onChange={(e) => setConfigWhatsApp(prev => ({ ...prev, mensagem_boas_vindas: e.target.value }))}
                      placeholder="Digite a mensagem de boas-vindas..."
                      rows={3}
                      disabled={isVisitor}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensagem_lembrete">Mensagem de Lembrete</Label>
                    <Textarea
                      id="mensagem_lembrete"
                      value={configWhatsApp.mensagem_lembrete}
                      onChange={(e) => setConfigWhatsApp(prev => ({ ...prev, mensagem_lembrete: e.target.value }))}
                      placeholder="Digite a mensagem de lembrete..."
                      rows={3}
                      disabled={isVisitor}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{hora}"} para inserir o horário da consulta automaticamente
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensagem_followup">Mensagem de Follow-up</Label>
                    <Textarea
                      id="mensagem_followup"
                      value={configWhatsApp.mensagem_followup}
                      onChange={(e) => setConfigWhatsApp(prev => ({ ...prev, mensagem_followup: e.target.value }))}
                      placeholder="Digite a mensagem de follow-up..."
                      rows={3}
                      disabled={isVisitor}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horario_inicio">Horário de Envio (Início)</Label>
                    <Input
                      id="horario_inicio"
                      type="time"
                      value={configWhatsApp.horario_envio_inicio}
                      onChange={(e) => setConfigWhatsApp(prev => ({ ...prev, horario_envio_inicio: e.target.value }))}
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horario_fim">Horário de Envio (Fim)</Label>
                    <Input
                      id="horario_fim"
                      type="time"
                      value={configWhatsApp.horario_envio_fim}
                      onChange={(e) => setConfigWhatsApp(prev => ({ ...prev, horario_envio_fim: e.target.value }))}
                      disabled={isVisitor}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dias da Semana para Envio</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {diasSemana.map((dia) => (
                      <div key={dia.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={dia.value}
                          checked={configWhatsApp.dias_semana.includes(dia.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConfigWhatsApp(prev => ({
                                ...prev,
                                dias_semana: [...prev.dias_semana, dia.value]
                              }));
                            } else {
                              setConfigWhatsApp(prev => ({
                                ...prev,
                                dias_semana: prev.dias_semana.filter(d => d !== dia.value)
                              }));
                            }
                          }}
                          disabled={isVisitor}
                          className="rounded"
                        />
                        <Label htmlFor={dia.value} className="text-sm">{dia.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status da Conexão WhatsApp */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Status da Conexão WhatsApp</h4>
                      <p className="text-sm text-muted-foreground">
                        {whatsappConnection.isConnected 
                          ? `Conectado como ${whatsappConnection.phoneNumber}` 
                          : 'Não conectado'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={whatsappConnection.isConnected ? "default" : "secondary"}>
                        {whatsappConnection.isConnected ? "Conectado" : "Desconectado"}
                      </Badge>
                      {!isVisitor && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={whatsappConnection.isConnected ? whatsappDisconnect : whatsappConnect}
                        >
                          {whatsappConnection.isConnected ? "Desconectar" : "Conectar"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações Google Calendar */}
          <TabsContent value="calendario" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Configurações Google Calendar
                </CardTitle>
                <CardDescription>
                  Configure a integração com o Google Calendar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Google Calendar Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar/desativar sincronização com Google Calendar
                    </p>
                  </div>
                  <Switch
                    checked={configGoogleCalendar.ativo}
                    onCheckedChange={(checked) => setConfigGoogleCalendar(prev => ({ ...prev, ativo: checked }))}
                    disabled={isVisitor}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calendario_principal">Calendário Principal</Label>
                    <Input
                      id="calendario_principal"
                      value={configGoogleCalendar.calendario_principal}
                      onChange={(e) => setConfigGoogleCalendar(prev => ({ ...prev, calendario_principal: e.target.value }))}
                      placeholder="primary"
                      disabled={isVisitor}
                    />
                    <p className="text-xs text-muted-foreground">
                      ID do calendário principal (use "primary" para o calendário padrão)
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sincronização Automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Sincronizar eventos automaticamente
                      </p>
                    </div>
                    <Switch
                      checked={configGoogleCalendar.sincronizacao_automatica}
                      onCheckedChange={(checked) => setConfigGoogleCalendar(prev => ({ ...prev, sincronizacao_automatica: checked }))}
                      disabled={isVisitor}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações por email do Google Calendar
                      </p>
                    </div>
                    <Switch
                      checked={configGoogleCalendar.notificacoes_email}
                      onCheckedChange={(checked) => setConfigGoogleCalendar(prev => ({ ...prev, notificacoes_email: checked }))}
                      disabled={isVisitor}
                    />
                  </div>
                </div>

                {/* Status da Conexão Google Calendar */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Status da Conexão Google Calendar</h4>
                      <p className="text-sm text-muted-foreground">
                        {googleConnected ? 'Conectado e sincronizado' : 'Não conectado'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={googleConnected ? "default" : "secondary"}>
                        {googleConnected ? "Conectado" : "Desconectado"}
                      </Badge>
                      {!isVisitor && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={googleConnected ? googleDisconnect : googleConnect}
                        >
                          {googleConnected ? "Desconectar" : "Conectar"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Notificações */}
          <TabsContent value="notificacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Configurações de Notificações
                </CardTitle>
                <CardDescription>
                  Configure como e quando receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações por email
                      </p>
                    </div>
                    <Switch
                      checked={configNotificacoes.email_ativo}
                      onCheckedChange={(checked) => setConfigNotificacoes(prev => ({ ...prev, email_ativo: checked }))}
                      disabled={isVisitor}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações WhatsApp</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações via WhatsApp
                      </p>
                    </div>
                    <Switch
                      checked={configNotificacoes.whatsapp_ativo}
                      onCheckedChange={(checked) => setConfigNotificacoes(prev => ({ ...prev, whatsapp_ativo: checked }))}
                      disabled={isVisitor}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lembrete de Consulta</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar lembretes antes das consultas
                      </p>
                    </div>
                    <Switch
                      checked={configNotificacoes.lembrete_consulta}
                      onCheckedChange={(checked) => setConfigNotificacoes(prev => ({ ...prev, lembrete_consulta: checked }))}
                      disabled={isVisitor}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Follow-up Automático</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar follow-up automático após consultas
                      </p>
                    </div>
                    <Switch
                      checked={configNotificacoes.followup_automatico}
                      onCheckedChange={(checked) => setConfigNotificacoes(prev => ({ ...prev, followup_automatico: checked }))}
                      disabled={isVisitor}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Relatórios Semanais</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber relatórios semanais por email
                      </p>
                    </div>
                    <Switch
                      checked={configNotificacoes.relatorios_semanais}
                      onCheckedChange={(checked) => setConfigNotificacoes(prev => ({ ...prev, relatorios_semanais: checked }))}
                      disabled={isVisitor}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de Segurança */}
          <TabsContent value="seguranca" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Configurações de Segurança
                </CardTitle>
                <CardDescription>
                  Gerencie a segurança da sua conta e dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha atual"
                        disabled={isVisitor}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isVisitor}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">Nova Senha</Label>
                    <Input
                      id="new_password"
                      type="password"
                      placeholder="Digite sua nova senha"
                      disabled={isVisitor}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      placeholder="Confirme sua nova senha"
                      disabled={isVisitor}
                    />
                  </div>

                  <Button disabled={isVisitor}>
                    <Key className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Exportar Dados</h4>
                  <p className="text-sm text-muted-foreground">
                    Baixe uma cópia dos seus dados em formato JSON
                  </p>
                  <Button variant="outline" disabled={isVisitor}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Dados
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-destructive">Zona de Perigo</h4>
                  <p className="text-sm text-muted-foreground">
                    Ações irreversíveis que afetam permanentemente sua conta
                  </p>
                  <Button variant="destructive" disabled={isVisitor}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

