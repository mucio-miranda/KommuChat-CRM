import { Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoogleCalendar } from "@/contexts/GoogleCalendarContextSimple";
import { useMemo } from "react";
import { isHolidayEvent } from "@/lib/date-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function parseEventDate(start: { dateTime?: string; date?: string }): Date {
  if (start.dateTime) return new Date(start.dateTime);
  if (start.date) {
    const [year, month, day] = start.date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
}

export function NextAppointmentCard() {
  const navigate = useNavigate();
  const { events, isConnected } = useGoogleCalendar();

  const nextEvent = useMemo(() => {
    if (!isConnected || events.length === 0) return null;

    const now = new Date();
    const futureEvents = events
      .filter((e) => {
        if (isHolidayEvent(e)) return false;
        const eventDate = parseEventDate(e.start);
        return eventDate.getTime() >= now.getTime();
      })
      .sort((a, b) => {
        const dateA = parseEventDate(a.start).getTime();
        const dateB = parseEventDate(b.start).getTime();
        return dateA - dateB;
      });

    return futureEvents[0] || null;
  }, [events, isConnected]);

  const timeLabel = useMemo(() => {
    if (!nextEvent) return "";
    const eventDate = parseEventDate(nextEvent.start);
    const today = new Date();
    const isToday = eventDate.toDateString() === today.toDateString();
    const time = eventDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return isToday ? `Hoje · ${time}` : `${eventDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · ${time}`;
  }, [nextEvent]);

  const patientName = nextEvent?.summary || "Sem consultas";
  const patientEmail = nextEvent?.description?.split("\n")[0]?.replace(/\[PATIENT_METADATA\].*/, "").trim() || "";
  const initial = patientName.charAt(0).toUpperCase();

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--tertiary))] flex items-center justify-center">
          <Clock className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Próxima Consulta</h3>
          <p className="text-xs text-muted-foreground">Da sua agenda</p>
        </div>
      </div>

      {nextEvent ? (
        <div className="flex flex-col items-center text-center flex-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] mb-4">
            <Calendar className="w-3.5 h-3.5" />
            {timeLabel}
          </span>

          <Avatar className="h-14 w-14 mb-3 border-2 border-border">
            <AvatarFallback className="bg-muted text-foreground text-lg font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>

          <p className="text-base font-semibold text-foreground mb-0.5 line-clamp-1">{patientName}</p>
          {patientEmail && (
            <p className="text-xs text-muted-foreground line-clamp-1">{patientEmail}</p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          {isConnected ? "Nenhuma consulta futura" : "Conecte-se ao Google Calendar"}
        </div>
      )}

      <button
        onClick={() => navigate("/calendario")}
        className="mt-4 w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
      >
        Abrir agenda
      </button>
    </div>
  );
}
