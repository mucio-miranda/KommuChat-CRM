import { LucideIcon, ChevronUp, ChevronDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  trend?: number;
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  trend,
  icon: Icon,
  description 
}: MetricCardProps) {
  const isPositive = changeType === "positive" || (trend !== undefined && trend >= 0);

  return (
    <div className="metric-card group cursor-default flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[hsl(var(--tertiary))] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground leading-tight">
          {title}
        </p>
        <p className="text-2xl font-bold text-foreground leading-tight">
          {value}
        </p>
      </div>

      {trend !== undefined && (
        <div className={`flex items-center gap-0.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
          isPositive
            ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
            : "bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))]"
        }`}>
          {isPositive ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
}
