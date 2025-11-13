import { useState, useEffect, useRef } from "react";
import { Calendar, X, Save, Clock, MapPin, Users, FileText, ChevronDown, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGoogleCalendar } from "@/contexts/GoogleCalendarContextSimple";
import { GoogleCalendarEvent } from "@/types/google-calendar";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
  initialDate?: Date;
  initialTime?: string;
  existingEvents?: GoogleCalendarEvent[];
  mode?: "create" | "edit";
  eventToEdit?: GoogleCalendarEvent | null;
}

export function CreateEventModal({
  isOpen,
  onClose,
  onEventCreated,
  initialDate,
  initialTime,
  existingEvents = [],
  onEventUpdated,
  onEventDeleted,
  mode = "create",
  eventToEdit = null,
}: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    duracao_minutos: "60",
    attendees: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { createEvent, updateEvent, deleteEvent, isConnected } = useGoogleCalendar();
  const startDateRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

  // Preencher data/hora inicial se fornecida
  useEffect(() => {
    if (isOpen && mode === "edit" && eventToEdit) {
      const startDateTime = eventToEdit.start?.dateTime || eventToEdit.start?.date;
      const endDateTime = eventToEdit.end?.dateTime || eventToEdit.end?.date;
      const start = startDateTime ? new Date(startDateTime) : null;
      const end = endDateTime ? new Date(endDateTime) : null;

      const getDateOnly = (value?: string) => {
        if (!value) return "";
        if (value.includes("T")) {
          return value.split("T")[0];
        }
        return value;
        };

      const getTimeOnly = (value?: string) => {
        if (!value || !value.includes("T")) return "";
        const [, timeWithZone] = value.split("T");
        if (!timeWithZone) return "";
        return timeWithZone.slice(0, 5);
      };

      setFormData({
        title: eventToEdit.summary || "",
        description: eventToEdit.description || "",
        startDate: getDateOnly(startDateTime),
        startTime: getTimeOnly(eventToEdit.start?.dateTime),
        endDate: getDateOnly(endDateTime),
        endTime: getTimeOnly(eventToEdit.end?.dateTime),
        location: eventToEdit.location || "",
        duracao_minutos: (() => {
          if (!start || !end) return "60";
          const diffMinutes = (end.getTime() - start.getTime()) / (60 * 1000);
          return String(diffMinutes > 0 ? diffMinutes : 60);
        })(),
        attendees:
          eventToEdit.attendees
            ?.map((attendee) => attendee.email)
            .filter(Boolean)
            .join(", ") || "",
      });
    } else if (isOpen && initialDate) {
      const dateStr = initialDate.toISOString().split("T")[0];
      const timeStr = initialTime || "09:00";
      setFormData((prev) => ({
        ...prev,
        startDate: dateStr,
        startTime: timeStr,
        endDate: dateStr,
        endTime: calculateEndTime(timeStr, prev.duracao_minutos),
      }));
    } else if (!isOpen || mode === "create") {
      setFormData({
        title: "",
        description: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        duracao_minutos: "60",
        attendees: "",
      });
    }
  }, [isOpen, initialDate, initialTime, mode, eventToEdit]);


  const calculateEndTime = (startTime: string, duration: string): string => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const durationMinutes = parseInt(duration) || 60;
    const endDate = new Date();
    endDate.setHours(hours, minutes + durationMinutes, 0, 0);
    return `${endDate.getHours().toString().padStart(2, "0")}:${endDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Recalcular hora de término quando duração mudar
      if (field === "duracao_minutos" || field === "startTime") {
        if (updated.startTime) {
          updated.endTime = calculateEndTime(
            updated.startTime,
            updated.duracao_minutos
          );
        }
        // Se mudou a data de início, atualizar data de término também
        if (field === "startDate") {
          updated.endDate = value;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast({
        title: "Erro",
        description: "Conecte-se ao Google Calendar primeiro",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título do evento é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startDate || !formData.startTime) {
      toast({
        title: "Erro",
        description: "Data e hora de início são obrigatórias",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Formatar data/hora para ISO 8601
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}:00`
      );
      const endDateTime = new Date(
        `${formData.endDate || formData.startDate}T${formData.endTime || calculateEndTime(formData.startTime, formData.duracao_minutos)}:00`
      );

      // Verificar se a data de término é válida
      if (endDateTime <= startDateTime) {
        toast({
          title: "Erro",
          description: "A hora de término deve ser posterior à hora de início",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Verificar se há conflito com eventos existentes
      const hasConflict = existingEvents.some((event) => {
        if (mode === "edit" && event.id === eventToEdit?.id) {
          return false;
        }
        if (!event.start || !event.end) return false;

        const existingStart = event.start.dateTime 
          ? new Date(event.start.dateTime) 
          : event.start.date 
          ? new Date(event.start.date)
          : null;
        
        const existingEnd = event.end.dateTime 
          ? new Date(event.end.dateTime) 
          : event.end.date 
          ? new Date(event.end.date)
          : null;

        if (!existingStart || !existingEnd) return false;

        // Verificar se há sobreposição de horários
        // Conflito ocorre se: novo evento começa antes do evento existente terminar
        // E novo evento termina depois do evento existente começar
        const conflicts = 
          (startDateTime < existingEnd && endDateTime > existingStart);

        return conflicts;
      });

      if (hasConflict) {
        toast({
          title: "Erro",
          description: "Já existe um evento neste horário. Escolha outro horário.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Preparar participantes (attendees)
      const attendees = formData.attendees
        ? formData.attendees
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email.includes("@"))
            .map((email) => ({ email }))
        : [];

      // Criar evento no Google Calendar
      const googleEvent: Partial<GoogleCalendarEvent> = {
        summary: formData.title,
        description: formData.description || undefined,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: formData.location || undefined,
        attendees: attendees.length > 0 ? attendees : undefined,
      };

      if (mode === "edit" && eventToEdit?.id) {
        await updateEvent(eventToEdit.id, googleEvent, eventToEdit.calendarId || undefined);
        toast({
          title: "Evento atualizado",
          description: "Alterações salvas no Google Calendar.",
        });
        if (onEventUpdated) {
          onEventUpdated();
        }
      } else {
        await createEvent(googleEvent);
        toast({
          title: "Sucesso",
          description: "Evento criado no Google Calendar com sucesso!",
        });
        if (onEventCreated) {
          onEventCreated();
        }
      }

      // Limpar formulário
      setFormData({
        title: "",
        description: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        duracao_minutos: "60",
        attendees: "",
      });

      // Fechar modal
      onClose();
    } catch (error: any) {
      console.error("Erro ao criar evento:", error);
      toast({
        title: "Erro",
        description:
          error.message || "Não foi possível criar o evento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        title: "",
        description: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        duracao_minutos: "60",
        attendees: "",
      });
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit?.id) return;
    const confirmed = window.confirm("Tem certeza de que deseja remover este evento?");
    if (!confirmed) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteEvent(eventToEdit.id, eventToEdit.calendarId || undefined);
      toast({
        title: "Evento removido",
        description: "O evento foi apagado do Google Calendar.",
      });
      if (onEventDeleted) {
        onEventDeleted();
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o evento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {mode === "edit" ? "Editar Evento" : "Novo Evento no Calendário"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Título do Evento *
            </Label>
            <Input
              id="title"
              placeholder="Ex: Consulta com João Silva"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Data e Hora de Início */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Data Início *
              </Label>
              <div className="relative">
                <Input
                  ref={startDateRef}
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" 
                  onClick={() => {
                    if (startDateRef.current) {
                      startDateRef.current.showPicker?.() || startDateRef.current.click();
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora Início *</Label>
              <div className="relative">
                <Input
                  ref={startTimeRef}
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" 
                  onClick={() => {
                    if (startTimeRef.current) {
                      startTimeRef.current.showPicker?.() || startTimeRef.current.click();
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="duracao_minutos">Duração (minutos)</Label>
            <Select
              value={formData.duracao_minutos}
              onValueChange={(value) =>
                handleInputChange("duracao_minutos", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1h 30min</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data e Hora de Término */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Término</Label>
              <div className="relative">
                <Input
                  ref={endDateRef}
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" 
                  onClick={() => {
                    if (endDateRef.current) {
                      endDateRef.current.showPicker?.() || endDateRef.current.click();
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora Término</Label>
              <div className="relative">
                <Input
                  ref={endTimeRef}
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" 
                  onClick={() => {
                    if (endTimeRef.current) {
                      endTimeRef.current.showPicker?.() || endTimeRef.current.click();
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localização
            </Label>
            <Input
              id="location"
              placeholder="Endereço ou sala"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Participantes */}
          <div className="space-y-2">
            <Label htmlFor="attendees" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participantes (emails, separados por vírgula)
            </Label>
            <Input
              id="attendees"
              type="text"
              placeholder="email1@exemplo.com, email2@exemplo.com"
              value={formData.attendees}
              onChange={(e) => handleInputChange("attendees", e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Descrição
            </Label>
            <Textarea
              id="description"
              placeholder="Observações sobre o evento..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
            {mode === "edit" ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="sm:order-1 order-2"
              >
                <Trash className="w-4 h-4 mr-2" />
                Apagar evento
              </Button>
            ) : (
              <div />
            )}
            <div className="flex justify-end gap-2 sm:order-2 order-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !isConnected}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading
                  ? mode === "edit"
                    ? "Salvando..."
                    : "Criando..."
                  : mode === "edit"
                  ? "Salvar alterações"
                  : "Criar Evento"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

