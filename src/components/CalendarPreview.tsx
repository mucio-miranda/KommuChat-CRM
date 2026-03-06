import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { useGoogleCalendar } from "@/contexts/GoogleCalendarContextSimple";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const parseEventDate = (start: { dateTime?: string; date?: string }): Date => {
  if (start.dateTime) return new Date(start.dateTime);
  if (start.date) {
    const [year, month, day] = start.date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
};

export function CalendarPreview() {
  const navigate = useNavigate();
  const { events, isConnected } = useGoogleCalendar();

  const todayEvents = useMemo(() => {
    const today = new Date();
    return events
      .filter((event) => {
        const eventDate = parseEventDate(event.start);
        return eventDate.toDateString() === today.toDateString();
      })
      .map((event) => {
        const isAllDay = !event.start.dateTime;
        const startDate = parseEventDate(event.start);
        const time = isAllDay
          ? "Dia inteiro"
          : startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        return {
          id: event.id,
          title: event.summary || "Evento sem título",
          subtitle: event.location || "",
          time,
        };
      })
      .sort((a, b) => {
        if (a.time === "Dia inteiro") return -1;
        if (b.time === "Dia inteiro") return 1;
        return a.time.localeCompare(b.time);
      });
  }, [events]);

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--tertiary))] flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Agenda de hoje</h3>
            <p className="text-xs text-muted-foreground">Consultas do dia</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/calendario")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver mais
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] scrollbar-gray">
        {!isConnected ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Conecte-se ao Google Calendar
          </div>
        ) : todayEvents.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhuma consulta agendada hoje
          </div>
        ) : (
          todayEvents.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate("/calendario")}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-[hsl(var(--tertiary))] text-foreground text-xs font-semibold">
                    {appointment.title.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {appointment.title}
                  </p>
                  {appointment.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {appointment.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground flex-shrink-0 ml-3 bg-[hsl(var(--tertiary))] px-3 py-1.5 rounded-lg">
                {appointment.time}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
