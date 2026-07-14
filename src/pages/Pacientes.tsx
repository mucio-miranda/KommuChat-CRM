import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Pencil,
  Check,
  X,
  User
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProfilePicture } from "@/hooks/useProfilePicture";
import { StatusBadge } from "@/components/StatusBadge";
import { Layout } from "@/components/Layout";
import { NewPatientModal } from "@/components/NewPatientModal";
import { EditPatientModal } from "@/components/EditPatientModal";
import { EditDatePopover } from "@/components/EditDatePopover";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
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
  setdata?: string;
  followup?: string;
  follow?: string;
  topoucall?: string;
  atendimentofinal?: string;
  atende_humano?: string;
  data_agendamento?: string;
  fonte: 'ia' | 'humano';
}

const getInitials = (name: string): string => {
  if (!name) return '';
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const PatientAvatar: React.FC<{ patient: Patient; clienteId: string | undefined; size?: string }> = ({ patient, clienteId, size = "w-9 h-9" }) => {
  const phone = patient.chatid?.includes('@') ? patient.chatid.split('@')[0] : patient.telefone;
  const profilePicture = useProfilePicture(phone, clienteId);
  const initials = getInitials(patient.nome || '');

  return (
    <Avatar className={`${size} flex-shrink-0`}>
      {profilePicture && (
        <AvatarImage src={profilePicture} alt="Foto" className="object-cover" />
      )}
      <AvatarFallback className="text-xs bg-muted">
        {initials || <User className="w-4 h-4" />}
      </AvatarFallback>
    </Avatar>
  );
};

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [updatingPatientId, setUpdatingPatientId] = useState<number | null>(null);
  // Estado para armazenar o nome da tabela IA atual
  const [iaTableName, setIaTableName] = useState<string>("kommuchat_mvp");
  
  // Estados para ordenação
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const PATIENTS_PER_PAGE = 20;

  // Estados para exclusão
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Estados para edição
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estados para edição de nome
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { read: supabase, config: supabaseConfig, write: supabaseWrite } = useSupabase();

  const checkTrue = (val: any) => String(val) === "true" || val === true;

  // Função para determinar o status baseado nos campos do Supabase
  const getPatientStatus = (patient: Patient): "followup" | "topoucall" | "atendimentofinal" | "cancelou_agendamento" | "novo" => {
    if (patient.data_agendamento) {
      try {
        const dataAgendamento = new Date(patient.data_agendamento);
        const ano = dataAgendamento.getFullYear();
        if (ano === 9999) return "cancelou_agendamento";
        return "topoucall";
      } catch (error) {
        console.error('Erro ao processar data_agendamento:', error);
      }
    }

    if (checkTrue(patient.atendimentofinal)) return "atendimentofinal";
    if (checkTrue(patient.followup)) return "followup";
    if (checkTrue(patient.follow)) return "followup";
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
      const date = new Date(dateString);
      if (date.getFullYear() === 9999) {
        return "N/A";
      }
      return date.toLocaleDateString('pt-BR');
    } catch {
      return "Data inválida";
    }
  };

  // Função para carregar dados dos pacientes (IA + Manual)
  const loadData = useCallback(async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }

      if (!supabase || !supabaseWrite) {
        setLoading(false);
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
      
      setIaTableName(tableName);

      console.log('🎯 PACIENTES - Carregando dados da tabela IA:', tableName);

      const { data: iaData, error: iaError } = await supabase
        .from(tableName)
        .select('id, nome, telefone, chatid, atende_humano, email, setdata, followup, follow, topoucall, atendimentofinal, data_agendamento');

      if (iaError) {
        console.error('Erro ao buscar pacientes IA:', iaError);
      } else if (iaData) {
        // fonte derivado do chatid: n8n usa formato WhatsApp com '@' (ex: 5511999@s.whatsapp.net)
        // pacientes manuais têm chatid = telefone simples (sem '@')
        iaPatients = iaData.map(patient => ({
          ...patient,
          fonte: patient.chatid?.includes('@') ? 'ia' as const : 'humano' as const,
          status: getPatientStatus({ ...patient, fonte: 'ia' })
        }));

        // Remover duplicatas de chatid apenas para pacientes IA
        const seen = new Set<string>();
        iaPatients = iaPatients.filter(patient => {
          if (!patient.chatid?.includes('@')) return true;
          if (seen.has(patient.chatid)) return false;
          seen.add(patient.chatid);
          return true;
        });

        console.log('✅ PACIENTES - Dados carregados:', iaPatients.length, 'registros');
      }

      // 3. Ordenar dados
      const allPatients = [...iaPatients];
      
      // Ordenar por data de atualização (mais recente primeiro)
      const sortedPatients = allPatients.sort((a, b) => {
        const dateA = a.setdata || '';
        const dateB = b.setdata || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setPatients(sortedPatients);
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
    }
  }, [supabase, supabaseWrite, supabaseConfig, user, toast]);

  // Função para atualizar a data de agendamento
  const handleUpdateDate = async (patient: Patient, newDate: Date | null) => {
    if (!user) return;

    setUpdatingPatientId(patient.id);
    const dateStr = newDate ? newDate.toISOString() : null;
    // Se tem data (nova ou alterada), topoucall = "true". Se removeu a data, topoucall = "false".
    const topoucallValue = newDate ? "true" : "false";
    
    try {
      let error = null;
      
      const { error: updateError } = await supabase!
        .from(iaTableName)
        .update({
          data_agendamento: dateStr,
          topoucall: !!newDate,
        })
        .eq('id', patient.id);

      error = updateError;

      if (error) {
        console.error('Erro ao atualizar data:', error);
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar a data. Verifique suas permissões.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Data atualizada",
          description: newDate ? "Agendamento salvo com sucesso!" : "Agendamento removido.",
        });
        // Atualizar estado local para refletir mudança imediata
        setPatients(prev => prev.map(p => 
          p.id === patient.id ? { 
            ...p, 
            data_agendamento: dateStr || undefined,
            topoucall: topoucallValue 
          } : p
        ));
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao tentar atualizar.",
        variant: "destructive",
      });
    } finally {
      setUpdatingPatientId(null);
    }
  };

  const handleToggleAtendimentoFinal = async (patient: Patient) => {
    if (!user) return;

    const currentVal = checkTrue(patient.atendimentofinal);
    // Se currentVal é true (campo true), o toggle está OFF. Queremos ligar -> campo false.
    // Se currentVal é false (campo false), o toggle está ON. Queremos desligar -> campo true.
    // Resumo: newFieldVal = !currentVal
    const newFieldVal = !currentVal;
    
    // Optimistic update
    setPatients(prev => prev.map(p => 
      p.id === patient.id ? { ...p, atendimentofinal: String(newFieldVal) } : p
    ));

    try {
      let error = null;
      
      const { error: updateError } = await supabase!
        .from(iaTableName)
        .update({ atendimentofinal: newFieldVal })
        .eq('id', patient.id);

      error = updateError;

      if (error) {
        throw error;
      }

      toast({
        title: "Status atualizado",
        description: `Atendimento ${newFieldVal ? 'desativado' : 'ativado'} com sucesso.`,
      });

    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      // Revert optimistic update
      setPatients(prev => prev.map(p => 
        p.id === patient.id ? { ...p, atendimentofinal: String(currentVal) } : p
      ));
      
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  // Função para iniciar edição do nome
  const handleStartEditName = (patient: Patient) => {
    setEditingPatientId(patient.id);
    setEditingName(patient.nome || "");
  };

  // Função para cancelar edição do nome
  const handleCancelEditName = () => {
    setEditingPatientId(null);
    setEditingName("");
  };

  // Função para salvar o nome editado
  const handleSaveName = async (patient: Patient) => {
    if (!user || !editingName.trim()) {
      handleCancelEditName();
      return;
    }

    try {
      const { error } = await supabase!
        .from(iaTableName)
        .update({ nome: editingName.trim() })
        .eq('id', patient.id);

      if (error) {
        console.error('Erro ao atualizar nome:', error);
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar o nome. Verifique suas permissões.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Nome atualizado",
        description: "Nome do paciente atualizado com sucesso!",
      });
      setPatients(prev => prev.map(p =>
        p.id === patient.id ? { ...p, nome: editingName.trim() } : p
      ));
      handleCancelEditName();
    } catch (err) {
      console.error('Erro inesperado:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao tentar atualizar.",
        variant: "destructive",
      });
    }
  };

  // Função para abrir modal de edição
  const handleEditPatient = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsEditModalOpen(true);
  };

  // Função para abrir diálogo de confirmação de exclusão
  const handleDeletePatient = (patient: Patient) => {
    if (patient.fonte !== 'humano') {
      toast({
        title: "Erro",
        description: "Apenas pacientes criados manualmente podem ser excluídos",
        variant: "destructive",
      });
      return;
    }

    setPatientToDelete(patient);
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar exclusão
  const confirmDeletePatient = async () => {
    if (!patientToDelete || !supabase || !user) {
      return;
    }

    try {
      const { error } = await supabase
        .from(iaTableName)
        .delete()
        .eq('id', patientToDelete.id);

      if (error) {
        console.error('Erro ao excluir paciente:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o paciente",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Paciente excluído com sucesso!",
      });

      // Recarregar dados
      loadData();

    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir paciente",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

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
        case 'agendamento':
          // Ordenar por data de agendamento
          const getDateValue = (dateStr?: string) => {
            if (!dateStr) return 0;
            const date = new Date(dateStr);
            return date.getFullYear() === 9999 ? 0 : date.getTime();
          };
          aValue = getDateValue(a.data_agendamento);
          bValue = getDateValue(b.data_agendamento);
          break;
        case 'data':
          // Ordenar por data de atualização
          aValue = new Date(a.setdata || 0).getTime();
          bValue = new Date(b.setdata || 0).getTime();
          break;
        case 'status':
          // Ordenar por status
          const statusA = getPatientStatus(a);
          const statusB = getPatientStatus(b);
          // Definir ordem dos status
          const statusOrder = ['novo', 'followup', 'topoucall', 'atendimentofinal', 'cancelou_agendamento'];
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
      // Para campos de data, padrão é descendente (mais recente primeiro)
      if (field === 'data' || field === 'agendamento') {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredPatients = sortPatients(patients.filter(patient => {
    const hasSetdata = patient.setdata !== null && patient.setdata !== undefined && patient.setdata !== '';
    const isManualPatient = patient.fonte === 'humano';
    const passesSetdataFilter = isManualPatient || hasSetdata;

    const matchesSearch = patient.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.telefone?.includes(searchTerm);

    const patientStatus = getPatientStatus(patient);
    const matchesStatus = statusFilter === "todos" || patientStatus === statusFilter;

    return passesSetdataFilter && matchesSearch && matchesStatus;
  }));

  const totalPages = Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * PATIENTS_PER_PAGE,
    currentPage * PATIENTS_PER_PAGE
  );

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
                  <SelectItem value="followup" className="text-xs sm:text-sm">Em contato</SelectItem>
                  <SelectItem value="topoucall" className="text-xs sm:text-sm">Agendado</SelectItem>
                  <SelectItem value="atendimentofinal" className="text-xs sm:text-sm">Desativado</SelectItem>
                  <SelectItem value="cancelou_agendamento" className="text-xs sm:text-sm">Cancelado</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Novo Paciente */}
      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => setIsNewPatientModalOpen(true)} size="sm" className="h-8 px-2 sm:px-3 bg-[#303030] border border-[#2D2D2D] text-white shadow-none hover:bg-[#303030]/90 hover:text-white">
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="ml-1 text-xs sm:text-sm">Novo Paciente</span>
        </Button>
      </div>

      {/* Results */}
      <Card className="shadow-soft border-0 sm:border">
        <CardHeader className="p-2.5 sm:p-4 md:p-6 pb-2 sm:pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm sm:text-base md:text-lg font-semibold">
              {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
            </CardTitle>

            <div className="flex items-center gap-2">
              {totalPages > 1 && (
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  Pág. {currentPage}/{totalPages}
                </span>
              )}
              <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-6">
                Total: {patients.length}
              </Badge>
            </div>
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
                      onClick={() => handleSort('agendamento')}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Data do Agendamento
                      {sortField === 'agendamento' ? (
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
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Atendimento IA
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className="border-b border-border/50 hover:bg-muted/30 transition-smooth"
                  >
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <PatientAvatar patient={patient} clienteId={user?.cliente_id} />
                        <div>
                        <div className="flex items-center gap-2 group">
                          {editingPatientId === patient.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveName(patient);
                                  if (e.key === 'Escape') handleCancelEditName();
                                }}
                                className="h-7 text-sm"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveName(patient)}
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Salvar"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditName}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                title="Cancelar"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium text-foreground">{patient.nome || "Nome não informado"}</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartEditName(patient)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                title="Editar nome"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{patient.email || "Email não informado"}</div>
                        </div>
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
                      <div className="text-sm">
                        <div className="text-foreground font-medium">
                          <EditDatePopover 
                            initialDate={patient.data_agendamento}
                            onSave={(date) => handleUpdateDate(patient, date)}
                            isLoading={updatingPatientId === patient.id}
                            patientId={patient.id}
                            patientName={patient.nome}
                            patientFonte={patient.fonte}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-sm">
                        <div className="text-foreground font-medium">
                          {formatDate(patient.setdata)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!checkTrue(patient.atendimentofinal)}
                          onCheckedChange={() => handleToggleAtendimentoFinal(patient)}
                          title={checkTrue(patient.atendimentofinal) ? "Reativar atendimento" : "Finalizar atendimento"}
                        />
                        {patient.fonte === 'humano' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPatient(patient)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-muted-foreground hover:bg-muted/50"
                              title="Editar paciente"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePatient(patient)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-muted-foreground hover:bg-muted/50"
                              title="Excluir paciente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {paginatedPatients.map((patient) => (
              <div 
                key={patient.id} 
                className="border-b border-border/50 last:border-0 p-2.5 sm:p-3 hover:bg-muted/20 transition-colors active:bg-muted/40"
              >
                <div className="space-y-1.5 sm:space-y-2">
                  {/* Nome e Badge */}
                  <div className="flex items-start gap-2">
                    <PatientAvatar patient={patient} clienteId={user?.cliente_id} size="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      {editingPatientId === patient.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveName(patient);
                              if (e.key === 'Escape') handleCancelEditName();
                            }}
                            className="h-6 text-xs"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveName(patient)}
                            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                            title="Salvar"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEditName}
                            className="h-6 w-6 p-0 text-muted-foreground"
                            title="Cancelar"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group">
                          <div className="font-semibold text-xs sm:text-sm text-foreground truncate leading-tight">
                            {patient.nome || "Nome não informado"}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEditName(patient)}
                            className="h-5 w-5 p-0 opacity-60 active:opacity-100 text-muted-foreground"
                            title="Editar nome"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      )}
                    </div>
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
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="text-[9px] sm:text-[10px] font-medium whitespace-nowrap">
                         <EditDatePopover 
                            initialDate={patient.data_agendamento}
                            onSave={(date) => handleUpdateDate(patient, date)}
                            isLoading={updatingPatientId === patient.id}
                          />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDate(patient.setdata)}
                        </div>
                        {patient.fonte === 'humano' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPatient(patient)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-muted-foreground hover:bg-muted/50"
                              title="Editar paciente"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePatient(patient)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-muted-foreground hover:bg-muted/50"
                              title="Excluir paciente"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {(currentPage - 1) * PATIENTS_PER_PAGE + 1}–{Math.min(currentPage * PATIENTS_PER_PAGE, filteredPatients.length)} de {filteredPatients.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-xs"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 text-xs"
                >
                  Próxima
                </Button>
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
        iaTableName={iaTableName}
      />

      {/* Modal para Editar Paciente */}
      <EditPatientModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setPatientToEdit(null); }}
        onPatientUpdated={() => loadData(false)}
        iaTableName={iaTableName}
        patient={patientToEdit}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente <strong>{patientToDelete?.nome}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePatient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}