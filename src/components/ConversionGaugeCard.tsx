import { useState, useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";

interface ConversionGaugeCardProps {
  percentage: number;
}

function SemiCircleGauge({ percentage }: { percentage: number }) {
  const size = 200;
  const strokeWidth = 18;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const radius = (size - strokeWidth) / 2 - 5;
  const arcLength = Math.PI * radius;

  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [dashOffset, setDashOffset] = useState(arcLength);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current && percentage === animatedPercent) return;
    hasAnimated.current = true;

    const targetOffset = arcLength - (percentage / 100) * arcLength;
    requestAnimationFrame(() => {
      setDashOffset(targetOffset);
    });

    const duration = 1200;
    const startTime = performance.now();
    const startVal = animatedPercent;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (percentage - startVal) * eased);
      setAnimatedPercent(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [percentage]);

  const startAngle = 180;
  const totalSweep = 180;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  };

  const describeArc = (start: number, sweep: number) => {
    if (sweep <= 0) return "";
    const endAng = start - sweep;
    const startPoint = polarToCartesian(start);
    const endPoint = polarToCartesian(endAng);
    const largeArcFlag = sweep > 180 ? 1 : 0;
    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`;
  };

  const trackPath = describeArc(startAngle, totalSweep);
  const fullArcPath = describeArc(startAngle, totalSweep);

  return (
    <div className="relative" style={{ width: size, height: size * 0.6 }}>
      <svg
        width={size}
        height={size * 0.65}
        viewBox={`0 0 ${size} ${size * 0.65}`}
        className="overflow-visible"
      >
        <path
          d={trackPath}
          fill="none"
          stroke="hsl(var(--tertiary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {percentage > 0 && (
          <path
            d={fullArcPath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        )}
      </svg>
      <div
        className="absolute inset-0 flex items-end justify-center"
        style={{ paddingBottom: "2px" }}
      >
        <span className="text-[42px] font-bold text-foreground leading-none">
          {animatedPercent}%
        </span>
      </div>
    </div>
  );
}

export function ConversionGaugeCard({ percentage }: ConversionGaugeCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--tertiary))] flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Conversão de Consultas</h3>
          <p className="text-xs text-muted-foreground">Por IA</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-2">
        <SemiCircleGauge percentage={percentage} />
      </div>
    </div>
  );
}
