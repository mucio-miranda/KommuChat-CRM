import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-lg shadow-none border-[#EEEEEE] text-foreground transition-colors duration-200 hover:text-primary hover:bg-accent/10 hover:[background-image:none] dark:bg-[#292929] dark:text-white dark:border-[#292929] dark:hover:bg-white/10 dark:hover:text-primary"
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
