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
  Plus, 
  Users, 
  Settings, 
  Calendar, 
  MessageCircle, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Database,
  RefreshCw
} from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { toast } from '@/components/ui/use-toast';
import TableSelector from '@/components/TableSelector';
import { GoogleCredentialsManager } from '@/components/GoogleManager.tsx';
import { QRCodeManager } from '@/components/QRCodeManager';
import { simpleGoogleCredentialsService } from '@/lib/simple-google-service.ts';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tipo: 'clinica' | 'profissional';
  cnpj_cpf: string;
  endereco: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface Usuario {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'funcionario';
  cliente_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface Configuracao {
  id: string;
  cliente_id: string;
  chave: string;
  valor: string;
  tipo: string;
}

export default function UserManagement() {
  const { read: supabaseRead, write: supabaseWrite } = useSupabase();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Formulário para novo cliente
  const [newCliente, setNewCliente] = useState({
    nome: '',
    username: '',
    email_login: '',
    senha: '',
    telefone: '',
    google_calendar_email: '',
    google_client_id: '',
    google_client_secret: '',
    google_redirect_uri: 'http://localhost:8080/auth/google/callback',
    google_calendar_id: '',
    qr_code_file: null as File | null,
    tabela_supabase: 'none',
    evo_base_url: '',
    evo_instance: '',
    evo_api_key: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!supabaseWrite) return;

    try {
      setLoading(true);
      
      // Tentar carregar dados do Supabase CRM (para escrita)
      try {
        // Carregar clientes do projeto CRM
        const { data: clientesData, error: clientesError } = await supabaseWrite
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false });

        if (clientesError) throw clientesError;
        setClientes(clientesData || []);

        // Carregar usuários (opcional - pode não existir)
        try {
          const { data: usuariosData, error: usuariosError } = await supabaseWrite
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false });

          if (!usuariosError) {
            setUsuarios(usuariosData || []);
            console.log('✅ Usuários carregados');
          } else {
            console.log('⚠️ Não foi possível carregar usuários:', usuariosError.message);
            setUsuarios([]);
          }
        } catch (usuariosErr) {
          console.log('⚠️ Erro ao carregar usuários:', usuariosErr.message);
          setUsuarios([]);
        }

        // Carregar configurações (opcional - pode não existir)
        try {
          const { data: configData, error: configError } = await supabaseWrite
            .from('configuracoes_cliente')
            .select('*');

          if (!configError) {
            setConfiguracoes(configData || []);
            console.log('✅ Configurações carregadas');
          } else {
            console.log('⚠️ Não foi possível carregar configurações:', configError.message);
            setConfiguracoes([]);
          }
        } catch (configsErr) {
          console.log('⚠️ Erro ao carregar configurações:', configsErr.message);
          setConfiguracoes([]);
        }

        // Carregar credenciais Google (opcional - pode não existir)
        try {
          const { data: credentialsData, error: credentialsError } = await supabaseWrite
            .from('google_credentials')
            .select('*');

          if (!credentialsError) {
            console.log('✅ Credenciais Google carregadas:', credentialsData?.length || 0);
            // As credenciais serão exibidas na interface
          } else {
            console.log('⚠️ Não foi possível carregar credenciais Google:', credentialsError.message);
          }
        } catch (credentialsErr) {
          console.log('⚠️ Erro ao carregar credenciais Google:', credentialsErr.message);
        }

        console.log('✅ Dados carregados do Supabase com sucesso');

      } catch (supabaseError) {
        console.warn('⚠️ Erro ao carregar dados do Supabase, usando dados mockados:', supabaseError);
        
        // Usar dados mockados se o Supabase não estiver configurado
        const mockClientes = [
          {
            id: 'demo-001',
            nome: 'Clínica Demo',
            email: 'demo@clinica.com',
            telefone: '(11) 99999-9999',
            tipo: 'clinica' as const,
            cnpj_cpf: '12.345.678/0001-90',
            endereco: 'Rua Demo, 123',
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        const mockUsuarios = [
          {
            id: 'user-001',
            email: 'admin@clinica.com',
            nome: 'Admin Demo',
            role: 'admin' as const,
            cliente_id: 'demo-001',
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        const mockConfigs = [
          {
            id: 'config-001',
            cliente_id: 'demo-001',
            chave: 'google_calendar_email',
            valor: 'calendario@clinica.com',
            tipo: 'string',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'config-002',
            cliente_id: 'demo-001',
            chave: 'tabela_supabase',
            valor: 'pacientes',
            tipo: 'string',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        setClientes(mockClientes);
        setUsuarios(mockUsuarios);
        setConfiguracoes(mockConfigs);

        toast({
          title: "Modo Demo",
          description: "Usando dados de exemplo. Configure o Supabase para ver seus dados reais.",
          variant: "default"
        });
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


  const createCliente = async () => {
    if (!supabaseWrite) return;

    try {
      // 1. Criar cliente no projeto CRM
      console.log('🔧 Tentando criar cliente:', {
        nome: newCliente.nome,
        email: newCliente.email_login,
        telefone: newCliente.telefone,
        tipo: 'clinica',
        ativo: true
      });
      
      const { data: clienteData, error: clienteError } = await supabaseWrite
        .from('clientes')
        .insert([{
          nome: newCliente.nome,
          email: newCliente.email_login,
          telefone: newCliente.telefone,
          tipo: 'clinica',
          cnpj_cpf: '',
          endereco: '',
          ativo: true
        }])
        .select()
        .single();

      if (clienteError) {
        console.log('❌ Erro ao criar cliente:', clienteError);
        throw clienteError;
      }
      
      console.log('✅ Cliente criado com sucesso:', clienteData);

      // 2. Criar usuário na tabela usuarios com username e senha hasheada
      try {
        console.log('🔧 Iniciando criação do usuário admin...');
        console.log('📝 Dados do usuário:', {
          username: newCliente.username,
          email: newCliente.email_login,
          nome: `Admin ${newCliente.nome}`,
          cliente_id: clienteData.id
        });

        // Verificar se username já existe
        const { data: existingUser, error: checkError } = await supabaseWrite
          .from('usuarios')
          .select('username')
          .eq('username', newCliente.username)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.log('⚠️ Erro ao verificar username:', checkError.message);
          throw checkError;
        }

        if (existingUser) {
          console.log('❌ Username já existe:', existingUser);
          toast({
            title: "Erro",
            description: "Username já está em uso. Escolha outro username.",
            variant: "destructive"
          });
          return;
        }

        console.log('✅ Username disponível, criando hash da senha...');

        // Criar hash da senha
        const { data: hashedPassword, error: hashError } = await supabaseWrite
          .rpc('hash_password', { password_param: newCliente.senha });

        if (hashError) {
          console.log('❌ Erro ao criar hash da senha:', hashError.message);
          throw hashError;
        }

        console.log('✅ Hash da senha criado, inserindo usuário...');

        const { data: usuarioData, error: usuarioError } = await supabaseWrite
          .from('usuarios')
          .insert([{
            email: newCliente.email_login,
            username: newCliente.username,
            nome: `Admin ${newCliente.nome}`,
            role: 'admin',
            cliente_id: clienteData.id,
            password: hashedPassword, // Usar a coluna password existente
            ativo: true
          }])
          .select()
          .single();

        if (usuarioError) {
          console.log('❌ Erro ao criar usuário na tabela usuarios:', usuarioError);
          console.log('❌ Detalhes do erro:', {
            code: usuarioError.code,
            message: usuarioError.message,
            details: usuarioError.details,
            hint: usuarioError.hint
          });
          throw usuarioError;
        } else {
          console.log('✅ Usuário criado na tabela usuarios com sucesso:', usuarioData);
          toast({
            title: "Sucesso",
            description: `Usuário admin ${newCliente.username} criado com sucesso!`,
          });
        }
      } catch (usuarioErr) {
        console.log('❌ Erro geral ao criar usuário na tabela usuarios:', usuarioErr);
        toast({
          title: "Erro",
          description: `Erro ao criar usuário: ${usuarioErr.message}`,
          variant: "destructive"
        });
        throw usuarioErr; // Re-throw para parar a execução
      }

      // 3. Upload do QR Code se fornecido
      let qrCodeUrl = '';
      let qrCodeRecordId = null;
      
      if (newCliente.qr_code_file) {
        try {
          console.log('📤 Iniciando upload do QR Code...');
          
          // Criar pasta específica para o cliente
          const fileExt = newCliente.qr_code_file.name.split('.').pop();
          const fileName = `qr_code_${clienteData.id}_${Date.now()}.${fileExt}`;
          const filePath = `cliente-${clienteData.id}/${fileName}`;
          
          console.log('📁 Caminho do arquivo:', filePath);
          
          // Fazer upload para o storage
          const { data: uploadData, error: uploadError } = await supabaseWrite.storage
            .from('qr-codes')
            .upload(filePath, newCliente.qr_code_file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('❌ Erro no upload do QR Code:', uploadError);
            throw new Error(`Erro no upload: ${uploadError.message}`);
          }

          console.log('✅ Upload realizado com sucesso:', uploadData);

          // Obter URL pública
          const { data: { publicUrl } } = supabaseWrite.storage
            .from('qr-codes')
            .getPublicUrl(filePath);
          
          qrCodeUrl = publicUrl;
          console.log('🔗 URL pública gerada:', qrCodeUrl);

          // Salvar metadados na tabela whatsapp_qr_codes
          const { data: qrCodeData, error: qrCodeError } = await supabaseWrite
            .from('whatsapp_qr_codes')
            .insert({
              cliente_id: clienteData.id,
              qr_code_image_url: qrCodeUrl,
              file_name: fileName,
              file_size: newCliente.qr_code_file.size,
              mime_type: newCliente.qr_code_file.type,
              status: 'pending',
              expires_at: null // Sem expiração
            })
            .select()
            .single();

          if (qrCodeError) {
            console.warn('⚠️ Erro ao salvar metadados do QR Code:', qrCodeError);
            // Não falhar a criação do cliente por causa disso
          } else {
            qrCodeRecordId = qrCodeData.id;
            console.log('✅ Metadados do QR Code salvos:', qrCodeData);
          }

        } catch (uploadErr) {
          console.error('❌ Erro geral no upload do QR Code:', uploadErr);
          // Continuar com a criação do cliente mesmo se o upload falhar
          toast({
            title: "Aviso",
            description: "Cliente criado, mas houve problema no upload do QR Code. Você pode fazer upload depois.",
            variant: "default"
          });
        }
      }

      // 4. Preparar nome da tabela selecionada
      const tableName = newCliente.tabela_supabase === 'none' ? '' : newCliente.tabela_supabase;

      // 5. Criar credenciais Google automaticamente
      try {
        console.log('💾 Criando credenciais Google automaticamente...');
        
        const credentialsSaved = await simpleGoogleCredentialsService.createDefaultCredentials(clienteData.id);
        
        if (credentialsSaved) {
          console.log('✅ Credenciais Google padrão criadas');
          
          // Se credenciais foram fornecidas, atualizar com os valores reais
          if (newCliente.google_client_id && newCliente.google_client_secret) {
            console.log('🔄 Atualizando com credenciais fornecidas...');
            await simpleGoogleCredentialsService.updateCredentials(
              clienteData.id,
              newCliente.google_client_id,
              newCliente.google_client_secret,
              newCliente.google_redirect_uri || 'http://localhost:8080/auth/google/callback',
              newCliente.google_calendar_id
            );
            console.log('✅ Credenciais Google atualizadas com valores fornecidos');
          } else {
            console.log('ℹ️ Credenciais padrão criadas - admin pode configurar depois');
          }
        }

        if (!credentialsSaved) {
          console.warn('⚠️ Não foi possível criar credenciais Google padrão');
        }

        console.log('✅ Credenciais Google salvas com segurança');
      } catch (error) {
        console.error('❌ Erro ao salvar credenciais Google:', error);
        throw error;
      }

      // 6. Criar configurações (opcional - pode não existir a tabela)
      try {
        const configs = [
          { chave: 'google_calendar_enabled', valor: 'true', tipo: 'boolean' },
          { chave: 'google_calendar_email', valor: newCliente.google_calendar_email, tipo: 'string' },
          { chave: 'google_credentials_configured', valor: newCliente.google_client_id ? 'true' : 'false', tipo: 'boolean' },
          { chave: 'whatsapp_enabled', valor: 'true', tipo: 'boolean' },
          { chave: 'whatsapp_qr_code_url', valor: qrCodeUrl, tipo: 'string' },
          { chave: 'whatsapp_qr_code_id', valor: qrCodeRecordId || '', tipo: 'string' },
          { chave: 'clinica_nome', valor: newCliente.nome, tipo: 'string' },
          { chave: 'clinica_telefone', valor: newCliente.telefone, tipo: 'string' },
          { chave: 'tabela_supabase', valor: tableName, tipo: 'string' },
          { chave: 'agendamento_duracao_padrao', valor: '60', tipo: 'number' },
          { chave: 'lembrete_whatsapp_24h', valor: 'true', tipo: 'boolean' }
        ];

        // Adicionar configurações da Evolution API se fornecidas
        if (newCliente.evo_base_url && newCliente.evo_instance && newCliente.evo_api_key) {
          configs.push(
            { chave: 'evo_base_url', valor: newCliente.evo_base_url, tipo: 'string' },
            { chave: 'evo_instance', valor: newCliente.evo_instance, tipo: 'string' },
            { chave: 'evo_api_key', valor: newCliente.evo_api_key, tipo: 'string' }
          );
        }

        const configsWithClienteId = configs.map(config => ({
          ...config,
          cliente_id: clienteData.id
        }));

        console.log('🔧 Tentando inserir configurações:', configsWithClienteId);
        
        const { data: configData, error: configError } = await supabaseWrite
          .from('configuracoes_cliente')
          .insert(configsWithClienteId)
          .select();

        if (configError) {
          console.log('❌ Erro ao criar configurações:', configError);
          console.log('❌ Detalhes do erro:', {
            code: configError.code,
            message: configError.message,
            details: configError.details,
            hint: configError.hint
          });
        } else {
          console.log('✅ Configurações criadas com sucesso:', configData);
        }
      } catch (configErr) {
        console.log('⚠️ Erro ao criar configurações:', configErr.message);
      }

      // 6. Criar credenciais Google na tabela google_credentials
      if (newCliente.google_client_id && newCliente.google_client_secret) {
        try {
          const googleCredentials = {
            cliente_id: clienteData.id,
            client_id: newCliente.google_client_id,
            client_secret: newCliente.google_client_secret,
            redirect_uri: newCliente.google_redirect_uri || 'http://localhost:8080/auth/google/callback',
            calendar_id: newCliente.google_calendar_id || '',
            configured: true
          };

          console.log('🔧 Tentando inserir credenciais Google:', googleCredentials);
          
          const { data: credentialsData, error: credentialsError } = await supabaseWrite
            .from('google_credentials')
            .insert(googleCredentials)
            .select();

          if (credentialsError) {
            console.log('❌ Erro ao criar credenciais Google:', credentialsError);
          } else {
            console.log('✅ Credenciais Google criadas com sucesso:', credentialsData);
          }
        } catch (credentialsError) {
          console.warn('⚠️ Erro ao criar credenciais Google (tabela pode não existir):', credentialsError);
        }
      }

      // 7. Log da tabela selecionada
      if (tableName) {
        console.log('🔧 Tabela selecionada para cliente:', {
          cliente_id: clienteData.id,
          tabela_selecionada: tableName
        });

        console.log('✅ Tabela selecionada:', tableName);
        toast({
          title: "Tabela Selecionada",
          description: `Tabela ${tableName} associada ao cliente`,
        });
      } else {
        console.log('ℹ️ Nenhuma tabela específica selecionada para o cliente');
      }

      toast({
        title: "Sucesso",
        description: `Cliente ${newCliente.nome} criado com sucesso!`,
      });

      // Limpar formulário e fechar dialog
        setNewCliente({
          nome: '',
          username: '',
          email_login: '',
          senha: '',
          telefone: '',
          google_calendar_email: '',
          google_client_id: '',
          google_client_secret: '',
          google_redirect_uri: 'http://localhost:8080/auth/google/callback',
          google_calendar_id: '',
          qr_code_file: null,
          tabela_supabase: 'none',
          evo_base_url: '',
          evo_instance: '',
          evo_api_key: ''
        });
      setShowCreateDialog(false);
      loadData();

    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente.",
        variant: "destructive"
      });
    }
  };

  const getClienteConfig = (clienteId: string, chave: string) => {
    return configuracoes.find(c => c.cliente_id === clienteId && c.chave === chave)?.valor;
  };

  const removeCliente = async (clienteId: string, clienteNome: string) => {
    if (!supabaseWrite) return;

    // Confirmar remoção
    if (!confirm(`Tem certeza que deseja remover o cliente "${clienteNome}"?\n\nEsta ação não pode ser desfeita e removerá:\n- Cliente\n- Usuários associados\n- Configurações\n- Credenciais Google\n- Tokens Google\n- QR Codes`)) {
      return;
    }

    try {
      // 1. Remover configurações
      const { error: configError } = await supabaseWrite
        .from('configuracoes_cliente')
        .delete()
        .eq('cliente_id', clienteId);

      if (configError) {
        console.log('⚠️ Erro ao remover configurações:', configError.message);
      }

      // 2. Remover credenciais Google
      const { error: credentialsError } = await supabaseWrite
        .from('google_credentials')
        .delete()
        .eq('cliente_id', clienteId);

      if (credentialsError) {
        console.log('⚠️ Erro ao remover credenciais Google:', credentialsError.message);
      }

      // 3. Remover tokens Google dos usuários deste cliente
      const { error: tokensError } = await supabaseWrite
        .from('google_calendar_tokens')
        .delete()
        .in('user_id', usuarios.filter(u => u.cliente_id === clienteId).map(u => u.email));

      if (tokensError) {
        console.log('⚠️ Erro ao remover tokens Google:', tokensError.message);
      }

      // 4. Remover usuários
      const { error: usuariosError } = await supabaseWrite
        .from('usuarios')
        .delete()
        .eq('cliente_id', clienteId);

      if (usuariosError) {
        console.log('⚠️ Erro ao remover usuários:', usuariosError.message);
      }

      // 5. Remover cliente
      const { error: clienteError } = await supabaseWrite
        .from('clientes')
        .delete()
        .eq('id', clienteId);

      if (clienteError) throw clienteError;

      toast({
        title: "Sucesso",
        description: `Cliente "${clienteNome}" removido com sucesso!`,
      });

      // Recarregar dados
      loadData();

    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o cliente.",
        variant: "destructive"
      });
    }
  };

  const getClienteUsuarios = (clienteId: string) => {
    return usuarios.filter(u => u.cliente_id === clienteId);
  };

  const verifyClienteTables = async (clienteId: string) => {
    try {
      const tableName = getClienteConfig(clienteId, 'tabela_supabase');
      
      if (!tableName || tableName === 'none') {
        toast({
          title: "Nenhuma Tabela",
          description: "Este cliente não tem uma tabela específica selecionada",
          variant: "destructive"
        });
        return;
      }
      
      console.log('🔍 Verificando tabela para cliente:', clienteId, 'tabela:', tableName);
      
        // Verificar se a tabela existe
        const { data, error } = await supabaseWrite
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .single();

      if (error || !data) {
        toast({
          title: "Tabela Não Encontrada",
          description: `A tabela ${tableName} não foi encontrada no Supabase`,
          variant: "destructive"
        });
        console.warn(`❌ Tabela ${tableName}: Não existe`);
        return;
      }

      // Tentar contar as linhas
        let rowCount = 0;
        try {
          const { count } = await supabaseWrite
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        rowCount = count || 0;
      } catch (countError) {
        console.warn(`⚠️ Erro ao contar linhas da tabela ${tableName}:`, countError);
      }

      toast({
        title: "Tabela Verificada",
        description: `Tabela ${tableName} existe com ${rowCount} registros`,
      });
      
      console.log(`✅ ${tableName}: Existe (${rowCount} registros)`);
      
    } catch (error) {
      console.error('❌ Erro ao verificar tabela:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a tabela",
        variant: "destructive"
      });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie clientes e suas configurações pré-definidas
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Cliente</DialogTitle>
              <DialogDescription>
                Configure um novo cliente com Google Calendar e WhatsApp pré-configurados
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Clínica</Label>
                    <Input
                      id="nome"
                      value={newCliente.nome}
                      onChange={(e) => {
                        setNewCliente({...newCliente, nome: e.target.value});
                      }}
                      placeholder="Ex: Clínica ABC"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={newCliente.telefone}
                      onChange={(e) => setNewCliente({...newCliente, telefone: e.target.value})}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username do Admin</Label>
                    <Input
                      id="username"
                      type="text"
                      value={newCliente.username}
                      onChange={(e) => setNewCliente({...newCliente, username: e.target.value})}
                      placeholder="admin-clinica"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Nome de usuário único para login
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email_login">Email de Login</Label>
                    <Input
                      id="email_login"
                      type="email"
                      value={newCliente.email_login}
                      onChange={(e) => setNewCliente({...newCliente, email_login: e.target.value})}
                      placeholder="login@clinica.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={newCliente.senha}
                      onChange={(e) => setNewCliente({...newCliente, senha: e.target.value})}
                      placeholder="Senha segura"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="google_calendar_email">Email Google Calendar</Label>
                  <Input
                    id="google_calendar_email"
                    type="email"
                    value={newCliente.google_calendar_email}
                    onChange={(e) => setNewCliente({...newCliente, google_calendar_email: e.target.value})}
                    placeholder="calendario@clinica.com"
                    required
                  />
                </div>
              </div>

              {/* Configurações Google Cloud Console */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Configurações Google Cloud Console</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Configure as credenciais do Google Cloud Console para este cliente
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_client_id">Client ID do Google *</Label>
                    <Input
                      id="google_client_id"
                      type="text"
                      value={newCliente.google_client_id}
                      onChange={(e) => setNewCliente({...newCliente, google_client_id: e.target.value})}
                      placeholder="123456789-abcdef.apps.googleusercontent.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtido no Google Cloud Console &gt; Credentials &gt; OAuth 2.0 Client IDs
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="google_client_secret">Client Secret do Google *</Label>
                    <Input
                      id="google_client_secret"
                      type="password"
                      value={newCliente.google_client_secret}
                      onChange={(e) => setNewCliente({...newCliente, google_client_secret: e.target.value})}
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Client Secret obtido no Google Cloud Console
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_redirect_uri">Redirect URI</Label>
                    <Input
                      id="google_redirect_uri"
                      type="text"
                      value={newCliente.google_redirect_uri}
                      onChange={(e) => setNewCliente({...newCliente, google_redirect_uri: e.target.value})}
                      placeholder="http://localhost:8080/auth/google/callback"
                    />
                    <p className="text-xs text-muted-foreground">
                      URI de redirecionamento configurada no Google Cloud Console
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="google_calendar_id">ID do Calendário (Opcional)</Label>
                    <Input
                      id="google_calendar_id"
                      type="text"
                      value={newCliente.google_calendar_id}
                      onChange={(e) => setNewCliente({...newCliente, google_calendar_id: e.target.value})}
                      placeholder="calendario@clinica.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      ID específico do calendário (deixe vazio para usar o calendário principal)
                    </p>
                  </div>
                </div>
              </div>

              {/* Configurações Evolution API */}
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Configurações Evolution API (WhatsApp)</h3>
                </div>
                <p className="text-sm text-green-700">
                  Configure as credenciais da Evolution API para integração com WhatsApp
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="evo_base_url">Base URL da Evolution API</Label>
                    <Input
                      id="evo_base_url"
                      type="text"
                      value={newCliente.evo_base_url}
                      onChange={(e) => setNewCliente({...newCliente, evo_base_url: e.target.value})}
                      placeholder="https://evo.seuservidor.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL base da sua instância da Evolution API
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="evo_instance">Nome da Instância</Label>
                      <Input
                        id="evo_instance"
                        type="text"
                        value={newCliente.evo_instance}
                        onChange={(e) => setNewCliente({...newCliente, evo_instance: e.target.value})}
                        placeholder="cliente_joao"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nome da instância criada na Evolution API
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="evo_api_key">API Key</Label>
                      <Input
                        id="evo_api_key"
                        type="password"
                        value={newCliente.evo_api_key}
                        onChange={(e) => setNewCliente({...newCliente, evo_api_key: e.target.value})}
                        placeholder="sk_live_xxxxx"
                      />
                      <p className="text-xs text-muted-foreground">
                        API Key gerada pela Evolution API
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Configurações Adicionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Configurações Adicionais</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <TableSelector
                      value={newCliente.tabela_supabase}
                      onValueChange={(value) => setNewCliente({...newCliente, tabela_supabase: value})}
                      label="Tabela Supabase"
                      placeholder="Selecione uma tabela existente"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="qr_code">QR Code WhatsApp (Opcional)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="qr_code"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewCliente({...newCliente, qr_code_file: file});
                          }
                        }}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                      />
                      {newCliente.qr_code_file && (
                        <div className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {newCliente.qr_code_file.name}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Faça upload do QR Code do WhatsApp para conectar automaticamente
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={createCliente}>
                Criar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Clientes */}
      <div className="grid gap-6">
        {clientes.map((cliente) => (
          <Card key={cliente.id} className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {cliente.nome}
                  </CardTitle>
                  <CardDescription>
                    Login: {cliente.email} • {cliente.telefone}
                  </CardDescription>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Google Calendar: {getClienteConfig(cliente.id, 'google_calendar_email') || 'Não configurado'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tabela: {(() => {
                        const tableName = getClienteConfig(cliente.id, 'tabela_supabase');
                        return tableName && tableName !== 'none' ? tableName : 'Nenhuma selecionada';
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={cliente.ativo ? "default" : "secondary"}>
                    {cliente.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <Badge variant="outline">
                    {cliente.tipo === 'clinica' ? 'Clínica' : 'Profissional'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {/* Gerenciador de Credenciais Google */}
                <GoogleCredentialsManager
                  clienteId={cliente.id}
                  clienteNome={cliente.nome}
                  onCredentialsUpdated={loadData}
                />
                
                {/* Gerenciador de QR Codes */}
                <QRCodeManager
                  clienteId={cliente.id}
                  clienteNome={cliente.nome}
                  onQRCodeUpdated={loadData}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status das Integrações */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">Integrações</h4>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Google Calendar</span>
                    {getClienteConfig(cliente.id, 'google_calendar_enabled') === 'true' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">WhatsApp</span>
                    {getClienteConfig(cliente.id, 'whatsapp_enabled') === 'true' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  
                  {/* QR Code Preview */}
                  {getClienteConfig(cliente.id, 'whatsapp_qr_code_url') && (
                    <div className="mt-3">
                      <h5 className="text-xs font-medium text-muted-foreground mb-2">QR Code WhatsApp</h5>
                      <div className="w-16 h-16 border rounded-lg overflow-hidden">
                        <img 
                          src={getClienteConfig(cliente.id, 'whatsapp_qr_code_url')} 
                          alt="QR Code WhatsApp"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Usuários */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">Usuários</h4>
                  {getClienteUsuarios(cliente.id).map((usuario) => (
                    <div key={usuario.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">{usuario.nome}</span>
                      <Badge variant="outline" className="text-xs">
                        {usuario.role}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">Ações</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => verifyClienteTables(cliente.id)}
                    >
                      <Database className="w-4 h-4 mr-1" />
                      Verificar Tabelas
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      Config
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeCliente(cliente.id, cliente.nome)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clientes.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro cliente para começar a usar o sistema.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Cliente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
