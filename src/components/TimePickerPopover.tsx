import { useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Gera slots de 07:00 a 21:00 em intervalos de 30 minutos
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 7; h <= 21; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 21) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();

interface TimePickerPopoverProps {
  value?: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimePickerPopover({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecione um horário",
}: TimePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = TIME_SLOTS.filter((t) => t.includes(search));

  const handleSelect = (time: string) => {
    onChange(time);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal border-input text-foreground hover:bg-accent hover:text-accent-foreground shadow-none",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4 shrink-0" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar horário..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-60">
            <CommandEmpty>Nenhum horário encontrado.</CommandEmpty>
            <CommandGroup>
              {filtered.map((time) => (
                <CommandItem
                  key={time}
                  value={time}
                  onSelect={() => handleSelect(time)}
                  className={cn(
                    "cursor-pointer rounded-md hover:bg-accent transition-colors",
                    value === time && "bg-accent font-medium"
                  )}
                >
                  {time}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
