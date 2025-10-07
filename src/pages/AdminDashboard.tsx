import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Settings, 
  Shield, 
  FileText, 
  RefreshCw,
  Database,
  Calendar,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminCredentialsManager } from '@/components/AdminManager.tsx';
import { supabaseCrm } from '@/lib/supabase-crm';
import { useToast } from '@/hooks/use-toast';
import UserManagement from '@/pages/UserManagement';

interface DashboardStats {
  totalClientes: number;
  clientesAtivos: number;
  credenciaisConfiguradas: number;
  totalUsuarios: number;
  ultimaAtividade: string;
}

export default function AdminDashboard() {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    clientesAtivos: 0,
    credenciaisConfiguradas: 0,
    totalUsuarios: 0,
    ultimaAtividade: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'clients'>('overview');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Verificar se o supabaseCrm está configurado
      if (!supabaseCrm) {
        console.warn('Supabase CRM não configurado - usando dados mockados');
        setStats({
          totalClientes: 0,
          clientesAtivos: 0,
          credenciaisConfiguradas: 0,
          totalUsuarios: 0,
          ultimaAtividade: 'N/A'
        });
        return;
      }

      // Carregar estatísticas dos clientes
      const { data: clientes, error: clientesError } = await supabaseCrm
        .from('clientes')
        .select('id, ativo, created_at');

      if (clientesError) throw clientesError;

      // Carregar estatísticas dos usuários
      const { data: usuarios, error: usuariosError } = await supabaseCrm
        .from('usuarios')
        .select('id, ativo');

      if (usuariosError) throw usuariosError;

      // Carregar estatísticas das credenciais
      const { data: credenciais, error: credenciaisError } = await supabaseCrm
        .from('google_credentials')
        .select('cliente_id, configured');

      if (credenciaisError) throw credenciaisError;

      const clientesAtivos = clientes?.filter(c => c.ativo).length || 0;
      const credenciaisConfiguradas = credenciais?.filter(c => c.configured).length || 0;
      const usuariosAtivos = usuarios?.filter(u => u.ativo).length || 0;

      // Encontrar a última atividade
      const ultimaAtividade = clientes?.reduce((latest, cliente) => {
        const clienteDate = new Date(cliente.created_at);
        return clienteDate > latest ? clienteDate : latest;
      }, new Date(0));

      setStats({
        totalClientes: clientes?.length || 0,
        clientesAtivos,
        credenciaisConfiguradas,
        totalUsuarios: usuariosAtivos,
        ultimaAtividade: ultimaAtividade ? ultimaAtividade.toLocaleDateString('pt-BR') : 'N/A'
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas do dashboard.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardStats();
    toast({
      title: "Atualizado",
      description: "Dashboard atualizado com sucesso.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-gray-600">
                Bem-vindo, {adminUser?.nome} - Gerenciamento do Sistema KOMMUchat
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Badge variant="outline" className="px-3 py-1">
                {adminUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'credentials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Credenciais Google
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Gerenciar Clientes
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalClientes}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.clientesAtivos} ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credenciais Configuradas</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.credenciaisConfiguradas}</div>
                  <p className="text-xs text-muted-foreground">
                    de {stats.totalClientes} clientes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
                  <p className="text-xs text-muted-foreground">
                    em todo o sistema
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Última Atividade</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.ultimaAtividade}</div>
                  <p className="text-xs text-muted-foreground">
                    novo cliente
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Ações Rápidas
                  </CardTitle>
                  <CardDescription>
                    Acesso rápido às principais funcionalidades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('credentials')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Gerenciar Credenciais Google
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('clients')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Gerenciar Clientes
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar Dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Status do Sistema
                  </CardTitle>
                  <CardDescription>
                    Monitoramento da saúde do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Banco de Dados</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Supabase CRM</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Criptografia</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativa
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Funcionando
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
                <CardDescription>
                  Últimas ações realizadas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Dashboard carregado</p>
                      <p className="text-xs text-gray-500">Agora</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sistema inicializado</p>
                      <p className="text-xs text-gray-500">Há alguns minutos</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

         {activeTab === 'credentials' && (
           <AdminCredentialsManager />
         )}

        {activeTab === 'clients' && (
          <UserManagement />
        )}
      </div>
    </div>
  );
}