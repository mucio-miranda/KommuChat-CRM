  import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Users
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Interface para os dados do Supabase - igual à página de pacientes
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
  data_agendamento?: string;
  created_at?: string;
  updated_at?: string;
  fonte: 'ia' | 'humano'; // Fonte dos dados: IA ou Humano
}

export function PatientsPreview() {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const { user } = useAuth();
  const { read: supabase, config: supabaseConfig, write: supabaseWrite } = useSupabase();
  const navigate = useNavigate();

  // Função para determinar o status baseado nos campos do Supabase
  const getPatientStatus = (patient: Patient): "followup" | "topoucall" | "atendimentofinal" | "cancelou_agendamento" | "novo" => {
    // Verificar se tem data_agendamento com ano 9999 (cancelou agendamento)
    if (patient.data_agendamento) {
      try {
        const dataAgendamento = new Date(patient.data_agendamento);
        const ano = dataAgendamento.getFullYear();
        if (ano === 9999) {
          return "cancelou_agendamento";
        }
      } catch (error) {
        console.error('Erro ao processar data_agendamento:', error);
      }
    }
    
    if (patient.atendimentofinal === "true") return "atendimentofinal";
    if (patient.topoucall === "true") return "topoucall";
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

  // Função para carregar dados dos pacientes - copiada exatamente da página de pacientes
  const loadData = useCallback(async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }
      
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Determinar qual tabela usar
      let tableName = "kommuchat_mvp"; // Tabela padrão para visitantes
      
      console.log('🔍 PACIENTES PREVIEW - user:', user?.email);
      
      // Se o usuário está logado, buscar a tabela selecionada nas configurações
      if (user) {
        console.log('🔍 PACIENTES PREVIEW - Usuário logado, buscando tabela...');
        
        const { data: configData, error: configError } = await supabaseConfig
          .from('configuracoes_cliente')
          .select('valor')
          .eq('cliente_id', user.cliente_id)
          .eq('chave', 'tabela_supabase')
          .single();
        
        console.log('🔍 PACIENTES PREVIEW - Config result:', { configData, configError });
        
        if (!configError && configData?.valor && configData.valor.trim() !== '') {
          tableName = configData.valor;
          console.log('✅ PACIENTES PREVIEW - Tabela alterada para:', tableName);
        } else {
          console.log('⚠️ PACIENTES PREVIEW - Mantendo tabela padrão:', tableName);
        }
      } else {
        console.log('ℹ️ PACIENTES PREVIEW - Usuário não logado, usando padrão:', tableName);
      }

      console.log('🎯 PACIENTES PREVIEW - Carregando dados da tabela:', tableName);

      // 1. Carregar pacientes da IA
      const { data: iaData, error: iaError } = await supabase
        .from(tableName)
        .select('*');

      let iaPatients = [];
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
        
        console.log('✅ PACIENTES PREVIEW - Dados IA carregados:', iaPatients.length, 'registros');
      }

      // 2. Carregar pacientes manuais (se usuário logado)
      let manualPatients = [];
      if (user && supabaseWrite) {
        console.log('🎯 PACIENTES PREVIEW - Carregando pacientes manuais...');
        
        const { data: manualData, error: manualError } = await supabaseWrite
          .from('pacientes_manuais')
          .select('*')
          .eq('cliente_id', user.cliente_id);

        if (manualError) {
          console.error('Erro ao buscar pacientes manuais:', manualError);
        } else if (manualData) {
          // Adicionar fonte humano aos dados
          manualPatients = manualData.map(patient => ({
            ...patient,
            fonte: 'humano' as const,
            status: patient.status || 'novo'
          }));
          
          console.log('✅ PACIENTES PREVIEW - Dados manuais carregados:', manualPatients.length, 'registros');
        }
      }

      // 3. Unificar dados
      const allPatients = [...iaPatients, ...manualPatients];
      
      // 4. APLICAR FILTRO DE SETDATA PRIMEIRO (antes de limitar)
      // Filtrar pacientes da IA que não têm setdata preenchida
      // Mas incluir pacientes manuais independente do setdata
      const patientsWithSetdata = allPatients.filter(patient => {
        const hasSetdata = patient.setdata !== null && patient.setdata !== undefined && patient.setdata !== '';
        const isManualPatient = patient.fonte === 'humano';
        return isManualPatient || hasSetdata;
      });
      
      // 5. Ordenar por data de atualização (mais recente primeiro)
      const sortedPatients = patientsWithSetdata.sort((a, b) => {
        const dateA = a.updated_at || a.created_at || '';
        const dateB = b.updated_at || b.created_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      console.log('✅ PACIENTES PREVIEW - Total de pacientes após filtro:', sortedPatients.length);
      setPatients(sortedPatients.slice(0, 10)); // Limitar a 10 DEPOIS do filtro de setdata
      
      if (isAutoRefresh) {
        console.log('✅ PACIENTES PREVIEW - Refresh automático concluído');
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, supabaseConfig, supabaseWrite, user]);

  // Carregamento inicial
  useEffect(() => {
    console.log('🚀 PATIENTS PREVIEW - Iniciando carregamento...');
    loadData();
  }, [loadData]);

  // Refresh automático desabilitado temporariamente para debug
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     console.log('🔄 PATIENTS PREVIEW - Iniciando refresh automático...');
  //     loadData(true);
  //   }, 30000); // 30 segundos

  //   return () => clearInterval(interval);
  // }, [loadData]);

  // Filtrar pacientes quando o termo de busca muda
  useEffect(() => {
    console.log('🔍 PATIENTS PREVIEW - Filtrando pacientes:', { 
      totalPatients: patients.length, 
      searchTerm,
      patients: patients.slice(0, 2) // Mostrar apenas os primeiros 2 para debug
    });
    
    // O filtro de setdata já foi aplicado no loadData, aqui só aplicamos a busca
    const filtered = patients.filter(patient => {
      const matchesSearch = patient.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.telefone?.includes(searchTerm);
      
      return matchesSearch;
    });
    
    console.log('✅ PATIENTS PREVIEW - Pacientes filtrados:', filtered.length);
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const handleViewAll = () => {
    navigate('/pacientes');
  };

  // Debug: Log do estado atual
  console.log('🔍 PATIENTS PREVIEW - Render state:', { 
    loading, 
    patientsCount: patients.length, 
    filteredCount: filteredPatients.length,
    searchTerm 
  });

  if (loading) {
    return (
      <Card className="p-6 bg-white rounded-xl shadow-soft">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
              <Users className="w-5 h-5 text-[#E21929]" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Pacientes</h2>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            Carregando pacientes...
          </div>
        </div>
      </Card>
    );
  }

  return (
     <Card className="p-6 bg-white rounded-xl shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
            <Users className="w-5 h-5 text-[#E21929]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Pacientes</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={handleViewAll}
          >
            Ver mais
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquise um paciente"
          className="pl-10 bg-gray-50 border-0 rounded-xl h-11"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patients List */}
      <div className="space-y-3">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-smooth cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1 truncate">
                    {patient.nome || "Nome não informado"}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {patient.email || "Email não informado"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {formatPhone(patient.telefone)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 ml-3">
                  <StatusBadge status={getPatientStatus(patient)} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {searchTerm ? `Nenhum paciente encontrado para "${searchTerm}"` : "Nenhum paciente encontrado"}
          </div>
        )}
      </div>
    </Card>
  );
}
