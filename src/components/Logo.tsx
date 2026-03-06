import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/kommuchat_logo dark.svg" : "/kommuchat_logo.svg";

  return (
    <div className={cn("flex items-center justify-start", sizeClasses[size], className)}>
      <img 
        src={logoSrc} 
        alt="KommuChat Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
