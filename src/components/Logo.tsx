import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-16 h-6",
  md: "w-40 h-14", 
  lg: "w-32 h-12",
  xl: "w-40 h-16"
};

export function Logo({ 
  size = "md", 
  className
}: LogoProps) {
  return (
    <div className={cn("flex items-center justify-start", sizeClasses[size], className)}>
      <img 
        src="/kommuchat_logo.svg" 
        alt="KommuChat Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
