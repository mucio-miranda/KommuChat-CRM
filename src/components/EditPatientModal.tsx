import { useState, useEffect } from "react";
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
import { Patient } from "@/types/patient";

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientUpdated: () => void;
  iaTableName: string;
  patient: Patient | null;
}

export function EditPatientModal({ isOpen, onClose, onPatientUpdated, iaTableName, patient }: EditPatientModalProps) {
  const [formData, setFormData] = useState({ nome: "", email: "", telefone: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { read: supabase } = useSupabase();

  useEffect(() => {
    if (patient && isOpen) {
      setFormData({
        nome: patient.nome || "",
        email: patient.email || "",
        telefone: patient.telefone || "",
      });
    }
  }, [patient, isOpen]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    if (!supabase || !patient) {
      toast({ title: "Erro", description: "Erro de conexão com o banco de dados", variant: "destructive" });
      return;
    }

    const telefone = formData.telefone.trim() || null;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from(iaTableName)
        .update({
          nome: formData.nome.trim(),
          email: formData.email.trim() || null,
          telefone,
          chatid: telefone,
        })
        .eq('id', patient.id);

      if (error) {
        toast({ title: "Erro", description: "Não foi possível atualizar o paciente", variant: "destructive" });
        return;
      }

      toast({ title: "Sucesso", description: "Paciente atualizado com sucesso!" });
      onClose();
      onPatientUpdated();
    } catch {
      toast({ title: "Erro", description: "Erro inesperado ao atualizar paciente", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Editar Paciente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome Completo *
            </Label>
            <Input
              id="edit-nome"
              placeholder="Digite o nome completo"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-telefone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone
            </Label>
            <Input
              id="edit-telefone"
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => handleInputChange("telefone", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
