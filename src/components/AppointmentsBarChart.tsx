import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
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

interface AppointmentsBarChartProps {
  rows?: any[] | null; // Mantido para compatibilidade, mas não será usado
}

const weekDaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AppointmentsBarChart({ rows }: AppointmentsBarChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, selectedCalendars } = useGoogleCalendar();

  // Função para buscar eventos do Google Calendar com período específico
  const fetchCalendarEvents = async (period: "week" | "month" | "year") => {
    if (!isConnected) {
      console.log('❌ Google Calendar não conectado');
      setCalendarEvents([]);
      return;
    }

    setIsLoading(true);
    try {
      // Verificar e renovar token se necessário
      const tokenValid = await googleCalendarServiceHybrid.ensureValidToken();
      if (!tokenValid) {
        console.error('❌ Token inválido');
        setCalendarEvents([]);
        setIsLoading(false);
        return;
      }

      // Obter token de acesso
      const tokensData = localStorage.getItem('google_calendar_tokens');
      if (!tokensData) {
        throw new Error('Token de acesso não encontrado');
      }

      const tokens = JSON.parse(tokensData);
      const accessToken = tokens.access_token;

      if (!accessToken) {
        throw new Error('Token de acesso inválido');
      }

      // Calcular período de busca baseado no período selecionado
      const now = new Date();
      const nowBrasil = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      
      let timeMin: Date;
      let timeMax: Date;

      if (period === "week") {
        // Semana: início da semana atual até o fim
        const inicioSemana = new Date(nowBrasil);
        inicioSemana.setDate(nowBrasil.getDate() - nowBrasil.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        timeMin = inicioSemana;

        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999);
        timeMax = fimSemana;
      } else if (period === "month") {
        // Mês: 4 meses para trás + atual + 1 futuro = 6 meses
        const inicio = new Date(nowBrasil.getFullYear(), nowBrasil.getMonth() - 4, 1);
        inicio.setHours(0, 0, 0, 0);
        timeMin = inicio;

        const fim = new Date(nowBrasil.getFullYear(), nowBrasil.getMonth() + 2, 0);
        fim.setHours(23, 59, 59, 999);
        timeMax = fim;
      } else {
        // Ano: últimos 4 anos
        const inicio = new Date(nowBrasil.getFullYear() - 3, 0, 1);
        inicio.setHours(0, 0, 0, 0);
        timeMin = inicio;

        const fim = new Date(nowBrasil.getFullYear(), 11, 31);
        fim.setHours(23, 59, 59, 999);
        timeMax = fim;
      }

      // Buscar lista de calendários
      const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!calendarsResponse.ok) {
        throw new Error(`Erro ao buscar calendários: ${calendarsResponse.status}`);
      }

      const calendarsData = await calendarsResponse.json();
      const calendars = calendarsData.items || [];

      // Filtrar apenas calendários selecionados (ou todos se nenhum selecionado)
      const calendarsToFetch = selectedCalendars.length > 0
        ? calendars.filter((cal: any) => selectedCalendars.includes(cal.id))
        : calendars;

      // Buscar eventos de cada calendário
      const allEvents: any[] = [];
      const promises = calendarsToFetch.map(async (calendar: any) => {
        try {
          const params = new URLSearchParams({
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            maxResults: '2500', // Aumentar para garantir que pegamos todos os eventos
            singleEvents: 'true',
            orderBy: 'startTime',
          });

          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params}`;
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            return data.items || [];
          } else {
            console.warn(`⚠️ Erro ao buscar eventos da agenda ${calendar.summary}: ${response.status}`);
            return [];
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar eventos da agenda ${calendar.summary}:`, error);
          return [];
        }
      });

      const results = await Promise.all(promises);
      results.forEach(events => {
        allEvents.push(...events);
      });

      console.log(`✅ ${allEvents.length} eventos encontrados do Google Calendar`);
      setCalendarEvents(allEvents);
    } catch (error) {
      console.error('❌ Erro ao buscar eventos do Google Calendar:', error);
      setCalendarEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar eventos quando o período ou conexão mudar
  useEffect(() => {
    if (isConnected) {
      fetchCalendarEvents(selectedPeriod as "week" | "month" | "year");
    } else {
      setCalendarEvents([]);
    }
  }, [selectedPeriod, isConnected, selectedCalendars]);

  // Processar dados dos eventos do Google Calendar
  const chartData = useMemo(() => {
    // Se não estiver conectado, retornar dados vazios
    if (!isConnected || calendarEvents.length === 0) {
      // Retornar dados vazios se não houver rows
      if (selectedPeriod === "week") {
        return weekDaysShort.map(day => ({ day, count: 0 }));
      } else if (selectedPeriod === "month") {
        const { monthLabels } = getLast6Months();
        return monthLabels.map(month => ({ day: month, count: 0 }));
      } else {
        return getYearLabels().map(year => ({ day: year, count: 0 }));
      }
    }

    if (selectedPeriod === "week") {
      // Lógica para semana
      const hoje = new Date();
      const hojeBrasil = new Date(hoje.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      
      const inicioSemana = new Date(hojeBrasil);
      inicioSemana.setDate(hojeBrasil.getDate() - hojeBrasil.getDay());
      inicioSemana.setHours(0, 0, 0, 0);

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);

      const counts = new Array(7).fill(0);

      calendarEvents.forEach(event => {
        const eventStart = event.start?.dateTime || event.start?.date;
        if (!eventStart) return;

        try {
          const dataEvento = new Date(eventStart);
          const dataEventoBrasil = new Date(dataEvento.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
          
          if (dataEventoBrasil >= inicioSemana && dataEventoBrasil <= fimSemana) {
            const dayOfWeek = dataEventoBrasil.getDay();
            counts[dayOfWeek]++;
          }
        } catch (error) {
          console.error('Erro ao processar data do evento:', error);
        }
      });

      return weekDaysShort.map((day, index) => ({
        day,
        count: counts[index]
      }));
    } else if (selectedPeriod === "month") {
      // Lógica para mês - mostrar apenas 6 meses
      const { monthLabels, monthMapping } = getLast6Months();
      const counts = new Array(6).fill(0);

      calendarEvents.forEach(event => {
        const eventStart = event.start?.dateTime || event.start?.date;
        if (!eventStart) return;

        try {
          const dataEvento = new Date(eventStart);
          const dataEventoBrasil = new Date(dataEvento.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
          
          const year = dataEventoBrasil.getFullYear();
          const month = dataEventoBrasil.getMonth();
          const monthKey = `${year}-${month}`;
          
          const monthIndex = monthMapping[monthKey];
          if (monthIndex !== undefined) {
            counts[monthIndex]++;
          }
        } catch (error) {
          console.error('Erro ao processar data do evento:', error);
        }
      });

      return monthLabels.map((month, index) => ({
        day: month,
        count: counts[index]
      }));
    } else {
      // Lógica para ano (últimos 4 anos)
      const yearLabels = getYearLabels();
      const counts = new Array(4).fill(0);
      const currentYear = new Date().getFullYear();

      calendarEvents.forEach(event => {
        const eventStart = event.start?.dateTime || event.start?.date;
        if (!eventStart) return;

        try {
          const dataEvento = new Date(eventStart);
          const dataEventoBrasil = new Date(dataEvento.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
          
          const year = dataEventoBrasil.getFullYear();
          
          const yearIndex = year - (currentYear - 3);
          if (yearIndex >= 0 && yearIndex < 4) {
            counts[yearIndex]++;
          }
        } catch (error) {
          console.error('Erro ao processar data do evento:', error);
        }
      });

      return yearLabels.map((year, index) => ({
        day: year,
        count: counts[index]
      }));
    }
  }, [calendarEvents, selectedPeriod, isConnected]);

  // Função para obter os últimos 6 meses (4 passados + atual + 1 futuro)
  function getLast6Months() {
    const now = new Date();
    const nowBrasil = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthLabels: string[] = [];
    const monthMapping: { [key: string]: number } = {};
    
    // Gerar 6 meses: 4 passados + atual + 1 futuro
    for (let i = -4; i <= 1; i++) {
      const date = new Date(nowBrasil.getFullYear(), nowBrasil.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${month}`;
      
      // Criar label no formato "Jan 24"
      const monthName = monthNames[month];
      const yearShort = year.toString().slice(-2);
      const label = `${monthName} ${yearShort}`;
      
      monthLabels.push(label);
      monthMapping[monthKey] = monthLabels.length - 1;
    }
    
    return { monthLabels, monthMapping };
  }

  // Função para obter labels dos anos (últimos 4 anos)
  function getYearLabels() {
    const currentYear = new Date().getFullYear();
    return [
      (currentYear - 3).toString(),
      (currentYear - 2).toString(),
      (currentYear - 1).toString(),
      currentYear.toString()
    ];
  }

  // Calcular total do período
  const totalPeriod = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.count, 0);
  }, [chartData]);

  // Filtrar e ordenar eventos pelos mais próximos da data atual
  const recentEvents = useMemo(() => {
    if (!isConnected || calendarEvents.length === 0) return [];
    
    const now = new Date();
    
    return calendarEvents
      .filter(event => {
        const eventStart = event.start?.dateTime || event.start?.date;
        if (!eventStart) return false;
        
        try {
          const dataEvento = new Date(eventStart);
          return !isNaN(dataEvento.getTime());
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.start?.dateTime || a.start?.date || 0);
        const dateB = new Date(b.start?.dateTime || b.start?.date || 0);
        
        const nowTime = now.getTime();
        const timeA = dateA.getTime();
        const timeB = dateB.getTime();
        
        const isAFuture = timeA >= nowTime;
        const isBFuture = timeB >= nowTime;
        
        // Priorizar eventos futuros sobre passados
        if (isAFuture && !isBFuture) return -1; // A é futuro, B é passado -> A vem primeiro
        if (!isAFuture && isBFuture) return 1;  // A é passado, B é futuro -> B vem primeiro
        
        // Se ambos são futuros ou ambos são passados, ordenar por proximidade
        if (isAFuture && isBFuture) {
          // Ambos futuros: ordenar do mais próximo ao mais distante (crescente)
          return timeA - timeB;
        } else {
          // Ambos passados: ordenar do mais recente ao mais antigo (decrescente)
          return timeB - timeA;
        }
      })
      .slice(0, 10); // Limitar a 10 eventos mais próximos
  }, [calendarEvents, isConnected]);

  // Função para formatar a data do evento
  const formatEventDate = (event: any): string => {
    try {
      const eventStart = event.start?.dateTime || event.start?.date;
      if (!eventStart) return "Data inválida";
      
      const date = new Date(eventStart);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Data inválida";
    }
  };

  // Encontrar o valor máximo para normalizar as barras
  const maxCount = Math.max(...chartData.map(d => d.count), 1); // Mínimo 1 para evitar divisão por zero
  
  // Calcular altura das barras de forma proporcional
  const calculateBarHeight = (count: number) => {
    if (count === 0) return 0;
    
    // Altura máxima da área do gráfico (considerando padding)
    const maxHeight = 200; // 200px é a altura máxima da área do gráfico
    
    // Calcular altura proporcional: (valor / valor_máximo) * altura_máxima
    const proportionalHeight = (count / maxCount) * maxHeight;
    
    // Garantir altura mínima para valores pequenos mas visíveis
    const minVisibleHeight = 8; // 8px mínimo para ser visível
    const finalHeight = Math.max(proportionalHeight, count > 0 ? minVisibleHeight : 0);
    
    return finalHeight;
  };

  return (
    <Card className="p-6 bg-white rounded-xl shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
            <BarChart3 className="w-5 h-5 text-[#E21929]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Consultas</h2>
            <p className="text-xs text-muted-foreground">
              {!isConnected ? "Conecte-se ao Google Calendar" :
               selectedPeriod === "week" ? "Por dia da semana" : 
               selectedPeriod === "month" ? "Por mês" : "Por ano"}
            </p>
          </div>
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mês</SelectItem>
            <SelectItem value="year">Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Carregando eventos do Google Calendar...
        </div>
      )}

      {/* Not connected state */}
      {!isConnected && !isLoading && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Conecte-se ao Google Calendar para ver os agendamentos
        </div>
      )}

      {/* Vertical Bar Chart */}
      {isConnected && !isLoading && (
        <>
      <div className="relative h-64 mb-4 bg-gray-50 rounded-lg p-2">
        <div className="flex items-end justify-between h-full gap-2 px-2">
          {chartData.map((item, index) => {
            const heightPercentage = calculateBarHeight(item.count);
            const isHovered = hoveredBar === index;
            
            
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center justify-end gap-3 relative group"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
                    <div className="font-semibold">{item.count} agendamentos</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                )}
                
                {/* Bar */}
                <div
                  className={`w-full rounded-t-xl transition-all duration-300 ${
                    isHovered 
                      ? 'bg-[#E21929] shadow-lg' 
                      : 'bg-[#E21929]/70'
                  }`}
                  style={{ 
                    height: `${heightPercentage}px`,
                    minHeight: item.count > 0 ? '8px' : '0px'
                  }}
                  title={`${item.count} agendamentos`}
                >
                  {/* Gradient overlay */}
                  <div className="w-full h-full rounded-t-xl bg-gradient-to-t from-transparent to-white/10"></div>
                </div>
                
                {/* Day Label */}
                <span className="text-xs font-medium text-muted-foreground">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-muted-foreground">
            {selectedPeriod === "week" ? "Total da semana" : 
             selectedPeriod === "month" ? "Total dos últimos 6 meses" : "Total dos últimos 4 anos"}
          </span>
          <span className="font-bold text-foreground">
            {totalPeriod} {totalPeriod === 1 ? 'agendamento' : 'agendamentos'}
          </span>
        </div>

        {/* Lista dos últimos eventos */}
        {recentEvents.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Últimos agendamentos
            </h4>
            <div className="space-y-2">
              {recentEvents.map((event, index) => (
                <div
                  key={event.id || index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {event.summary || 'Sem título'}
                    </div>
                    {event.description && (
                      <div className="text-muted-foreground truncate">
                        {event.description}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-2">
                    <div className="font-medium text-foreground">
                      {formatEventDate(event)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </Card>
  );
}

