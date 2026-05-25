import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EditDateModalProps {
  initialDate?: string;
  onSave: (date: Date | null) => Promise<void>;
  isLoading?: boolean;
  patientId?: number;
  patientName?: string;
  patientFonte?: 'ia' | 'humano';
}

export function EditDatePopover({
  initialDate,
  isLoading = false,
  patientId,
  patientName,
  patientFonte
}: EditDateModalProps) {
  const navigate = useNavigate();

  // Se a data for ano 9999, tratamos como sem data
  const getInitialDate = () => {
    if (!initialDate) return undefined;
    const date = new Date(initialDate);
    return date.getFullYear() === 9999 ? undefined : date;
  };

  const date = getInitialDate();
  const time = initialDate && new Date(initialDate).getFullYear() !== 9999 
    ? format(new Date(initialDate), "HH:mm") 
    : "";

  const handleClick = () => {
    const params = new URLSearchParams();
    
    if (date) {
      // Se já existe uma data, redirecionar para o calendário na visualização semanal
      params.append('date', date.toISOString());
      params.append('view', 'week');
      console.log('📅 Redirecionando para data existente:', date);
    } else {
      // Se não existe data, abrir modal de novo evento com paciente pré-selecionado
      console.log('🎯 Redirecionando para criar evento com paciente:', {
        patientId,
        patientName,
        patientFonte
      });
      if (patientId) params.append('patientId', patientId.toString());
      if (patientName) params.append('patientName', patientName);
      if (patientFonte) params.append('patientFonte', patientFonte);
      params.append('openModal', 'true');
    }
    
    navigate(`/calendario?${params.toString()}`);
  };

  return (
    <Button
      variant={"ghost"}
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "h-8 w-full justify-start text-left font-normal hover:bg-muted/50 hover:text-foreground px-2",
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
  );
}

