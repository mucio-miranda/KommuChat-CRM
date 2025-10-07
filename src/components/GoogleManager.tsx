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
  Calendar, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Edit, 
  Save,
  X,
  Shield
} from 'lucide-react';
import { simpleGoogleCredentialsService, SimpleGoogleCredentials } from '@/lib/simple-google-service.ts';
import { useSupabase } from '@/hooks/useSupabase';
import { toast } from '@/components/ui/use-toast';

interface GoogleCredentialsManagerProps {
  clienteId: string;
  clienteNome: string;
  onCredentialsUpdated?: () => void;
}

export function GoogleCredentialsManager({ 
  clienteId, 
  clienteNome, 
  onCredentialsUpdated 
}: GoogleCredentialsManagerProps) {
  const { write: supabaseWrite } = useSupabase();
  const [credentials, setCredentials] = useState<SimpleGoogleCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCredentials, setEditingCredentials] = useState({
    client_id: '',
    client_secret: '',
    redirect_uri: 'http://localhost:8080/auth/google/callback',
    calendar_id: ''
  });

  useEffect(() => {
    loadCredentials();
  }, [clienteId]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const creds = await simpleGoogleCredentialsService.getCredentials(clienteId);
      setCredentials(creds);
      
      if (creds) {
        setEditingCredentials({
          client_id: creds.client_id || '',
          client_secret: creds.client_secret || '',
          redirect_uri: creds.redirect_uri || 'http://localhost:8080/auth/google/callback',
          calendar_id: creds.calendar_id || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as credenciais Google.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async () => {
    try {
      setSaving(true);
      
      const success = await simpleGoogleCredentialsService.updateCredentials(
        clienteId,
        editingCredentials.client_id,
        editingCredentials.client_secret,
        editingCredentials.redirect_uri,
        editingCredentials.calendar_id
      );

      if (success) {
        toast({
          title: "Sucesso",
          description: "Credenciais Google atualizadas com sucesso!",
          variant: "default"
        });
        
        setShowEditDialog(false);
        await loadCredentials();
        onCredentialsUpdated?.();
      } else {
        throw new Error('Falha ao salvar credenciais');
      }
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as credenciais Google.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingCredentials({
      client_id: credentials?.client_id || '',
      client_secret: credentials?.client_secret || '',
          redirect_uri: credentials?.redirect_uri || 'http://localhost:8080/auth/google/callback',
      calendar_id: credentials?.calendar_id || ''
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando credenciais...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Credenciais Google Calendar (Seguras)
        </CardTitle>
        <CardDescription>
          Configuração criptografada para {clienteNome} - Todas as credenciais sensíveis são protegidas com AES-256
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status das credenciais */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {credentials?.configured ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">Configurado e Criptografado</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  🔒 Seguro
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-700 font-medium">Não configurado</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Inativo
                </Badge>
              </>
            )}
          </div>
          
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={resetForm}>
                <Edit className="w-4 h-4 mr-2" />
                {credentials?.configured ? 'Editar' : 'Configurar'}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurar Credenciais Google</DialogTitle>
                <DialogDescription>
                  Configure as credenciais do Google Cloud Console para {clienteNome}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Como obter as credenciais:</strong>
                    <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
                      <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                      <li>Vá para "APIs & Services" → "Credentials"</li>
                      <li>Crie um "OAuth 2.0 Client ID" (tipo: Web application)</li>
                      <li>Configure a Redirect URI: <code className="bg-gray-100 px-1 rounded">http://localhost:8080/auth/google/callback</code></li>
                      <li>Copie o Client ID gerado</li>
                    </ol>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_client_id">Client ID do Google *</Label>
                    <Input
                      id="edit_client_id"
                      type="text"
                      value={editingCredentials.client_id}
                      onChange={(e) => setEditingCredentials({
                        ...editingCredentials,
                        client_id: e.target.value
                      })}
                      placeholder="123456789-abcdef.apps.googleusercontent.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_client_secret">Client Secret do Google *</Label>
                    <Input
                      id="edit_client_secret"
                      type="password"
                      value={editingCredentials.client_secret}
                      onChange={(e) => setEditingCredentials({
                        ...editingCredentials,
                        client_secret: e.target.value
                      })}
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                    />
                    <p className="text-xs text-muted-foreground">
                      Client Secret obtido no Google Cloud Console
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_redirect_uri">Redirect URI *</Label>
                    <Input
                      id="edit_redirect_uri"
                      type="text"
                      value={editingCredentials.redirect_uri}
                      onChange={(e) => setEditingCredentials({
                        ...editingCredentials,
                        redirect_uri: e.target.value
                      })}
                      placeholder="http://localhost:8080/auth/google/callback"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_calendar_id">ID do Calendário (Opcional)</Label>
                    <Input
                      id="edit_calendar_id"
                      type="text"
                      value={editingCredentials.calendar_id}
                      onChange={(e) => setEditingCredentials({
                        ...editingCredentials,
                        calendar_id: e.target.value
                      })}
                      placeholder="calendario@clinica.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe vazio para usar o calendário principal do usuário
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDialog(false);
                    resetForm();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={saveCredentials}
                  disabled={saving || !editingCredentials.client_id || !editingCredentials.client_secret || !editingCredentials.redirect_uri}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Detalhes das credenciais */}
        {credentials?.configured && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Client ID:</span>
                <p className="text-gray-900 font-mono text-xs break-all">
                  {credentials.client_id}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Redirect URI:</span>
                <p className="text-gray-900 font-mono text-xs break-all">
                  {credentials.redirect_uri}
                </p>
              </div>
              {credentials.calendar_id && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Calendário:</span>
                  <p className="text-gray-900 font-mono text-xs break-all">
                    {credentials.calendar_id}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
