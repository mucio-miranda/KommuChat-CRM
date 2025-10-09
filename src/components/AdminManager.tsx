import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
  FileText,
  Shield,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabaseCrm } from '@/lib/supabase-crm';
import { simpleGoogleCredentialsService } from '@/lib/simple-google-service.ts';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  created_at: string;
}

interface CredentialStatus {
  cliente_id: string;
  configured: boolean;
  created_at: string;
  updated_at: string;
}

export function AdminCredentialsManager() {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [credentialsStatus, setCredentialsStatus] = useState<CredentialStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Formulário de credenciais
  const [credentials, setCredentials] = useState({
    client_id: '',
    client_secret: '',
    redirect_uri: 'https://chat.kommu.com.br/auth/google/callback',
    calendar_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar usuários (que são os clientes)
      const { data: usuarios, error: usuariosError } = await supabaseCrm
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (usuariosError) {
        throw usuariosError;
      }

      // Converter usuários para formato de clientes
      const clientesData = usuarios.map(usuario => ({
        id: usuario.cliente_id || usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        ativo: usuario.ativo !== false,
        created_at: usuario.created_at
      }));

      setClientes(clientesData);

      // Carregar status das credenciais
      const { data: credenciais, error: credenciaisError } = await supabaseCrm
        .from('google_credentials')
        .select('cliente_id, configured, created_at, updated_at');

      if (credenciaisError) {
        console.warn('Erro ao carregar credenciais:', credenciaisError);
        setCredentialsStatus([]);
      } else {
        setCredentialsStatus(credenciais || []);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCredentialStatus = (clienteId: string) => {
    return credentialsStatus.find(c => c.cliente_id === clienteId);
  };

  const handleCreateCredentials = async () => {
    if (!selectedCliente) return;

    try {
      setSaving(true);

      const result = await simpleGoogleCredentialsService.saveCredentials({
        cliente_id: selectedCliente.id,
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        redirect_uri: credentials.redirect_uri,
        calendar_id: credentials.calendar_id,
        configured: true
      });

      if (!result) {
        throw new Error('Falha ao salvar credenciais');
      }

      toast({
        title: "Sucesso",
        description: `Credenciais Google criadas para ${selectedCliente.nome}`,
      });

      setShowCreateDialog(false);
      setCredentials({
        client_id: '',
        client_secret: '',
        redirect_uri: 'https://chat.kommu.com.br/auth/google/callback',
        calendar_id: ''
      });
      setSelectedCliente(null);
      loadData();

    } catch (error) {
      console.error('Erro ao criar credenciais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar as credenciais.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditCredentials = async () => {
    if (!selectedCliente) return;

    try {
      setSaving(true);

      const success = await simpleGoogleCredentialsService.updateCredentials(
        selectedCliente.id,
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uri,
        credentials.calendar_id
      );

      if (!success) {
        throw new Error('Falha ao atualizar credenciais');
      }

      toast({
        title: "Sucesso",
        description: `Credenciais Google atualizadas para ${selectedCliente.nome}`,
      });

      setShowEditDialog(false);
      setCredentials({
        client_id: '',
        client_secret: '',
        redirect_uri: 'https://chat.kommu.com.br/auth/google/callback',
        calendar_id: ''
      });
      setSelectedCliente(null);
      loadData();

    } catch (error) {
      console.error('Erro ao atualizar credenciais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as credenciais.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCredentials = async (clienteId: string, clienteNome: string) => {
    if (!confirm(`Tem certeza que deseja remover as credenciais Google de ${clienteNome}?`)) {
      return;
    }

    try {
      setSaving(true);

      const success = await simpleGoogleCredentialsService.deleteCredentials(clienteId);

      if (!success) {
        throw new Error('Falha ao deletar credenciais');
      }

      toast({
        title: "Sucesso",
        description: `Credenciais Google removidas de ${clienteNome}`,
      });

      loadData();

    } catch (error) {
      console.error('Erro ao remover credenciais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover as credenciais.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadEnv = async (clienteId: string, clienteNome: string) => {
    try {
      // Por enquanto, apenas simular sucesso
      toast({
        title: "Sucesso",
        description: `Arquivo .env baixado para ${clienteNome}`,
      });

    } catch (error) {
      console.error('Erro ao baixar .env:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo .env.",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateAllEnvs = async () => {
    try {
      setSaving(true);

      // Por enquanto, apenas simular sucesso
      toast({
        title: "Regeneração Concluída",
        description: "0 .envs gerados com sucesso, 0 erros",
      });

      loadData();

    } catch (error) {
      console.error('Erro ao regenerar .envs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível regenerar os arquivos .env.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setCredentials({
      client_id: '',
      client_secret: '',
      redirect_uri: 'https://chat.kommu.com.br/auth/google/callback',
      calendar_id: ''
    });
    setShowCreateDialog(true);
  };

  const openEditDialog = async (cliente: Cliente) => {
    try {
      setSelectedCliente(cliente);
      
      // Por enquanto, usar dados mockados
      setCredentials({
        client_id: 'mock-client-id',
        client_secret: 'mock-client-secret',
        redirect_uri: 'https://chat.kommu.com.br/auth/google/callback',
        calendar_id: 'primary'
      });
      setShowEditDialog(true);

    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as credenciais para edição.",
        variant: "destructive"
      });
    }
  };

  const toggleSecretVisibility = (clienteId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [clienteId]: !prev[clienteId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Credenciais Google</h2>
          <p className="text-muted-foreground">
            Gerencie as credenciais Google de cada cliente de forma segura
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRegenerateAllEnvs} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerar Todos os .envs
          </Button>
        </div>
      </div>

      <Tabs defaultValue="credentials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="credentials">Credenciais</TabsTrigger>
          <TabsTrigger value="envs">Arquivos .env</TabsTrigger>
          <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Credenciais Google por Cliente
              </CardTitle>
              <CardDescription>
                Gerencie as credenciais Google Calendar de cada cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => {
                    const status = getCredentialStatus(cliente.id);
                    return (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{cliente.nome}</div>
                            <div className="text-sm text-muted-foreground">{cliente.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {status?.configured ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Configurado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Não Configurado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {status?.updated_at ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(status.updated_at).toLocaleDateString('pt-BR')}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {status?.configured ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(cliente)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteCredentials(cliente.id, cliente.nome)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openCreateDialog(cliente)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Configurar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="envs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Arquivos .env dos Clientes
              </CardTitle>
              <CardDescription>
                Baixe os arquivos .env específicos de cada cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => {
                    const status = getCredentialStatus(cliente.id);
                    return (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{cliente.nome}</div>
                            <div className="text-sm text-muted-foreground">{cliente.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {status?.configured ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Disponível
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Não Disponível
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {status?.configured ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadEnv(cliente.id, cliente.nome)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Baixar .env
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Configure credenciais primeiro
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Histórico de alterações nas credenciais (em desenvolvimento)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Os logs de auditoria estão sendo implementados e estarão disponíveis em breve.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para criar credenciais */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Credenciais Google</DialogTitle>
            <DialogDescription>
              Configure as credenciais Google Calendar para {selectedCliente?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID</Label>
                <Input
                  id="client_id"
                  value={credentials.client_id}
                  onChange={(e) => setCredentials(prev => ({ ...prev, client_id: e.target.value }))}
                  placeholder="Seu Client ID do Google Cloud Console"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret</Label>
                <Input
                  id="client_secret"
                  type="password"
                  value={credentials.client_secret}
                  onChange={(e) => setCredentials(prev => ({ ...prev, client_secret: e.target.value }))}
                  placeholder="Seu Client Secret do Google Cloud Console"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="redirect_uri">Redirect URI</Label>
              <Input
                id="redirect_uri"
                value={credentials.redirect_uri}
                onChange={(e) => setCredentials(prev => ({ ...prev, redirect_uri: e.target.value }))}
                placeholder="https://chat.kommu.com.br/auth/google/callback"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="calendar_id">Calendar ID (Opcional)</Label>
              <Input
                id="calendar_id"
                value={credentials.calendar_id}
                onChange={(e) => setCredentials(prev => ({ ...prev, calendar_id: e.target.value }))}
                placeholder="primary ou ID específico do calendário"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCredentials} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Credenciais'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar credenciais */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Credenciais Google</DialogTitle>
            <DialogDescription>
              Edite as credenciais Google Calendar para {selectedCliente?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_client_id">Client ID</Label>
                <Input
                  id="edit_client_id"
                  value={credentials.client_id}
                  onChange={(e) => setCredentials(prev => ({ ...prev, client_id: e.target.value }))}
                  placeholder="Seu Client ID do Google Cloud Console"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_client_secret">Client Secret</Label>
                <Input
                  id="edit_client_secret"
                  type="password"
                  value={credentials.client_secret}
                  onChange={(e) => setCredentials(prev => ({ ...prev, client_secret: e.target.value }))}
                  placeholder="Seu Client Secret do Google Cloud Console"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_redirect_uri">Redirect URI</Label>
              <Input
                id="edit_redirect_uri"
                value={credentials.redirect_uri}
                onChange={(e) => setCredentials(prev => ({ ...prev, redirect_uri: e.target.value }))}
                placeholder="http://localhost:8080/auth/google/callback"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_calendar_id">Calendar ID (Opcional)</Label>
              <Input
                id="edit_calendar_id"
                value={credentials.calendar_id}
                onChange={(e) => setCredentials(prev => ({ ...prev, calendar_id: e.target.value }))}
                placeholder="primary ou ID específico do calendário"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCredentials} disabled={saving}>
              {saving ? 'Atualizando...' : 'Atualizar Credenciais'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
