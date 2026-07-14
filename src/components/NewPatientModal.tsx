import { useState } from "react";
import { X, Save, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { normalizePhone } from "@/hooks/usePatientsSearch";
import { Patient } from "@/types/patient";

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: () => void;
  iaTableName: string;
  patients?: Patient[];
}

interface NewPatientData {
  nome: string;
  email: string;
  telefone: string;
}

export function NewPatientModal({ isOpen, onClose, onPatientAdded, iaTableName, patients = [] }: NewPatientModalProps) {
  const [formData, setFormData] = useState<NewPatientData>({
    nome: "",
    email: "",
    telefone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const { toast } = useToast();
  const { read: supabase } = useSupabase();
  const { user } = useAuth();

  const handleInputChange = (field: keyof NewPatientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'telefone') {
      const normalized = value.trim() ? normalizePhone(value.trim()) : null;
      if (normalized) {
        const duplicate = patients.find(p => p.chatid === normalized || p.telefone === normalized);
        setPhoneError(duplicate ? `Já existe um paciente com este contato: ${duplicate.nome}` : null);
      } else {
        setPhoneError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneError) return;

    if (!formData.nome.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    if (!supabase) {
      toast({ title: "Erro", description: "Erro de conexão com o banco de dados", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para criar pacientes", variant: "destructive" });
      return;
    }

    const telefone = formData.telefone.trim() ? normalizePhone(formData.telefone.trim()) : null;
    const highId = Math.floor(10_000_000 + Math.random() * 90_000_000);

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from(iaTableName)
        .insert([{
          id: highId,
          nome: formData.nome.trim(),
          email: formData.email.trim() || null,
          telefone,
          chatid: telefone,
          followup: true,
          follow: 'followup4',
        }])
        .select();

      if (error) {
        console.error('Erro ao criar paciente:', error);
        toast({ title: "Erro", description: "Não foi possível criar o paciente", variant: "destructive" });
        return;
      }

      console.log('Paciente criado:', data);
      toast({ title: "Sucesso", description: "Paciente criado com sucesso!" });

      setFormData({ nome: "", email: "", telefone: "" });
      setPhoneError(null);
      onClose();
      onPatientAdded();

    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      toast({ title: "Erro", description: "Erro inesperado ao criar paciente", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ nome: "", email: "", telefone: "" });
      setPhoneError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Novo Paciente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome Completo *
            </Label>
            <Input
              id="nome"
              placeholder="Digite o nome completo"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone
            </Label>
            <Input
              id="telefone"
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => handleInputChange("telefone", e.target.value)}
              disabled={isLoading}
              className={phoneError ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {phoneError && (
              <p className="text-xs text-destructive">{phoneError}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !!phoneError}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
