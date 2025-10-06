import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Plus, 
  RefreshCw
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Layout } from "@/components/Layout";
import { NewPatientModal } from "@/components/NewPatientModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabase } from "@/hooks/useSupabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Interface para os dados do Supabase
interface Patient {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  chatid?: string;
  status: string;
  setdata?: string;
  followup?: string;
  follow?: string;
  topoucall?: string;
  atendimentofinal?: string;
  atende_humano?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  fonte: 'ia' | 'humano'; // Fonte dos dados: IA ou Humano
}

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [fonteFilter, setFonteFilter] = useState("todas");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { read: supabase, config: supabaseConfig, write: supabaseWrite } = useSupabase();

  // Função para determinar o status baseado nos campos do Supabase
  const getPatientStatus = (patient: Patient): "followup" | "atende_humano" | "topoucall" | "atendimentofinal" | "novo" => {
    if (patient.atendimentofinal === "true") return "atendimentofinal";
    if (patient.topoucall === "true") return "topoucall";
    if (patient.atende_humano === "true") return "atende_humano";
    if (patient.followup === "true") return "followup";
    if (patient.follow === "true") return "followup";
    return "novo";
  };

  // Função para formatar o telefone
  const formatPhone = (phone: string): string => {
    if (!phone) return "N/A";
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11) {
      return `(${cleanPhone.slice(0,2)}) ${cleanPhone.slice(2,7)}-${cleanPhone.slice(7)}`;
    } else if (cleanPhone.length === 10) {
      return `(${cleanPhone.slice(0,2)}) ${cleanPhone.slice(2,6)}-${cleanPhone.slice(6)}`;
    }
    return phone;
  };

  // Função para formatar a data
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return "Data inválida";
    }
  };

  // Função para carregar dados dos pacientes (IA + Manual)
  const loadData = useCallback(async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      if (!supabase || !supabaseWrite) {
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      console.log('🔍 PACIENTES - user:', user?.email);

      // 1. Carregar pacientes da IA (tabela dinâmica)
      let iaPatients: Patient[] = [];
      let tableName = "kommuchat_mvp"; // Tabela padrão para visitantes
      
      // Se o usuário está logado, buscar a tabela selecionada nas configurações
      if (user) {
        console.log('🔍 PACIENTES - Usuário logado, buscando tabela IA...');
        
        const { data: configData, error: configError } = await supabaseConfig
          .from('configuracoes_cliente')
          .select('valor')
          .eq('cliente_id', user.cliente_id)
          .eq('chave', 'tabela_supabase')
          .single();
        
        if (!configError && configData?.valor && configData.valor.trim() !== '') {
          tableName = configData.valor;
          console.log('✅ PACIENTES - Tabela IA alterada para:', tableName);
        }
      }

      console.log('🎯 PACIENTES - Carregando dados da tabela IA:', tableName);

      const { data: iaData, error: iaError } = await supabase
        .from(tableName)
        .select('*');

      if (iaError) {
        console.error('Erro ao buscar pacientes IA:', iaError);
      } else if (iaData) {
        // Adicionar fonte IA aos dados
        iaPatients = iaData.map(patient => ({
          ...patient,
          fonte: 'ia' as const,
          status: getPatientStatus({ ...patient, fonte: 'ia' })
        }));
        
        // Remover duplicatas baseado no chatid
        iaPatients = iaPatients.filter((patient, index, self) => 
          index === self.findIndex(p => p.chatid === patient.chatid)
        );
        
        console.log('✅ PACIENTES - Dados IA carregados:', iaPatients.length, 'registros');
      }

      // 2. Carregar pacientes manuais (se usuário logado)
      let manualPatients: Patient[] = [];
      if (user) {
        console.log('🎯 PACIENTES - Carregando pacientes manuais...');
        
        const { data: manualData, error: manualError } = await supabaseWrite
          .from('pacientes_manuais')
          .select('*')
          .eq('cliente_id', user.id);

        if (manualError) {
          console.error('Erro ao buscar pacientes manuais:', manualError);
        } else if (manualData) {
          // Adicionar fonte humano aos dados
          manualPatients = manualData.map(patient => ({
            ...patient,
            fonte: 'humano' as const,
            status: patient.status || 'novo'
          }));
          
          console.log('✅ PACIENTES - Dados manuais carregados:', manualPatients.length, 'registros');
        }
      }

      // 3. Unificar e ordenar dados
      const allPatients = [...iaPatients, ...manualPatients];
      
      // Ordenar por data de atualização (mais recente primeiro)
      const sortedPatients = allPatients.sort((a, b) => {
        const dateA = a.updated_at || a.created_at || '';
        const dateB = b.updated_at || b.created_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setPatients(sortedPatients);
      setLastUpdate(new Date());
      
      console.log('✅ PACIENTES - Total unificado:', sortedPatients.length, 'pacientes');
      
      if (isAutoRefresh) {
        console.log('✅ PACIENTES - Refresh automático concluído');
      }

    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      if (!isAutoRefresh) {
        toast({
          title: "Erro",
          description: "Erro inesperado ao carregar pacientes",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase, supabaseWrite, supabaseConfig, user, toast]);

  // Carregamento inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh automático a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 PACIENTES - Iniciando refresh automático...');
      loadData(true);
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [loadData]);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.telefone?.includes(searchTerm);
    
    const patientStatus = getPatientStatus(patient);
    const matchesStatus = statusFilter === "todos" || patientStatus === statusFilter;
    
    const matchesFonte = fonteFilter === "todas" || patient.fonte === fonteFilter;
    
    return matchesSearch && matchesStatus && matchesFonte;
  });

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
              <p className="text-muted-foreground mt-1">
                Carregando pacientes...
              </p>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              Carregando dados dos pacientes...
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
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os seus pacientes
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Button onClick={() => setIsNewPatientModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Buscar por nome, email ou telefone..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
                <SelectItem value="atende_humano">Atendimento Humano</SelectItem>
                <SelectItem value="topoucall">Agendado</SelectItem>
                <SelectItem value="atendimentofinal">Concluído</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fonteFilter} onValueChange={setFonteFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as fontes</SelectItem>
                <SelectItem value="ia">Adicionado por IA</SelectItem>
                <SelectItem value="humano">Adicionado por Humano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} encontrado{filteredPatients.length !== 1 ? 's' : ''}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Total: {patients.length}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Paciente</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Contato</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Fonte</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Última Atualização</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className="border-b border-border/50 hover:bg-muted/30 transition-smooth"
                  >
                    <td className="py-4 px-2">
                      <div>
                        <div className="font-medium text-foreground">{patient.nome || "Nome não informado"}</div>
                        <div className="text-sm text-muted-foreground">{patient.email || "Email não informado"}</div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-muted-foreground font-mono text-sm">
                        {formatPhone(patient.telefone)}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <StatusBadge status={getPatientStatus(patient)} />
                    </td>
                    <td className="py-4 px-2">
                      <Badge 
                        variant={patient.fonte === 'ia' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {patient.fonte === 'ia' ? 'IA' : 'Humano'}
                      </Badge>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-sm">
                        <div className="text-foreground font-medium">
                          {formatDate(patient.setdata || patient.updated_at || patient.created_at)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                Nenhum paciente encontrado com os filtros aplicados.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Modal para Novo Paciente */}
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onPatientAdded={() => loadData(false)}
      />
    </Layout>
  );
}