import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Calendar, RefreshCw, Grid3X3, CalendarDays } from "lucide-react";
import { useGoogleCalendar } from "@/contexts/GoogleCalendarContextSimple";
import { GoogleCalendarEvent } from "@/lib/google-calendar-hybrid";
import { GoogleCalendarSetup } from "@/components/GoogleCalendarSetup";
import { CalendarAgendasList } from "@/components/CalendarAgendasList";
import { SearchConsultation } from "@/components/SearchConsultation";

// Removidos eventos mock - apenas eventos reais do Google Calendar serão exibidos

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type ViewMode = 'month' | 'week';

export default function Calendario() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const { isConnected, isLoading, events, connect, disconnect, refreshEvents, forceRefreshToken } = useGoogleCalendar();

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Converter eventos do Google Calendar para o formato da aplicação
  const convertGoogleEventsToAppointments = (googleEvents: GoogleCalendarEvent[]) => {
    // Remover eventos duplicados baseado no ID
    const uniqueEvents = googleEvents.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );
    
    return uniqueEvents.map((event, index) => {
      const startDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date || '');
      const time = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      return {
        id: event.id,
        date: startDate.getDate(),
        title: event.summary || 'Evento sem título',
        time,
        patient: event.attendees?.[0]?.displayName || event.attendees?.[0]?.email || 'Sem participante',
        color: getEventColor(event.summary || ''),
        description: event.description,
        location: event.location,
        googleEvent: event
      };
    });
  };

  // Função para determinar a cor do evento baseado no título
  const getEventColor = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('consulta') && lowerTitle.includes('rotina')) {
      return "bg-white text-primary border border-primary/30";
    } else if (lowerTitle.includes('primeira') && lowerTitle.includes('consulta')) {
      return "bg-white text-primary border border-primary/40";
    } else if (lowerTitle.includes('retorno')) {
      return "bg-white text-muted-foreground border border-border";
    } else if (lowerTitle.includes('emergência')) {
      return "bg-white text-destructive border border-destructive/30";
    } else {
      return "bg-white text-primary border border-primary/25";
    }
  };

  // Função para filtrar consultas por texto de busca
  const filterAppointmentsBySearch = (appointments: any[]) => {
    if (!searchQuery.trim()) {
      return appointments;
    }
    const query = searchQuery.toLowerCase();
    return appointments.filter(apt => 
      apt.title?.toLowerCase().includes(query) ||
      apt.patient?.toLowerCase().includes(query) ||
      apt.description?.toLowerCase().includes(query) ||
      apt.location?.toLowerCase().includes(query)
    );
  };

  const getAppointmentsForDay = (day: number) => {
    // Apenas eventos reais do Google Calendar
    const googleAppointments = convertGoogleEventsToAppointments(events);
    const dayAppointments = googleAppointments.filter(apt => {
      // Para eventos do Google Calendar, verificar se a data corresponde ao dia
      if (apt.googleEvent) {
        const eventDate = apt.googleEvent.start.dateTime ? new Date(apt.googleEvent.start.dateTime) : new Date(apt.googleEvent.start.date || '');
        return eventDate.getDate() === day && eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      }
      return false;
    });
    
    // Remover duplicatas baseado no ID do evento
    const uniqueAppointments = dayAppointments.filter((apt, index, self) => 
      index === self.findIndex(a => a.id === apt.id)
    );
    
      // Aplicar filtro de busca
      const filteredAppointments = filterAppointmentsBySearch(uniqueAppointments);
      
      // Ordenar por horário
      return filteredAppointments.sort((a, b) => a.time.localeCompare(b.time));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    if (direction === 'prev') {
      newWeek.setDate(newWeek.getDate() - 7);
    } else {
      newWeek.setDate(newWeek.getDate() + 7);
    }
    setCurrentWeek(newWeek);
  };

  const getWeekDays = (weekStart: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return start;
  };

  const getWeekEnd = (weekStart: Date) => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return end;
  };

  const getWeekRangeText = (weekStart: Date) => {
    const weekEnd = getWeekEnd(weekStart);
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const month = monthNames[weekStart.getMonth()];
    const year = weekStart.getFullYear();
    
    // Se a semana cruza dois meses, mostrar ambos
    if (weekStart.getMonth() !== weekEnd.getMonth()) {
      const endMonth = monthNames[weekEnd.getMonth()];
      return `${startDay} ${month} - ${endDay} ${endMonth} ${year}`;
    }
    
    return `${startDay} - ${endDay} ${month} ${year}`;
  };

  const getAppointmentsForDate = (date: Date) => {
    // Apenas eventos reais do Google Calendar
    const googleAppointments = convertGoogleEventsToAppointments(events);
    return googleAppointments.filter(apt => {
      // Para eventos do Google Calendar, usar a data real do evento
      if (apt.googleEvent) {
        const eventDate = apt.googleEvent.start.dateTime ? new Date(apt.googleEvent.start.dateTime) : new Date(apt.googleEvent.start.date || '');
        return eventDate.toDateString() === date.toDateString();
      }
      return false;
    });
    
    // Aplicar filtro de busca
    return filterAppointmentsBySearch(dateAppointments);
  };

  const handleDateClick = (day: number) => {
    // Criar uma data para o dia clicado
    const clickedDate = new Date(currentYear, currentMonth, day);
    
    // Definir a semana atual para incluir a data clicada
    setCurrentWeek(clickedDate);
    
    // Mudar para visualização semanal
    setViewMode('week');
  };

  const handleMiniCalendarDateSelect = (date: Date) => {
    // Definir a semana atual para incluir a data selecionada
    setCurrentWeek(date);
    
    // Atualizar mês e ano para a data selecionada
    setCurrentMonth(date.getMonth());
    setCurrentYear(date.getFullYear());
    
    // Mudar para visualização semanal
    setViewMode('week');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Primeiro, tentar renovar o token se necessário
      console.log('🔄 Iniciando refresh com renovação de token...');
      const tokenRefreshed = await forceRefreshToken();
      
      if (tokenRefreshed) {
        console.log('✅ Token renovado com sucesso');
      } else {
        console.log('ℹ️ Token não precisou ser renovado ou falhou na renovação');
      }
      
      // Depois, recarregar os eventos
      await refreshEvents();
      setLastUpdate(new Date());
      
      // Feedback visual adicional
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao recarregar calendário:', error);
      setIsRefreshing(false);
    }
  };

  // Atualizar timestamp quando eventos são carregados
  useEffect(() => {
    if (events.length > 0) {
      setLastUpdate(new Date());
    }
  }, [events]);

  // Refresh automático de tokens a cada 5 minutos (antes da expiração de 1 hora)
  useEffect(() => {
    if (!isConnected) {
      return; // Só executar se estiver conectado
    }

    console.log('🔄 CALENDÁRIO - Configurando refresh automático de tokens...');
    
    const interval = setInterval(async () => {
      try {
        console.log('🔄 CALENDÁRIO - Iniciando refresh automático de tokens...');
        const tokenRefreshed = await forceRefreshToken();
        
        if (tokenRefreshed) {
          console.log('✅ CALENDÁRIO - Token renovado automaticamente com sucesso');
          // Atualizar timestamp da última atualização
          setLastUpdate(new Date());
        } else {
          console.log('ℹ️ CALENDÁRIO - Token não precisou ser renovado');
        }
      } catch (error) {
        console.error('❌ CALENDÁRIO - Erro no refresh automático de tokens:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      console.log('🧹 CALENDÁRIO - Limpando interval de refresh automático de tokens');
      clearInterval(interval);
    };
  }, [isConnected, forceRefreshToken]);

  // Obter todas as consultas filtradas para o componente de busca
  const getAllFilteredAppointments = useMemo(() => {
    const allAppointments = convertGoogleEventsToAppointments(events);
    return filterAppointmentsBySearch(allAppointments).sort((a, b) => {
      const dateA = a.googleEvent?.start.dateTime ? new Date(a.googleEvent.start.dateTime) : new Date(a.googleEvent?.start.date || '');
      const dateB = b.googleEvent?.start.dateTime ? new Date(b.googleEvent.start.dateTime) : new Date(b.googleEvent?.start.date || '');
      return dateA.getTime() - dateB.getTime();
    });
  }, [events, searchQuery]);

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const today = new Date();

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-48 border border-border/20"></div>
      );
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const appointments = getAppointmentsForDay(day);
      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

      days.push(
        <div 
          key={day} 
          className={`h-48 border border-border/20 p-2 bg-card relative transition-colors hover:bg-muted/20 cursor-pointer ${isToday ? 'bg-primary/5' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary font-semibold' : 'text-foreground'}`}>
            {day}
          </div>
          <div className="space-y-1 overflow-hidden">
            {appointments.slice(0, 2).map((apt, index) => (
              <div key={`${apt.id}-${index}`} className={`text-xs p-1 rounded ${apt.color} truncate`}>
                <div className="font-medium text-xs">{apt.time}</div>
                <div className="truncate text-xs">{apt.title}</div>
              </div>
            ))}
            {appointments.length > 2 && (
              <div className="text-xs text-muted-foreground font-medium mt-1">
                +{appointments.length - 2} consultas
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderWeeklyView = () => {
    try {
      const weekStart = getWeekStart(currentWeek);
      const weekDates = getWeekDays(weekStart);
      const today = new Date();

      return (
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((day, index) => {
            const appointments = getAppointmentsForDate(day);
            const isToday = day.toDateString() === today.toDateString();
            const isCurrentMonth = day.getMonth() === currentMonth && day.getFullYear() === currentYear;

            return (
              <div key={index} className={`min-h-[600px] border border-border/20 p-3 bg-card relative transition-colors hover:bg-muted/20 ${isToday ? 'bg-primary/5' : ''}`}>
                {/* Header do dia */}
                <div className="mb-3">
                  <div className={`text-sm font-medium ${isToday ? 'text-primary font-semibold' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {weekDays[day.getDay()]}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {day.getDate()}
                  </div>
                </div>

                {/* Appointments */}
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className={`text-sm p-3 rounded-lg ${apt.color} cursor-pointer hover:opacity-80 transition-opacity shadow-sm`}>
                      <div className="font-semibold text-sm mb-1">{apt.time}</div>
                      <div className="font-medium text-sm mb-1">{apt.title}</div>
                      <div className="text-xs opacity-75">{apt.patient}</div>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Nenhum agendamento
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error('Erro na renderização semanal:', error);
      return (
        <div className="p-8 text-center">
          <p className="text-red-500">Erro ao carregar visualização semanal</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
      );
    }
  };

  return (
    <Layout>
      <div className="flex space-x-6">
        {/* Sidebar com lista de agendas */}
        <div className="w-80 flex-shrink-0">
          <CalendarAgendasList 
            isConnected={isConnected} 
            onDateSelect={handleMiniCalendarDateSelect}
          />
          <SearchConsultation 
            className="mt-4"
            onSearch={setSearchQuery}
            appointments={getAllFilteredAppointments}
          />
        </div>
        
        {/* Conteúdo principal */}
        <div className="flex-1">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              {/* View Toggle - Esquerda */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Mês
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className="h-8 px-3"
                >
                  <CalendarDays className="w-4 h-4 mr-1" />
                  Semana
                </Button>
              </div>

              {/* Navigation - Centro */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-xl font-semibold min-w-[200px] text-center">
                  {viewMode === 'month' 
                    ? `${monthNames[currentMonth]} ${currentYear}`
                    : getWeekRangeText(getWeekStart(currentWeek))
                  }
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateWeek('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Status da conexão Google Calendar - Direita */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Calendar className="w-3 h-3 mr-1" />
                      Google Calendar Conectado
                    </Badge>
                    {/* Informação da última atualização */}
                    <p className="text-xs text-muted-foreground mr-2">
                      Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                    </p>
                    <button
                      onClick={handleRefresh}
                      disabled={isLoading || isRefreshing}
                      title="Recarregar calendário"
                      className="inline-flex items-center justify-center rounded-md border border-red-200 bg-transparent px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
                    </button>
                    {isRefreshing && (
                      <span className="text-xs text-primary font-medium animate-pulse">
                        Recarregando...
                      </span>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={connect}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Conectar Google Calendar
                  </Button>
                )}
              </div>
            </div>
        </div>

        {/* Calendar */}
        <div className="bg-card rounded-2xl shadow-soft border border-border mt-6">
          {/* Week days header */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day) => (
              <div key={day} className="p-4 text-center font-medium text-muted-foreground bg-muted/30">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {viewMode === 'month' ? (
            <div className="grid grid-cols-7">
              {renderCalendarDays()}
            </div>
          ) : (
            renderWeeklyView()
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 items-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30"></div>
            <span className="text-muted-foreground">Consulta Rotina</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/30 border border-primary/40"></div>
            <span className="text-muted-foreground">Primeira Consulta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted border border-border"></div>
            <span className="text-muted-foreground">Retorno</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30"></div>
            <span className="text-muted-foreground">Emergência</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/15 border border-primary/25"></div>
            <span className="text-muted-foreground">Eventos Google Calendar</span>
          </div>
        </div>

        {/* Google Calendar Setup/Status */}
        <GoogleCalendarSetup 
          onConnect={connect}
          onDisconnect={disconnect}
          isConnected={isConnected}
        />

        </div>
      </div>
    </Layout>
  );
}