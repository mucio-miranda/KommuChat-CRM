import { Badge } from "@/components/ui/badge";

type PatientStatus = "followup" | "topoucall" | "atendimentofinal" | "cancelou_agendamento" | "novo";

interface StatusBadgeProps {
  status: PatientStatus;
  className?: string;
}

const statusConfig = {
  novo: {
    label: "Novo",
    className: "bg-accent/10 text-accent border-accent/20"
  },
  followup: {
    label: "Follow-up",
    className: "bg-primary/10 text-primary border-primary/20"
  },
  topoucall: {
    label: "Agendado",
    className: "bg-success/10 text-success border-success/20"
  },
  cancelou_agendamento: {
    label: "Cancelou Agendamento",
    className: "bg-red-100 text-red-800 border-red-200"
  },
  atendimentofinal: {
    label: "Concluído",
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