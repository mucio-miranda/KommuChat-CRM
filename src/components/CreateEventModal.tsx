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
  DialogDescription,
  DialogFooter,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useGoogleCalendar } from "@/contexts/GoogleCalendarContextSimple";
import { GoogleCalendarEvent } from "@/types/google-calendar";
import { usePatientsSearch } from "@/hooks/usePatientsSearch";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { Patient, EventPatientMetadata } from "@/types/patient";
import { PatientCombobox } from "@/components/PatientCombobox";
import { DatePickerPopover } from "@/components/DatePickerPopover";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  initialDate?: Date;
  initialTime?: string;
  existingEvents?: GoogleCalendarEvent[];
  modalMode?: 'create' | 'edit';
  selectedEvent?: GoogleCalendarEvent | null;
  preSelectedPatient?: { id: number; fonte: 'ia' | 'humano'; name: string } | null;
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
  preSelectedPatient = null,
}: CreateEventModalProps) {
  console.log('🔄 CreateEventModal renderizado - preSelectedPatient:', preSelectedPatient);

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteScope, setDeleteScope] = useState<'single' | 'all'>('single');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  const { createEvent, updateEvent, deleteEvent, isConnected } = useGoogleCalendar();
  const { patients, loading: patientsLoading, iaTableName } = usePatientsSearch();
  const { write: supabaseWrite, read: supabase } = useSupabase();
  const { user } = useAuth();

  // Debug: Log quando pacientes são carregados
  useEffect(() => {
    console.log('🔍 CreateEventModal: Pacientes carregados:', patients.length, 'Loading:', patientsLoading);
  }, [patients, patientsLoading]);

  // Definir paciente pré-selecionado quando fornecido
  useEffect(() => {
    if (preSelectedPatient && patients.length > 0 && isOpen && modalMode === 'create') {
      const patient = patients.find(
        p => p.id === preSelectedPatient.id && p.fonte === preSelectedPatient.fonte
      );
      if (patient) {
        console.log('🎯 Paciente pré-selecionado encontrado:', patient);
        setSelectedPatient(patient);
      } else {
        console.log('❌ Paciente pré-selecionado não encontrado:', preSelectedPatient);
        console.log('📋 Pacientes disponíveis:', patients.length);
      }
    }
  }, [preSelectedPatient, patients, isOpen, modalMode]);

  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

  // Função helper para converter data de eventos corretamente
  const parseEventDate = (start: { dateTime?: string; date?: string }): Date => {
    if (start.dateTime) {
      return new Date(start.dateTime);
    } else if (start.date) {
      // Evento de dia inteiro - interpretar no timezone local sem conversão UTC
      const [year, month, day] = start.date.split('-').map(Number);
      return new Date(year, month - 1, day); // month é 0-indexed
    }
    return new Date();
  };

  // Função auxiliar para extrair metadata do paciente da descrição do evento
  const extractPatientMetadata = (description?: string): EventPatientMetadata | null => {
    if (!description) return null;
    
    try {
      // Procurar por JSON no final da descrição
      const metadataMatch = description.match(/\[PATIENT_METADATA\](.*?)\[\/PATIENT_METADATA\]/);
      if (metadataMatch) {
        return JSON.parse(metadataMatch[1]);
      }
    } catch (error) {
      console.error('Erro ao extrair metadata do paciente:', error);
    }
    
    return null;
  };

  // Preencher formulário quando modal abrir
  useEffect(() => {
    if (isOpen) {
      if (modalMode === 'edit' && selectedEvent) {
        // Modo de edição: preencher com dados do evento selecionado
        const startDate = parseEventDate(selectedEvent.start);
        const endDate = selectedEvent.end ? parseEventDate(selectedEvent.end) : startDate;
        
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
        
        // Extrair metadata do paciente
        const patientMetadata = extractPatientMetadata(selectedEvent.description);
        
        // Buscar paciente se houver metadata
        if (patientMetadata && patients.length > 0) {
          const patient = patients.find(
            p => p.id === patientMetadata.patientId && p.fonte === patientMetadata.patientSource
          );
          setSelectedPatient(patient || null);
        } else {
          setSelectedPatient(null);
        }
        
        // Remover metadata da descrição para exibição
        let displayDescription = selectedEvent.description || "";
        if (patientMetadata) {
          displayDescription = displayDescription.replace(/\[PATIENT_METADATA\].*?\[\/PATIENT_METADATA\]/, '').trim();
        }
        
        setFormData({
          title: selectedEvent.summary || "",
          description: displayDescription,
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
        // Não limpar paciente selecionado se houver um pré-selecionado
        if (!preSelectedPatient) {
          setSelectedPatient(null);
        }
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
        // Não limpar paciente selecionado se houver um pré-selecionado
        if (!preSelectedPatient) {
          setSelectedPatient(null);
        }
      }
    }
  }, [isOpen, initialDate, initialTime, modalMode, selectedEvent, patients, preSelectedPatient]);


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

      // Validação de conflitos de horários desativada
      // Permite criar eventos no mesmo horário ou com sobreposição

      // Preparar participantes (attendees)
      const attendees = formData.attendees
        ? formData.attendees
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email.includes("@"))
            .map((email) => ({ email }))
        : [];

      // Preparar descrição com metadata do paciente (se houver)
      let eventDescription = formData.description || "";
      if (selectedPatient) {
        const patientMetadata: EventPatientMetadata = {
          patientId: selectedPatient.id,
          patientSource: selectedPatient.fonte,
          patientName: selectedPatient.nome,
        };
        eventDescription += `\n\n[PATIENT_METADATA]${JSON.stringify(patientMetadata)}[/PATIENT_METADATA]`;
      }

      // Preparar dados do evento
      const googleEvent: Partial<GoogleCalendarEvent> = {
        summary: formData.title,
        description: eventDescription || undefined,
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

      // Criar ou atualizar evento no Google Calendar
      if (modalMode === 'edit' && selectedEvent?.id) {
        // Atualizar evento existente
        await updateEvent(selectedEvent.id, googleEvent, selectedEvent.calendarId);
      } else {
        // Criar novo evento
        await createEvent(googleEvent);
      }

      // Atualizar data_agendamento do paciente (se houver paciente selecionado)
      if (selectedPatient && user) {
        try {
          const dateStr = startDateTime.toISOString();
          
          const { error: updateError } = await supabase!
            .from(iaTableName)
            .update({
              data_agendamento: dateStr,
              topoucall: true,
            })
            .eq('id', selectedPatient.id);

          if (updateError) {
            console.error('Erro ao atualizar paciente:', updateError);
            toast({
              title: "Aviso",
              description: "Evento salvo, mas houve um erro ao atualizar o agendamento do paciente.",
              variant: "default",
            });
          }
        } catch (patientError) {
          console.error('Erro ao atualizar paciente:', patientError);
          toast({
            title: "Aviso",
            description: "Evento salvo, mas houve um erro ao atualizar o agendamento do paciente.",
            variant: "default",
          });
        }
      }
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Sucesso",
        description: modalMode === 'edit' 
          ? "Evento atualizado no Google Calendar com sucesso!" 
          : "Evento criado no Google Calendar com sucesso!",
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
      setSelectedPatient(null);

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
      setSelectedPatient(null);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || modalMode !== 'edit') return;

    try {
      setIsLoading(true);

      // Extrair metadata do paciente antes de deletar
      const patientMetadata = extractPatientMetadata(selectedEvent.description);

      // Deletar evento do Google Calendar
      const isRecurring = !!selectedEvent.recurringEventId;
      await deleteEvent(
        selectedEvent.id,
        selectedEvent.calendarId || 'primary',
        isRecurring ? deleteScope : 'single',
        selectedEvent.recurringEventId
      );

      // Remover agendamento do paciente (se houver paciente associado)
      if (patientMetadata && user) {
        try {
          const { error: updateError } = await supabase!
            .from(iaTableName)
            .update({
              data_agendamento: null,
              topoucall: false,
            })
            .eq('id', patientMetadata.patientId);

          if (updateError) {
            console.error('Erro ao atualizar paciente:', updateError);
          }
        } catch (patientError) {
          console.error('Erro ao atualizar paciente ao deletar evento:', patientError);
        }
      }

      toast({
        title: "Evento deletado!",
        description: isRecurring && deleteScope === 'all'
          ? "Toda a série de eventos recorrentes foi removida do calendário."
          : "O evento foi removido com sucesso do calendário.",
      });

      // Fechar modal e notificar atualização
      handleClose();
      onEventCreated?.();
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      toast({
        title: "Erro ao deletar evento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar deletar o evento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
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

          {/* Seleção de Paciente */}
          <div className="space-y-2">
            <Label htmlFor="patient" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Paciente
            </Label>
            <PatientCombobox
              patients={patients}
              value={selectedPatient ? { id: selectedPatient.id, fonte: selectedPatient.fonte } : null}
              onSelect={setSelectedPatient}
              disabled={isLoading}
              loading={patientsLoading}
            />
            {selectedPatient && (
              <p className="text-xs text-muted-foreground">
                A data deste agendamento será sincronizada com o lembrete de consulta do paciente.
              </p>
            )}
          </div>

          {/* Data e Hora de Início */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Data Início *
              </Label>
              <DatePickerPopover
                value={formData.startDate}
                onChange={(date) => handleInputChange("startDate", date)}
                disabled={isLoading}
                required
              />
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
              <DatePickerPopover
                value={formData.endDate}
                onChange={(date) => handleInputChange("endDate", date)}
                disabled={isLoading}
              />
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
          <div className="flex justify-between items-center gap-2 pt-4 border-t">
            {/* Botão Deletar (apenas em modo de edição) */}
            {modalMode === 'edit' && selectedEvent && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Evento
              </Button>
            )}

            {/* Botões de ação principal */}
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

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
        setShowDeleteConfirm(open);
        if (!open) setDeleteScope('single');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {selectedEvent?.recurringEventId
                    ? "Este é um evento recorrente. Escolha como deseja excluí-lo:"
                    : "Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita e o evento será removido permanentemente do Google Calendar."}
                </p>
                {selectedEvent?.recurringEventId && (
                  <RadioGroup
                    value={deleteScope}
                    onValueChange={(v) => setDeleteScope(v as 'single' | 'all')}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="delete-single" />
                      <Label htmlFor="delete-single" className="font-normal cursor-pointer">
                        Somente este evento
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="delete-all" />
                      <Label htmlFor="delete-all" className="font-normal cursor-pointer">
                        Todos os eventos da série
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? "Excluindo..." : "Sim, Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

