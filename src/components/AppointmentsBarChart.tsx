import { useState, useMemo, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoogleCalendar } from "@/contexts/GoogleCalendarContextSimple";
import { googleCalendarServiceHybrid } from "@/lib/google-calendar-hybrid";
import { isHolidayEvent } from "@/lib/date-utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AppointmentsBarChartProps {
  rows?: any[] | null;
}

const weekDaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const monthNamesChart = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function AppointmentsBarChart({ rows }: AppointmentsBarChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, selectedCalendars } = useGoogleCalendar();

  const fetchCalendarEvents = async (period: "week" | "month" | "year") => {
    if (!isConnected) {
      setCalendarEvents([]);
      return;
    }

    setIsLoading(true);
    try {
      const tokenValid = await googleCalendarServiceHybrid.ensureValidToken();
      if (!tokenValid) {
        setCalendarEvents([]);
        setIsLoading(false);
        return;
      }

      const accessToken = googleCalendarServiceHybrid.getAccessToken();
      if (!accessToken) throw new Error("Token de acesso não encontrado");

      const now = new Date();
      const nowBrasil = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      
      let timeMin: Date;
      let timeMax: Date;

      if (period === "week") {
        const inicioSemana = new Date(nowBrasil);
        inicioSemana.setDate(nowBrasil.getDate() - nowBrasil.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        timeMin = inicioSemana;
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999);
        timeMax = fimSemana;
      } else if (period === "month") {
        const inicio = new Date(nowBrasil.getFullYear(), nowBrasil.getMonth() - 4, 1);
        inicio.setHours(0, 0, 0, 0);
        timeMin = inicio;
        const fim = new Date(nowBrasil.getFullYear(), nowBrasil.getMonth() + 2, 0);
        fim.setHours(23, 59, 59, 999);
        timeMax = fim;
      } else {
        const inicio = new Date(nowBrasil.getFullYear() - 3, 0, 1);
        inicio.setHours(0, 0, 0, 0);
        timeMin = inicio;
        const fim = new Date(nowBrasil.getFullYear(), 11, 31);
        fim.setHours(23, 59, 59, 999);
        timeMax = fim;
      }

      const calendarsResponse = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!calendarsResponse.ok) throw new Error(`Erro ao buscar calendários: ${calendarsResponse.status}`);

      const calendarsData = await calendarsResponse.json();
      const calendars = calendarsData.items || [];
      const calendarsToFetch = selectedCalendars.length > 0
        ? calendars.filter((cal: any) => selectedCalendars.includes(cal.id))
        : calendars;

      const allEvents: any[] = [];
      const promises = calendarsToFetch.map(async (calendar: any) => {
        try {
          const params = new URLSearchParams({
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            maxResults: "2500",
            singleEvents: "true",
            orderBy: "startTime",
          });
          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params}`;
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          });
          if (response.ok) {
            const data = await response.json();
            return data.items || [];
          }
          return [];
        } catch {
          return [];
        }
      });

      const results = await Promise.all(promises);
      results.forEach((events) => allEvents.push(...events));
      setCalendarEvents(allEvents);
    } catch (error) {
      console.error("Erro ao buscar eventos do Google Calendar:", error);
      setCalendarEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchCalendarEvents(selectedPeriod as "week" | "month" | "year");
    } else {
      setCalendarEvents([]);
    }
  }, [selectedPeriod, isConnected, selectedCalendars]);

  function getLast6Months() {
    const now = new Date();
    const nowBrasil = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const monthLabels: string[] = [];
    const monthMapping: { [key: string]: number } = {};
    for (let i = -4; i <= 1; i++) {
      const date = new Date(nowBrasil.getFullYear(), nowBrasil.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${month}`;
      const yearShort = year.toString().slice(-2);
      monthLabels.push(`${monthNamesChart[month]} ${yearShort}`);
      monthMapping[monthKey] = monthLabels.length - 1;
    }
    return { monthLabels, monthMapping };
  }

  function getYearLabels() {
    const currentYear = new Date().getFullYear();
    return [(currentYear - 3).toString(), (currentYear - 2).toString(), (currentYear - 1).toString(), currentYear.toString()];
  }

  const chartData = useMemo(() => {
    if (!isConnected || calendarEvents.length === 0) {
      if (selectedPeriod === "week") return weekDaysShort.map((day) => ({ name: day, consultas: 0 }));
      if (selectedPeriod === "month") return getLast6Months().monthLabels.map((m) => ({ name: m, consultas: 0 }));
      return getYearLabels().map((y) => ({ name: y, consultas: 0 }));
    }

    // Não contabilizar eventos recorrentes (igual aos metric-cards)
    const nonRecurringEvents = calendarEvents.filter(
      (event) => !event.recurringEventId && (event.recurrence?.length ?? 0) === 0 && !isHolidayEvent(event)
    );

    if (selectedPeriod === "week") {
      const hoje = new Date();
      const hojeBrasil = new Date(hoje.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      const inicioSemana = new Date(hojeBrasil);
      inicioSemana.setDate(hojeBrasil.getDate() - hojeBrasil.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);
      const counts = new Array(7).fill(0);
      nonRecurringEvents.forEach((event) => {
        const eventStart = event.start?.dateTime || event.start?.date;
        if (!eventStart) return;
        try {
          const d = new Date(eventStart);
          const db = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
          if (db >= inicioSemana && db <= fimSemana) counts[db.getDay()]++;
        } catch {}
      });
      return weekDaysShort.map((day, i) => ({ name: day, consultas: counts[i] }));
    }

    if (selectedPeriod === "month") {
      const { monthLabels, monthMapping } = getLast6Months();
      const counts = new Array(6).fill(0);
      nonRecurringEvents.forEach((event) => {
        const eventStart = event.start?.dateTime || event.start?.date;
        if (!eventStart) return;
        try {
          const d = new Date(eventStart);
          const db = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
          const key = `${db.getFullYear()}-${db.getMonth()}`;
          if (monthMapping[key] !== undefined) counts[monthMapping[key]]++;
        } catch {}
      });
      return monthLabels.map((m, i) => ({ name: m, consultas: counts[i] }));
    }

    const yearLabels = getYearLabels();
    const counts = new Array(4).fill(0);
    const currentYear = new Date().getFullYear();
    nonRecurringEvents.forEach((event) => {
      const eventStart = event.start?.dateTime || event.start?.date;
      if (!eventStart) return;
      try {
        const d = new Date(eventStart);
        const db = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const yi = db.getFullYear() - (currentYear - 3);
        if (yi >= 0 && yi < 4) counts[yi]++;
      } catch {}
    });
    return yearLabels.map((y, i) => ({ name: y, consultas: counts[i] }));
  }, [calendarEvents, selectedPeriod, isConnected]);

  const totalPeriod = useMemo(() => {
    if (selectedPeriod === "week") {
      return chartData.reduce((sum, item) => sum + item.consultas, 0);
    }

    const now = new Date();
    const nowBrasil = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

    if (selectedPeriod === "month") {
      const yearShort = nowBrasil.getFullYear().toString().slice(-2);
      const currentLabel = `${monthNamesChart[nowBrasil.getMonth()]} ${yearShort}`;
      const entry = chartData.find((d) => d.name === currentLabel);
      return entry ? entry.consultas : 0;
    }

    const currentYearLabel = nowBrasil.getFullYear().toString();
    const entry = chartData.find((d) => d.name === currentYearLabel);
    return entry ? entry.consultas : 0;
  }, [chartData, selectedPeriod]);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--tertiary))] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Total de consultas agendadas</h3>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === "week" ? "Por dia da semana" : selectedPeriod === "month" ? "Por mês" : "Por ano"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">
            {totalPeriod} consultas {selectedPeriod === "week" ? "essa semana" : selectedPeriod === "month" ? "esse mês" : "esse ano"}
          </span>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-28 h-8 text-xs rounded-lg">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Carregando eventos do Google Calendar...
        </div>
      )}

      {!isConnected && !isLoading && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Conecte-se ao Google Calendar para ver os agendamentos
        </div>
      )}

      {isConnected && !isLoading && (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="consultas"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
