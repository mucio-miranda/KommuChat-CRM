import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerPopoverProps {
  value?: string; // formato: "YYYY-MM-DD"
  onChange: (date: string) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export function DatePickerPopover({
  value,
  onChange,
  disabled = false,
  required = false,
  label,
}: DatePickerPopoverProps) {
  const [date, setDate] = useState<Date | undefined>(
    value ? new Date(value + "T00:00:00") : undefined
  );
  const [isOpen, setIsOpen] = useState(false);

  // Sincronizar com o valor externo
  useEffect(() => {
    if (value) {
      const newDate = new Date(value + "T00:00:00");
      setDate(newDate);
    } else {
      setDate(undefined);
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const dateString = format(selectedDate, "yyyy-MM-dd");
      onChange(dateString);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
    onChange("");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-input text-foreground hover:bg-accent hover:text-accent-foreground shadow-none",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <span>{format(date, "dd/MM/yyyy", { locale: ptBR })}</span>
          ) : (
            <span>Selecione uma data</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Selecionar data</h4>
            {date && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleClear}
                disabled={disabled}
                type="button"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={disabled}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}

