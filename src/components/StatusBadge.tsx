import { Badge } from "@/components/ui/badge";

type PatientStatus = "followup" | "atende_humano" | "topoucall" | "atendimentofinal" | "novo";

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
  atende_humano: {
    label: "Atendimento Humano",
    className: "bg-warning/10 text-warning border-warning/20"
  },
  topoucall: {
    label: "Agendado",
    className: "bg-success/10 text-success border-success/20"
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