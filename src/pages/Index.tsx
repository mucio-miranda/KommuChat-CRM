import { Layout } from "@/components/Layout";
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  TrendingUp,
  MessageCircle,
  UserCheck,
  RefreshCw
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { MetricCard } from "@/components/MetricCard";
import { CalendarPreview } from "@/components/CalendarPreview";
import { AppointmentsBarChart } from "@/components/AppointmentsBarChart";
import { PatientsPreview } from "@/components/PatientsPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { convertToBrazilDateString, getTodayBrazilString, filterByToday } from "@/lib/date-utils";

// Tipagem mínima da tabela
type Row = {
  id: string;
  nome?: string | null;
  telefone?: string | null;
  chatid?: string | null;
  atende_humano?: string | null;
  email?: string | null;
  setdata?: string | null;
  followup?: string | null;
  follow?: string | null;
  topoucall?: string | null;
  atendimentofinal?: string | null;
  data_agendamento?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
};

const Index = () => {
  const { user } = useAuth();
  const { read: supabaseRead, write: supabaseWrite, config: supabaseConfig } = useSupabase();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Função para carregar dados
  const loadData = useCallback(async (isAutoRefresh = false) => {
    try {
      if (!supabaseRead) {
        console.log('❌ Supabase não disponível');
        setRows([]);
        setLoading(false);
        return;
      }

      if (isAutoRefresh) {
        setIsRefreshing(true);
      }

      let tableName = "kommuchat_mvp";
      console.log('🔍 DASHBOARD - user:', user?.email);
      
      if (user) {
        console.log('🔍 DASHBOARD - Usuário logado, buscando tabela...');
        
        const { data: configData, error: configError } = await supabaseConfig
          .from('configuracoes_cliente')
          .select('valor')
          .eq('cliente_id', user.cliente_id)
          .eq('chave', 'tabela_supabase')
          .single();
        
        if (!configError && configData?.valor && configData.valor.trim() !== '') {
          tableName = configData.valor;
          console.log('✅ DASHBOARD - Tabela alterada para:', tableName);
        }
      }

      const { data, error } = await supabaseRead
        .from(tableName)
        .select("*")
        .limit(200);
        
      if (error) {
        console.error('❌ DASHBOARD - Erro ao carregar dados:', error);
        throw error;
      }
      
      setRows(data ?? []);
      setLastRefresh(new Date());
      
      if (isAutoRefresh) {
        console.log('✅ DASHBOARD - Refresh automático concluído');
      }
    } catch (e: any) {
      console.error('❌ Erro geral:', e);
      setRows([]);
      if (!isAutoRefresh) {
        toast({ description: "Não foi possível carregar dados do Supabase." });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [supabaseRead, supabaseConfig, user]);

  // Carregamento inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh automático a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 DASHBOARD - Iniciando refresh automático...');
      loadData(true);
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [loadData]);

  const sorted = useMemo(() => {
    const list = (rows ?? []).slice();
    list.sort((a, b) => {
      const ad = new Date(a.updated_at || a.created_at || 0).getTime();
      const bd = new Date(b.updated_at || b.created_at || 0).getTime();
      return bd - ad;
    });
    return list;
  }, [rows]);

  const metrics = useMemo(() => {
    const list = sorted;
    // Filtrar pacientes com setdata vazia (null) para o total de atendimentos
    const listWithSetdata = list.filter(r => {
      return r.setdata !== null && r.setdata !== undefined && r.setdata !== '';
    });
    const total = listWithSetdata.length;
    
    // Buscar consultas do dia atual na coluna data_agendamento
    // Usar fuso horário do Brasil (UTC-3)
    const hojeString = getTodayBrazilString();
    
    console.log('🔍 CONSULTAS HOJE - Data atual Brasil:', hojeString);
    
    const consultasHoje = filterByToday(list, 'data_agendamento').length;
    
    console.log('✅ CONSULTAS HOJE - Resultado:', consultasHoje);
    
    // Buscar atendimentos do dia atual na coluna setdata
    const atendimentosHoje = filterByToday(list, 'setdata').length;
    
    console.log('✅ ATENDIMENTOS HOJE - Resultado:', atendimentosHoje);
    
    // Contar registros com data_agendamento preenchida
    const consultasAgendadas = list.filter(r => {
      if (!r.data_agendamento) return false;
      // Verificar se é uma data válida
      const data = new Date(r.data_agendamento);
      return !isNaN(data.getTime()) && r.data_agendamento.trim() !== '';
    }).length;
    
    // Calcular taxa de conversão: Consultas Agendadas / Atendimentos Realizados (com setdata válida)
    const conversao = total ? Math.round((consultasAgendadas / total) * 100) : 0;

    // Contar atendimentos por humano (onde atende_humano === 'true')
    const atendimentosHumano = list.filter(r => {
      return r.atende_humano === 'true';
    }).length;

    return [
      { title: "Atendimentos Realizados", value: String(total), change: "", changeType: "positive" as const, icon: Users },
      { title: "Consultas Hoje", value: String(consultasHoje), change: "", changeType: "positive" as const, icon: Calendar },
      { title: "Atendimentos Hoje", value: String(atendimentosHoje), change: "", changeType: "positive" as const, icon: MessageCircle },
      { title: "Consultas Agendadas", value: String(consultasAgendadas), change: "", changeType: "positive" as const, icon: CheckCircle },
      { title: "Taxa de Conversão", value: `${conversao}%`, change: "", changeType: "positive" as const, icon: TrendingUp },
      { title: "Atendimento por Humano", value: String(atendimentosHumano), change: "", changeType: "positive" as const, icon: UserCheck },
    ];
  }, [sorted]);

  return (
    <Layout>
      <div className="space-y-8 ml-2">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral do seu CRM clínico
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
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
          </div>
        </div>

        {/* Grid de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              changeType={metric.changeType}
              icon={metric.icon}
            />
          ))}
        </div>

        {/* Preview do Calendário, Gráficos e Pacientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CalendarPreview />
          <AppointmentsBarChart rows={rows} />
          <PatientsPreview />
        </div>
      </div>
    </Layout>
  );
};

export default Index;