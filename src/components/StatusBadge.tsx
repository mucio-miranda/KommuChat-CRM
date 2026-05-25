import { Badge } from "@/components/ui/badge";

type PatientStatus = "followup" | "topoucall" | "atendimentofinal" | "cancelou_agendamento" | "novo";

interface StatusBadgeProps {
  status: PatientStatus;
  className?: string;
}

const statusConfig = {
  novo: {
    label: "Novo",
    className: "bg-muted text-muted-foreground border-border"
  },
  followup: {
    label: "Em contato",
    className: "bg-primary/10 text-primary border-primary/20"
  },
  topoucall: {
    label: "Agendado",
    className: "bg-success/10 text-success border-success/20"
  },
  cancelou_agendamento: {
    label: "Cancelado",
    className: "bg-primary/10 text-primary border-primary/20"
  },
  atendimentofinal: {
    label: "Desativado",
    className: "bg-muted text-muted-foreground border-border"
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.novo;
  
  return (
    <Badge 
      variant="outline" 
      className={`status-badge ${config.className} ${className || ""}`}
    >
      {config.label}
    </Badge>
  );
}