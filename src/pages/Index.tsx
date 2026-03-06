import { Layout } from "@/components/Layout";
import { 
  Users, 
  Calendar, 
  TrendingUp,
  MessageCircle,
  RefreshCw,
  UserX
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { MetricCard } from "@/components/MetricCard";
import { CalendarPreview } from "@/components/CalendarPreview";
import { AppointmentsBarChart } from "@/components/AppointmentsBarChart";
import { NextAppointmentCard } from "@/components/NextAppointmentCard";
import { ConversionGaugeCard } from "@/components/ConversionGaugeCard";
import { RecentConversationsCard } from "@/components/RecentConversationsCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { useGoogleCalendar } from "@/contexts/GoogleCalendarContextSimple";
import { toast } from "@/components/ui/use-toast";
import { convertToBrazilDateString, getTodayBrazilString, filterByToday, filterByCurrentMonth } from "@/lib/date-utils";

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
  const { events: calendarEvents, isConnected: isCalendarConnected } = useGoogleCalendar();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async (isAutoRefresh = false) => {
    try {
      if (!supabaseRead) {
        setRows([]);
        setLoading(false);
        return;
      }

      if (isAutoRefresh) {
        setIsRefreshing(true);
      }

      let tableName = "kommuchat_mvp";
      
      if (user) {
        const { data: configData, error: configError } = await supabaseConfig
          .from('configuracoes_cliente')
          .select('valor')
          .eq('cliente_id', user.cliente_id)
          .eq('chave', 'tabela_supabase')
          .single();
        
        if (!configError && configData?.valor && configData.valor.trim() !== '') {
          tableName = configData.valor;
        }
      }

      const { data, error } = await supabaseRead
        .from(tableName)
        .select("*");
        
      if (error) throw error;
      
      setRows(data ?? []);
      setLastRefresh(new Date());
    } catch (e: any) {
      console.error('Erro ao carregar dados:', e);
      setRows([]);
      if (!isAutoRefresh) {
        toast({ description: "Não foi possível carregar dados do Supabase." });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [supabaseRead, supabaseConfig, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
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

  const { calendarEventsThisMonth, calendarEventsLastMonth } = useMemo(() => {
    if (!isCalendarConnected || calendarEvents.length === 0) return { calendarEventsThisMonth: 0, calendarEventsLastMonth: 0 };
    const now = new Date();
    const nowBrasil = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const currentMonth = nowBrasil.getMonth();
    const currentYear = nowBrasil.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const countForMonth = (month: number, year: number) =>
      calendarEvents.filter((event) => {
        // Não contabilizar eventos recorrentes (instâncias ou mestre da série)
        if (event.recurringEventId || (event.recurrence?.length ?? 0) > 0) return false;
        const eventStart = event.start?.dateTime || event.start?.date;
        if (!eventStart) return false;
        try {
          const d = new Date(eventStart);
          const db = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
          return db.getMonth() === month && db.getFullYear() === year;
        } catch {
          return false;
        }
      }).length;

    return {
      calendarEventsThisMonth: countForMonth(currentMonth, currentYear),
      calendarEventsLastMonth: countForMonth(prevMonth, prevYear),
    };
  }, [calendarEvents, isCalendarConnected]);

  const { metrics, conversionRate } = useMemo(() => {
    const list = sorted;

    const now = new Date();
    const nowBrasil = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const curMonth = nowBrasil.getMonth();
    const curYear = nowBrasil.getFullYear();
    const dayOfMonth = nowBrasil.getDate();
    const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
    const prevYear = curMonth === 0 ? curYear - 1 : curYear;

    const isInMonth = (dateStr: string | null | undefined, m: number, y: number) => {
      if (!dateStr) return false;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        const db = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        return db.getMonth() === m && db.getFullYear() === y;
      } catch { return false; }
    };

    // Mesmo período: do dia 1 até o dia atual do mês (para comparação justa entre meses)
    const isInMonthUpToDay = (dateStr: string | null | undefined, m: number, y: number, upToDay: number) => {
      if (!dateStr) return false;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        const db = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        if (db.getMonth() !== m || db.getFullYear() !== y) return false;
        return db.getDate() <= upToDay;
      } catch { return false; }
    };

    const calcTrend = (current: number, previous: number) =>
      previous > 0 ? Math.round(((current - previous) / previous) * 100) : (current > 0 ? 100 : 0);

    // Pacientes (com setdata)
    const listWithSetdata = list.filter(r => r.setdata !== null && r.setdata !== undefined && r.setdata !== '');
    const totalPacientes = listWithSetdata.length;
    const pacientesThisMonth = listWithSetdata.filter(r => isInMonth(r.setdata || r.created_at, curMonth, curYear)).length;
    const pacientesLastMonth = listWithSetdata.filter(r => isInMonth(r.setdata || r.created_at, prevMonth, prevYear)).length;

    // Consultas Marcadas (com data_agendamento)
    const consultasAgendadas = list.filter(r => {
      const da = r.data_agendamento;
      if (da === null || da === undefined) return false;
      return String(da).trim() !== '';
    }).length;
    // Trend proporcional: compara do dia 1 ao dia atual deste mês vs mesmo período no mês anterior
    const consultasThisMonth = list.filter(r => isInMonthUpToDay(r.data_agendamento, curMonth, curYear, dayOfMonth)).length;
    const consultasLastMonth = list.filter(r => isInMonthUpToDay(r.data_agendamento, prevMonth, prevYear, dayOfMonth)).length;

    const conversao = totalPacientes ? Math.round((consultasAgendadas / totalPacientes) * 100) : 0;

    // Follow Up
    const isFollowUp = (r: Row) => {
      const followup = r.followup?.toString().trim().toLowerCase();
      const follow = r.follow?.toString().trim();
      return followup === "false" || follow === "Follow Up  2";
    };
    const followUpCount = list.filter(isFollowUp).length;
    const followUpThisMonth = list.filter(r => isFollowUp(r) && isInMonth(r.created_at || r.updated_at, curMonth, curYear)).length;
    const followUpLastMonth = list.filter(r => isFollowUp(r) && isInMonth(r.created_at || r.updated_at, prevMonth, prevYear)).length;

    // Consultas no mês (calendar events)
    const calendarTrend = calcTrend(calendarEventsThisMonth, calendarEventsLastMonth);

    return {
      metrics: [
        { title: "Contatos", value: String(totalPacientes), trend: calcTrend(pacientesThisMonth, pacientesLastMonth), icon: Users },
        { title: "Pacientes ativos", value: String(consultasAgendadas), trend: calcTrend(consultasThisMonth, consultasLastMonth), icon: Calendar },
        { title: "Consultas no mês", value: String(calendarEventsThisMonth), trend: calendarTrend, icon: MessageCircle },
        // { title: "Follow Up", value: String(followUpCount), trend: calcTrend(followUpThisMonth, followUpLastMonth), icon: UserX },
      ],
      conversionRate: conversao,
    };
  }, [sorted, calendarEventsThisMonth, calendarEventsLastMonth]);

  return (
    <Layout
      lastRefresh={lastRefresh}
      isRefreshing={isRefreshing}
      onRefresh={() => loadData(false)}
    >
      <div className="space-y-5">
        {/* Row 1: Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              trend={metric.trend}
              changeType={metric.trend >= 0 ? "positive" : "negative"}
              icon={metric.icon}
            />
          ))}
        </div>

        {/* Row 2: Agenda de hoje | Conversão + Próxima Consulta | Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:row-span-2 min-h-0">
            <CalendarPreview />
          </div>
          <ConversionGaugeCard percentage={conversionRate} />
          <NextAppointmentCard />
          <div className="lg:col-span-2">
            <AppointmentsBarChart rows={rows} />
          </div>
        </div>

        {/* Row 3: Conversas Recentes - full width */}
        <RecentConversationsCard />
      </div>
    </Layout>
  );
};

export default Index;
