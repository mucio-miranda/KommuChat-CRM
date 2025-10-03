import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoogleCalendar } from "@/contexts/GoogleCalendarContextSimple";
import { CalendarPreviewAgendas } from "./CalendarPreviewAgendas";

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const weekDaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarPreview() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const { events } = useGoogleCalendar();

  // Calcular os 5 dias: 2 antes, hoje, 2 depois
  const fiveDays = useMemo(() => {
    const days = [];
    for (let i = -2; i <= 2; i++) {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      days.push({
        date: date,
        weekDay: weekDaysShort[date.getDay()],
        day: date.getDate(),
        active: i === 0,
      });
    }
    return days;
  }, [selectedDate]);

  // Filtrar eventos do dia selecionado
  const todayEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const eventDate = event.start.dateTime 
        ? new Date(event.start.dateTime) 
        : new Date(event.start.date || '');
      
      return eventDate.toDateString() === selectedDate.toDateString();
    });

    // Aplicar filtro de pesquisa
    if (searchQuery.trim()) {
      return filtered.filter(event => 
        event.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [events, selectedDate, searchQuery]);

  // Formatar eventos para exibição
  const formattedAppointments = useMemo(() => {
    return todayEvents.map((event) => {
      const startDate = event.start.dateTime 
        ? new Date(event.start.dateTime) 
        : new Date(event.start.date || '');
      const endDate = event.end?.dateTime 
        ? new Date(event.end.dateTime) 
        : null;

      const startTime = startDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const endTime = endDate?.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      return {
        id: event.id,
        title: event.summary || 'Evento sem título',
        time: endTime ? `${startTime} - ${endTime}` : startTime,
      };
    }).sort((a, b) => a.time.localeCompare(b.time));
  }, [todayEvents]);

  // Navegar entre dias
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(selectedDate.getDate() - 1);
    } else {
      newDate.setDate(selectedDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(selectedDate.getMonth() - 1);
    } else {
      newDate.setMonth(selectedDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  // Selecionar um dia específico
  const selectDay = (day: typeof fiveDays[0]) => {
    setSelectedDate(new Date(day.date));
  };

  return (
    <Card className="p-6 bg-white rounded-xl shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
            <Calendar className="w-5 h-5 text-[#E21929]" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Agenda</h2>
        </div>
        <Button 
          variant="ghost" 
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/calendario')}
        >
          Ver mais
        </Button>
      </div>

      {/* Minhas Agendas */}
      <CalendarPreviewAgendas />

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-xl px-2 py-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => navigateMonth('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-base font-medium text-muted-foreground">
          {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => navigateMonth('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days Strip */}
      <div className="flex items-center gap-1 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 flex-shrink-0"
          onClick={() => navigateDay('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-1 flex-1">
          {fiveDays.map((day, index) => (
            <div
              key={index}
              className={`flex flex-col items-center flex-1 px-2 py-2 rounded-xl transition-all cursor-pointer ${
                day.active
                  ? "border-2 border-[#E21929] bg-red-50"
                  : "border border-transparent hover:bg-gray-50"
              }`}
              onClick={() => selectDay(day)}
            >
              <span className="text-xs text-muted-foreground mb-1">
                {day.weekDay}
              </span>
              <span
                className={`text-base font-semibold ${
                  day.active ? "text-[#E21929]" : "text-foreground"
                }`}
              >
                {day.day}
              </span>
            </div>
          ))}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 flex-shrink-0"
          onClick={() => navigateDay('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquise uma consulta"
          className="pl-10 bg-gray-50 border-0 rounded-xl h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {formattedAppointments.length > 0 ? (
          formattedAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-smooth cursor-pointer"
            >
              <h3 className="font-semibold text-foreground mb-1">
                {appointment.title}
              </h3>
              <p className="text-sm text-muted-foreground">{appointment.time}</p>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "Nenhuma consulta encontrada" : "Nenhuma consulta agendada"}
          </div>
        )}
      </div>
    </Card>
  );
}

