import { useState } from "react";
import { X, Save, User, Mail, Phone, FileText } from "lucide-react";
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
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: () => void;
}

interface NewPatientData {
  nome: string;
  email: string;
  telefone: string;
  status: string;
  observacoes: string;
}

export function NewPatientModal({ isOpen, onClose, onPatientAdded }: NewPatientModalProps) {
  const [formData, setFormData] = useState<NewPatientData>({
    nome: "",
    email: "",
    telefone: "",
    status: "novo",
    observacoes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { write: supabaseWrite } = useSupabase();
  const { user } = useAuth();

  const handleInputChange = (field: keyof NewPatientData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!supabaseWrite) {
      toast({
        title: "Erro",
        description: "Erro de conexão com o banco de dados",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar pacientes",
        variant: "destructive",
      });
      return;
    }

    console.log('🔍 Debug - Criando paciente:', {
      nome: formData.nome.trim(),
      email: formData.email.trim() || null,
      telefone: formData.telefone.trim() || null,
      status: formData.status,
      observacoes: formData.observacoes.trim() || null,
      cliente_id: user.id,
      user_id: user.id,
      user_email: user.email
    });

    setIsLoading(true);

    try {
      const { data, error } = await supabaseWrite
        .from('pacientes_manuais')
        .insert([{
          nome: formData.nome.trim(),
          email: formData.email.trim() || null,
          telefone: formData.telefone.trim() || null,
          status: formData.status,
          observacoes: formData.observacoes.trim() || null,
          cliente_id: user.id
        }])
        .select();

      if (error) {
        console.error('Erro ao criar paciente:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o paciente",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Paciente criado com sucesso!",
      });

      // Limpar formulário
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        status: "novo",
        observacoes: ""
      });

      // Fechar modal e atualizar lista
      onClose();
      onPatientAdded();

    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar paciente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        status: "novo",
        observacoes: ""
      });
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
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Status Inicial
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
                <SelectItem value="atende_humano">Atendimento Humano</SelectItem>
                <SelectItem value="topoucall">Agendado</SelectItem>
                <SelectItem value="atendimentofinal">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Observações
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais sobre o paciente..."
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
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
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
