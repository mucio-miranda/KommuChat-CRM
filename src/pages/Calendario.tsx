import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Calendar, RefreshCw, Grid3X3, CalendarDays } from "lucide-react";
import { useGoogleCalendar } from "@/contexts/GoogleCalendarContextSimple";
import { GoogleCalendarEvent } from "@/lib/google-calendar-hybrid";
import { CalendarAgendasList } from "@/components/CalendarAgendasList";
import { SearchConsultation } from "@/components/SearchConsultation";
import { useAuth } from "@/contexts/AuthContext";

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
  const [connectedCalendarName, setConnectedCalendarName] = useState<string>("");
  const { isConnected, isLoading, events, connect, disconnect, refreshEvents, forceRefreshToken, getCalendarList } = useGoogleCalendar();
  const { user } = useAuth();

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

  // Buscar nome do calendário conectado
  useEffect(() => {
    const loadCalendarName = async () => {
      if (isConnected) {
        try {
          const calendars = await getCalendarList();
          const primaryCalendar = calendars.find(cal => cal.primary === true);
          if (primaryCalendar) {
            setConnectedCalendarName(primaryCalendar.summary || 'Calendário Principal');
          } else if (calendars.length > 0) {
            setConnectedCalendarName(calendars[0].summary || 'Calendário');
          }
        } catch (error) {
          console.error('Erro ao carregar nome do calendário:', error);
          setConnectedCalendarName('Calendário Conectado');
        }
      } else {
        setConnectedCalendarName('');
      }
    };

    loadCalendarName();
  }, [isConnected, getCalendarList]);

  // ⭐ REFRESH GLOBAL movido para GoogleCalendarContextSimple.tsx
  // Agora o token é renovado automaticamente em TODAS as páginas do sistema, não apenas aqui

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
        <div key={`empty-${i}`} className="h-14 sm:h-18 md:h-24 lg:h-36 border border-border/20"></div>
      );
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const appointments = getAppointmentsForDay(day);
      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

      days.push(
        <div 
          key={day} 
          className={`h-14 sm:h-18 md:h-24 lg:h-36 border border-border/20 p-0.5 sm:p-1 md:p-1.5 bg-card relative transition-colors hover:bg-muted/20 cursor-pointer ${isToday ? 'bg-primary/5' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className={`text-[9px] sm:text-[10px] md:text-xs font-medium mb-0.5 ${isToday ? 'text-primary font-semibold' : 'text-foreground'}`}>
            {day}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {appointments.slice(0, 1).map((apt, index) => (
              <div key={`${apt.id}-${index}`} className={`text-[8px] sm:text-[9px] md:text-[10px] p-0.5 rounded ${apt.color} truncate leading-tight`}>
                <div className="font-medium truncate">{apt.time}</div>
                <div className="truncate hidden md:block">{apt.title}</div>
              </div>
            ))}
            {appointments.length > 1 && (
              <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground font-medium">
                +{appointments.length - 1}
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

      // Para mobile: mostrar apenas 3 dias (dia anterior, atual, próximo)
      const get3DaysForMobile = () => {
        const currentDay = currentWeek;
        const previousDay = new Date(currentDay);
        previousDay.setDate(currentDay.getDate() - 1);
        const nextDay = new Date(currentDay);
        nextDay.setDate(currentDay.getDate() + 1);
        return [previousDay, currentDay, nextDay];
      };

      const mobileDates = get3DaysForMobile();

      return (
        <>
          {/* Mobile - 3 dias */}
          <div className="grid grid-cols-3 gap-1 md:hidden">
            {mobileDates.map((day, index) => {
              const appointments = getAppointmentsForDate(day);
              const isToday = day.toDateString() === today.toDateString();
              const isCurrent = day.toDateString() === currentWeek.toDateString();
              const isCurrentMonth = day.getMonth() === currentMonth && day.getFullYear() === currentYear;

              return (
                <div key={index} className={`min-h-[280px] border border-border/20 p-1.5 bg-card relative transition-colors hover:bg-muted/20 ${isCurrent ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}>
                  {/* Header do dia */}
                  <div className="mb-1.5">
                    <div className={`text-[10px] font-medium ${isCurrent ? 'text-primary font-semibold' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {weekDays[day.getDay()]}
                    </div>
                    <div className={`text-sm font-bold ${isCurrent ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Appointments */}
                  <div className="space-y-1.5">
                    {appointments.map((apt) => (
                      <div key={apt.id} className={`p-1.5 rounded ${apt.color} cursor-pointer hover:opacity-80 transition-opacity shadow-sm`}>
                        <div className="font-semibold text-[10px] mb-0.5 truncate">{apt.time}</div>
                        <div className="font-medium text-[10px] mb-0.5 truncate">{apt.title}</div>
                        <div className="text-[9px] opacity-75 truncate">{apt.patient}</div>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <div className="text-[10px] text-muted-foreground text-center py-4">
                        -
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop - 7 dias */}
          <div className="hidden md:grid md:grid-cols-7 gap-1">
            {weekDates.map((day, index) => {
              const appointments = getAppointmentsForDate(day);
              const isToday = day.toDateString() === today.toDateString();
              const isCurrentMonth = day.getMonth() === currentMonth && day.getFullYear() === currentYear;

              return (
                <div key={index} className={`min-h-[450px] lg:min-h-[600px] border border-border/20 p-2 lg:p-3 bg-card relative transition-colors hover:bg-muted/20 ${isToday ? 'bg-primary/5' : ''}`}>
                  {/* Header do dia */}
                  <div className="mb-2 md:mb-3">
                    <div className={`text-sm font-medium ${isToday ? 'text-primary font-semibold' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {weekDays[day.getDay()]}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Appointments */}
                  <div className="space-y-2 lg:space-y-3">
                    {appointments.map((apt) => (
                      <div key={apt.id} className={`text-sm p-2 lg:p-3 rounded ${apt.color} cursor-pointer hover:opacity-80 transition-opacity shadow-sm`}>
                        <div className="font-semibold text-sm mb-1 truncate">{apt.time}</div>
                        <div className="font-medium text-sm mb-1 truncate">{apt.title}</div>
                        <div className="text-xs opacity-75 truncate">{apt.patient}</div>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-6 lg:py-8">
                        Nenhum agendamento
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    } catch (error) {
      console.error('Erro na renderização semanal:', error);
      return (
        <div className="p-4 md:p-8 text-center">
          <p className="text-red-500 text-sm md:text-base">Erro ao carregar visualização semanal</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
      );
    }
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-2 lg:space-y-0 px-0 sm:px-2 md:px-0">
        {/* Sidebar com lista de agendas - Desktop */}
        <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
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
        <div className="flex-1 min-w-0 px-1 sm:px-0">
          <div className="space-y-2 md:space-y-4">
            {/* Header */}
            <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
              {/* View Toggle e Navigation - Combinados em mobile */}
              <div className="flex items-center gap-1.5 w-full md:w-auto">
                {/* View Toggle */}
                <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 sm:p-1">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('month');
                      // No mobile, voltar para o mês atual
                      if (window.innerWidth < 768) {
                        const today = new Date();
                        setCurrentMonth(today.getMonth());
                        setCurrentYear(today.getFullYear());
                      }
                    }}
                    className="h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline text-xs sm:text-sm">Mês</span>
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('week');
                      // No mobile, voltar para o dia atual
                      if (window.innerWidth < 768) {
                        setCurrentWeek(new Date());
                      }
                    }}
                    className="h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline text-xs sm:text-sm">Semana</span>
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-center md:justify-start">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
                    className="flex-shrink-0 h-7 sm:h-8 w-7 sm:w-8 p-0"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                  <h2 className="text-xs sm:text-sm md:text-lg font-semibold min-w-[120px] sm:min-w-[140px] md:min-w-[180px] text-center truncate px-1">
                    {viewMode === 'month' 
                      ? `${monthNames[currentMonth]} ${currentYear}`
                      : getWeekRangeText(getWeekStart(currentWeek))
                    }
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateWeek('next')}
                    className="flex-shrink-0 h-7 sm:h-8 w-7 sm:w-8 p-0"
                  >
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>

              {/* Status da conexão Google Calendar */}
              <div className="flex items-center gap-1.5 sm:gap-2 justify-center md:justify-end">
                {isConnected ? (
                  <>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px] sm:text-xs whitespace-nowrap px-1.5 sm:px-2">
                      <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      <span className="hidden sm:inline">Google Calendar Conectado</span>
                      <span className="sm:hidden">Conectado</span>
                    </Badge>
                    <button
                      onClick={handleRefresh}
                      disabled={isLoading || isRefreshing}
                      title="Recarregar calendário"
                      className="inline-flex items-center justify-center rounded-md border border-red-200 bg-transparent w-7 h-7 sm:w-8 sm:h-8 text-sm font-medium text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
                    </button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={connect}
                    className="flex items-center justify-center gap-1.5 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                    size="sm"
                  >
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Conectar Google Calendar</span>
                    <span className="sm:hidden">Conectar</span>
                  </Button>
                )}
              </div>
            </div>
        </div>

        {/* Calendar */}
        <div className="bg-card rounded-md sm:rounded-lg md:rounded-2xl shadow-soft border border-border mt-2 md:mt-4 overflow-hidden">
          {/* Week days header */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day) => (
              <div key={day} className="py-1 sm:py-1.5 md:py-3 text-center text-[9px] sm:text-[10px] md:text-sm font-medium text-muted-foreground bg-muted/30">
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

        {/* Google Calendar Status */}
        {!isConnected ? (
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Google Calendar não conectado</p>
                    <p className="text-xs text-muted-foreground">
                      Use: {user?.email || 'seu-email@exemplo.com'}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={connect}
                  size="sm"
                  className="h-8 px-3"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Conectar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Google Calendar conectado</p>
                    <p className="text-xs text-muted-foreground">
                      {connectedCalendarName || user?.email || 'Calendário conectado'}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={disconnect}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                >
                  Desconectar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        </div>
      </div>
    </Layout>
  );
}