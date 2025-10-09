import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Plus, 
  RefreshCw,
  ChevronUp,
  ChevronDown
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
  
  // Estados para ordenação
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
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

  // Função para ordenar pacientes
  const sortPatients = (patients: Patient[]): Patient[] => {
    if (!sortField) return patients;

    return [...patients].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nome':
          aValue = a.nome?.toLowerCase() || '';
          bValue = b.nome?.toLowerCase() || '';
          break;
        case 'contato':
          // Ordenar por email ou telefone (alfanumérica)
          aValue = (a.email || a.telefone || '').toLowerCase();
          bValue = (b.email || b.telefone || '').toLowerCase();
          break;
        case 'fonte':
          // Ordenar por fonte (IA/Humano)
          aValue = a.fonte;
          bValue = b.fonte;
          break;
        case 'data':
          // Ordenar por data de atualização
          aValue = new Date(a.setdata || a.updated_at || a.created_at || '').getTime();
          bValue = new Date(b.setdata || b.updated_at || b.created_at || '').getTime();
          break;
        case 'status':
          // Ordenar por status
          const statusA = getPatientStatus(a);
          const statusB = getPatientStatus(b);
          // Definir ordem dos status
          const statusOrder = ['novo', 'followup', 'atende_humano', 'topoucall', 'atendimentofinal'];
          aValue = statusOrder.indexOf(statusA);
          bValue = statusOrder.indexOf(statusB);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Função para lidar com clique na coluna
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Se clicou na mesma coluna, alternar direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se clicou em coluna diferente, definir nova coluna e direção padrão
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  const filteredPatients = sortPatients(patients.filter(patient => {
    // Filtrar pacientes com setdata vazia (null)
    const hasSetdata = patient.setdata !== null && patient.setdata !== undefined && patient.setdata !== '';
    
    const matchesSearch = patient.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.telefone?.includes(searchTerm);
    
    const patientStatus = getPatientStatus(patient);
    const matchesStatus = statusFilter === "todos" || patientStatus === statusFilter;
    
    const matchesFonte = fonteFilter === "todas" || patient.fonte === fonteFilter;
    
    return hasSetdata && matchesSearch && matchesStatus && matchesFonte;
  }));

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
      <div className="space-y-3 md:space-y-5 px-1 sm:px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Gerencie todos os seus pacientes
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 h-8 px-2 sm:px-3"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-xs sm:text-sm">{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </Button>
          <Button onClick={() => setIsNewPatientModalOpen(true)} size="sm" className="h-8 px-2 sm:px-3">
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1 text-xs sm:text-sm">Novo Paciente</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-soft border-0 sm:border">
        <CardContent className="p-2.5 sm:p-4 md:p-6">
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
              <Input 
                placeholder="Buscar paciente..." 
                className="pl-8 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border-muted-foreground/20 focus-visible:ring-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 md:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border-muted-foreground/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos" className="text-xs sm:text-sm">Todos</SelectItem>
                  <SelectItem value="novo" className="text-xs sm:text-sm">Novo</SelectItem>
                  <SelectItem value="followup" className="text-xs sm:text-sm">Follow-up</SelectItem>
                  <SelectItem value="atende_humano" className="text-xs sm:text-sm">Atend. Humano</SelectItem>
                  <SelectItem value="topoucall" className="text-xs sm:text-sm">Agendado</SelectItem>
                  <SelectItem value="atendimentofinal" className="text-xs sm:text-sm">Concluído</SelectItem>
                </SelectContent>
              </Select>

              <Select value={fonteFilter} onValueChange={setFonteFilter}>
                <SelectTrigger className="w-full sm:w-48 h-8 sm:h-9 md:h-10 text-xs sm:text-sm border-muted-foreground/20">
                  <SelectValue placeholder="Fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas" className="text-xs sm:text-sm">Todas</SelectItem>
                  <SelectItem value="ia" className="text-xs sm:text-sm">IA</SelectItem>
                  <SelectItem value="humano" className="text-xs sm:text-sm">Humano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="p-2.5 sm:p-4 md:p-6 pb-2 sm:pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm sm:text-base md:text-lg font-semibold">
              {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
            </CardTitle>
            
            <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-6">
              Total: {patients.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 md:p-6">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    <button
                      onClick={() => handleSort('nome')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Paciente
                      {sortField === 'nome' ? (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      ) : (
                        <div className="flex flex-col">
                          <ChevronUp className="w-3 h-3 opacity-30" />
                          <ChevronDown className="w-3 h-3 opacity-30 -mt-1" />
                        </div>
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    <button
                      onClick={() => handleSort('contato')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Contato
                      {sortField === 'contato' ? (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      ) : (
                        <div className="flex flex-col">
                          <ChevronUp className="w-3 h-3 opacity-30" />
                          <ChevronDown className="w-3 h-3 opacity-30 -mt-1" />
                        </div>
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Status
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      ) : (
                        <div className="flex flex-col">
                          <ChevronUp className="w-3 h-3 opacity-30" />
                          <ChevronDown className="w-3 h-3 opacity-30 -mt-1" />
                        </div>
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    <button
                      onClick={() => handleSort('fonte')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Fonte
                      {sortField === 'fonte' ? (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      ) : (
                        <div className="flex flex-col">
                          <ChevronUp className="w-3 h-3 opacity-30" />
                          <ChevronDown className="w-3 h-3 opacity-30 -mt-1" />
                        </div>
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    <button
                      onClick={() => handleSort('data')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Última Atualização
                      {sortField === 'data' ? (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      ) : (
                        <div className="flex flex-col">
                          <ChevronUp className="w-3 h-3 opacity-30" />
                          <ChevronDown className="w-3 h-3 opacity-30 -mt-1" />
                        </div>
                      )}
                    </button>
                  </th>
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

          {/* Mobile Card View */}
          <div className="md:hidden">
            {filteredPatients.map((patient) => (
              <div 
                key={patient.id} 
                className="border-b border-border/50 last:border-0 p-2.5 sm:p-3 hover:bg-muted/20 transition-colors active:bg-muted/40"
              >
                <div className="space-y-1.5 sm:space-y-2">
                  {/* Nome e Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-foreground truncate leading-tight">
                        {patient.nome || "Nome não informado"}
                      </div>
                    </div>
                    <Badge 
                      variant={patient.fonte === 'ia' ? 'default' : 'secondary'}
                      className="text-[9px] sm:text-[10px] flex-shrink-0 h-4 sm:h-5 px-1.5 sm:px-2"
                    >
                      {patient.fonte === 'ia' ? 'IA' : 'Humano'}
                    </Badge>
                  </div>

                  {/* Email e Telefone */}
                  <div className="space-y-0.5">
                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {patient.email || "Email não informado"}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-mono">
                      {formatPhone(patient.telefone)}
                    </div>
                  </div>

                  {/* Status e Data */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <StatusBadge status={getPatientStatus(patient)} />
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDate(patient.setdata || patient.updated_at || patient.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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