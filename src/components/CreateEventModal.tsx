import { useState, useEffect } from "react";
import { Calendar, X, Save, Clock, MapPin, Users, FileText } from "lucide-react";
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
  initialDate?: Date;
  initialTime?: string;
}

export function CreateEventModal({
  isOpen,
  onClose,
  onEventCreated,
  initialDate,
  initialTime,
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
  const { createEvent, isConnected } = useGoogleCalendar();

  // Preencher data/hora inicial se fornecida
  useEffect(() => {
    if (isOpen && initialDate) {
      const dateStr = initialDate.toISOString().split("T")[0];
      const timeStr = initialTime || "09:00";
      setFormData((prev) => ({
        ...prev,
        startDate: dateStr,
        startTime: timeStr,
        endDate: dateStr,
        endTime: calculateEndTime(timeStr, prev.duracao_minutos),
      }));
    }
  }, [isOpen, initialDate, initialTime]);


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

      const createdEvent = await createEvent(googleEvent);

      // Evento criado com sucesso no Google Calendar
      toast({
        title: "Sucesso",
        description: "Evento criado no Google Calendar com sucesso!",
      });

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Novo Evento no Calendário
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
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora Início *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                required
                disabled={isLoading}
              />
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
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora Término</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                disabled={isLoading}
              />
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
          <div className="flex justify-end gap-2 pt-4">
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
              {isLoading ? "Criando..." : "Criar Evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

