import { useState, useEffect, useRef } from "react";
import { Calendar, X, Save, Clock, MapPin, Users, FileText, ChevronDown, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useGoogleCalendar } from "@/contexts/GoogleCalendarContextSimple";
import { GoogleCalendarEvent } from "@/types/google-calendar";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  initialDate?: Date;
  initialTime?: string;
  existingEvents?: GoogleCalendarEvent[];
  modalMode?: 'create' | 'edit';
  selectedEvent?: GoogleCalendarEvent | null;
}

export function CreateEventModal({
  isOpen,
  onClose,
  onEventCreated,
  initialDate,
  initialTime,
  existingEvents = [],
  modalMode = 'create',
  selectedEvent = null,
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { createEvent, updateEvent, deleteEvent, isConnected } = useGoogleCalendar();
  const startDateRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

  // Preencher formulário quando modal abrir
  useEffect(() => {
    if (isOpen) {
      if (modalMode === 'edit' && selectedEvent) {
        // Modo de edição: preencher com dados do evento selecionado
        const startDate = selectedEvent.start.dateTime 
          ? new Date(selectedEvent.start.dateTime) 
          : selectedEvent.start.date 
          ? new Date(selectedEvent.start.date)
          : new Date();
        
        const endDate = selectedEvent.end.dateTime 
          ? new Date(selectedEvent.end.dateTime) 
          : selectedEvent.end.date 
          ? new Date(selectedEvent.end.date)
          : new Date();
        
        const startDateStr = startDate.toISOString().split("T")[0];
        const startTimeStr = startDate.toTimeString().slice(0, 5);
        const endDateStr = endDate.toISOString().split("T")[0];
        const endTimeStr = endDate.toTimeString().slice(0, 5);
        
        // Calcular duração em minutos
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        
        // Formatar participantes
        const attendeesStr = selectedEvent.attendees
          ?.map(att => att.email)
          .filter(Boolean)
          .join(", ") || "";
        
        setFormData({
          title: selectedEvent.summary || "",
          description: selectedEvent.description || "",
          startDate: startDateStr,
          startTime: startTimeStr,
          endDate: endDateStr,
          endTime: endTimeStr,
          location: selectedEvent.location || "",
          duracao_minutos: durationMinutes.toString(),
          attendees: attendeesStr,
        });
      } else if (initialDate) {
        // Modo de criação: preencher com data/hora inicial se fornecida
        const dateStr = initialDate.toISOString().split("T")[0];
        const timeStr = initialTime || "09:00";
        setFormData((prev) => ({
          ...prev,
          startDate: dateStr,
          startTime: timeStr,
          endDate: dateStr,
          endTime: calculateEndTime(timeStr, prev.duracao_minutos),
        }));
      } else {
        // Limpar formulário para novo evento
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
    }
  }, [isOpen, initialDate, initialTime, modalMode, selectedEvent]);


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
      // Ao editar, não considerar o próprio evento como conflito
      const hasConflict = existingEvents.some((event) => {
        // Ignorar o evento que está sendo editado
        if (modalMode === 'edit' && selectedEvent?.id && event.id === selectedEvent.id) {
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

      // Preparar dados do evento
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

      if (modalMode === 'edit' && selectedEvent?.id) {
        // Atualizar evento existente
        await updateEvent(selectedEvent.id, googleEvent, selectedEvent.calendarId);
        
        toast({
          title: "Sucesso",
          description: "Evento atualizado no Google Calendar com sucesso!",
        });
      } else {
        // Criar novo evento
        await createEvent(googleEvent);
        
        toast({
          title: "Sucesso",
          description: "Evento criado no Google Calendar com sucesso!",
        });
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

      // Fechar modal e chamar callback
      onClose();
      if (onEventCreated) {
        onEventCreated();
      }
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

  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id) return;
    
    setIsLoading(true);
    try {
      await deleteEvent(selectedEvent.id, selectedEvent.calendarId);
      
      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });
      
      // Fechar modal e chamar callback
      setIsDeleteDialogOpen(false);
      onClose();
      if (onEventCreated) {
        onEventCreated();
      }
    } catch (error: any) {
      console.error("Erro ao deletar evento:", error);
      toast({
        title: "Erro",
        description:
          error.message || "Não foi possível excluir o agendamento. Tente novamente.",
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
            {modalMode === 'edit' ? 'Editar Evento' : 'Novo Evento no Calendário'}
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
          <div className="flex justify-between gap-2 pt-4">
            {/* Botão de deletar - apenas no modo de edição */}
            {modalMode === 'edit' && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
            
            <div className="flex gap-2 ml-auto">
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
                  ? (modalMode === 'edit' ? "Salvando..." : "Criando...") 
                  : (modalMode === 'edit' ? "Salvar Alterações" : "Criar Evento")
                }
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* AlertDialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
              {selectedEvent && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="font-semibold text-foreground">{selectedEvent.summary}</p>
                  {selectedEvent.start.dateTime && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedEvent.start.dateTime).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Excluindo..." : "Excluir Agendamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

