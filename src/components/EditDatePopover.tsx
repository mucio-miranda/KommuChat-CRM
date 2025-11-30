import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface EditDateModalProps {
  initialDate?: string;
  onSave: (date: Date | null) => Promise<void>;
  isLoading?: boolean;
}

export function EditDatePopover({ initialDate, onSave, isLoading = false }: EditDateModalProps) {
  // Se a data for ano 9999, tratamos como sem data
  const getInitialDate = () => {
    if (!initialDate) return undefined;
    const date = new Date(initialDate);
    return date.getFullYear() === 9999 ? undefined : date;
  };

  const [date, setDate] = useState<Date | undefined>(getInitialDate());
  const [time, setTime] = useState<string>(
    initialDate && new Date(initialDate).getFullYear() !== 9999 
      ? format(new Date(initialDate), "HH:mm") 
      : "09:00"
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async () => {
    try {
      if (!date) {
        await onSave(null);
      } else {
        // Combinar data e hora
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        await onSave(newDate);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao salvar data", error);
    }
  };

  const handleClear = async () => {
    try {
      await onSave(null);
      setDate(undefined);
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao limpar data", error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"ghost"}
          size="sm"
          className={cn(
            "h-8 w-full justify-start text-left font-normal hover:bg-muted/50 px-2",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          {date ? (
            <span className="truncate">
              {format(date, "dd/MM/yyyy")} {time}
            </span>
          ) : (
            <span>Definir data</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Agendar contato</h4>
            {date && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleClear}
                disabled={isLoading}
              >
                Limpar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 text-sm"
              disabled={isLoading}
            />
          </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={isLoading}
          initialFocus
        />
        <div className="p-3 border-t border-border bg-muted/10">
          <Button 
            className="w-full h-8 text-xs" 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Agendamento"
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

