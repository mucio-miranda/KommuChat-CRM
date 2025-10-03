import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon,
  description 
}: MetricCardProps) {
  const changeColors = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground"
  };

  return (
    <Card className="metric-card group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground mb-2">
            {value}
          </p>
          {change && (
            <p className={`text-sm ${changeColors[changeType]} flex items-center gap-1`}>
              <span>{change}</span>
              {description && (
                <span className="text-muted-foreground">vs. período anterior</span>
              )}
            </p>
          )}
        </div>
        
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 group-hover:shadow-kommu transition-smooth">
          <Icon className="w-5 h-5 text-[#E21929]" />
        </div>
      </div>
    </Card>
  );
}