import { useState, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGoogleCalendar } from '@/contexts/GoogleCalendarContextSimple';

interface Calendar {
  id: string;
  summary: string;
  description?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  accessRole: string;
}

export function CalendarPreviewAgendas() {
  const { getCalendarList, selectedCalendars, setSelectedCalendars, isConnected } = useGoogleCalendar();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCalendars = async () => {
    if (!isConnected) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const calendarsList = await getCalendarList();
      
      // Marcar calendários como selecionados por padrão se nenhum estiver selecionado
      if (selectedCalendars.length === 0 && calendarsList.length > 0) {
        const defaultSelected = calendarsList.map((cal: Calendar) => cal.id);
        setSelectedCalendars(defaultSelected);
      }
      
      setCalendars(calendarsList);
    } catch (error) {
      console.error('❌ Erro ao buscar agendas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    if (checked) {
      setSelectedCalendars(prev => [...prev, calendarId]);
    } else {
      setSelectedCalendars(prev => prev.filter(id => id !== calendarId));
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchCalendars();
    }
  }, [isConnected]);

  if (!isConnected) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-0">
        <Button
          variant="ghost"
          className="w-full justify-between p-3 text-left font-medium"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Filtrar agendas</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
        
        {isExpanded && (
          <div className="px-3 pb-3">
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-2">
                Carregando agendas...
              </div>
            ) : (
              <div className="space-y-1">
                {calendars.map((calendar) => {
                  const isSelected = selectedCalendars.includes(calendar.id);
                  return (
                    <div
                      key={calendar.id}
                      className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-2"
                      onClick={() => handleCalendarToggle(calendar.id, !isSelected)}
                    >
                      <div className="flex items-center justify-center w-4 h-4 border border-gray-300 rounded">
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <span className="text-sm text-foreground flex-1">
                        {calendar.summary}
                      </span>
                      {calendar.backgroundColor && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: calendar.backgroundColor }}
                        />
                      )}
                    </div>
                  );
                })}
                
                {calendars.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    Nenhuma agenda encontrada
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

