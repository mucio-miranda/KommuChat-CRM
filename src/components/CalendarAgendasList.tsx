import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
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

interface CalendarAgendasListProps {
  isConnected: boolean;
  onDateSelect?: (date: Date) => void;
}

export function CalendarAgendasList({ isConnected, onDateSelect }: CalendarAgendasListProps) {
  const { getCalendarList, selectedCalendars, setSelectedCalendars } = useGoogleCalendar();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  console.log('🔍 CalendarAgendasList renderizado, isConnected:', isConnected);

  const fetchCalendars = async () => {
    if (!isConnected) {
      console.log('❌ Google Calendar não conectado');
      return;
    }
    
    setIsLoading(true);
    console.log('🔍 Buscando agendas do Google Calendar...');
    
    try {
      const calendarsList = await getCalendarList();
      console.log('📅 Agendas encontradas:', calendarsList);
      
      // Marcar calendários como selecionados por padrão se nenhum estiver selecionado
      if (selectedCalendars.length === 0 && calendarsList.length > 0) {
        const defaultSelected = calendarsList.map(cal => cal.id);
        setSelectedCalendars(defaultSelected);
        console.log('✅ Todos os calendários selecionados por padrão:', defaultSelected);
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
    return (
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="text-sm text-muted-foreground text-center">
            Conecte-se ao Google Calendar para ver suas agendas
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card className="mb-4">
      <CardContent className="p-0">
        <Button
          variant="ghost"
          className="w-full justify-between p-2.5 text-left font-medium"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-sm">Minhas Agendas</span>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
        
        {isExpanded && (
          <div className="px-2.5 pb-2.5">
            {isLoading ? (
              <div className="text-xs text-muted-foreground py-1.5">
                Carregando agendas...
              </div>
            ) : (
              <div className="space-y-0.5">
                {calendars.map((calendar) => {
                  const isSelected = selectedCalendars.includes(calendar.id);
                  return (
                    <div
                      key={calendar.id}
                      className="flex items-center space-x-1.5 py-1 cursor-pointer hover:bg-muted/50 rounded px-1.5"
                      onClick={() => handleCalendarToggle(calendar.id, !isSelected)}
                    >
                      <div className="flex items-center justify-center w-3.5 h-3.5 border border-gray-300 rounded">
                        {isSelected && (
                          <Check className="h-2.5 w-2.5 text-primary" />
                        )}
                      </div>
                      <span className="text-xs text-foreground flex-1 truncate">
                        {calendar.summary}
                      </span>
                      {calendar.backgroundColor && (
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: calendar.backgroundColor }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
  );
}
