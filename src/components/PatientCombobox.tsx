import { useState } from "react";
import { Check, ChevronsUpDown, User, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/types/patient";
import { formatPhone } from "@/hooks/usePatientsSearch";

interface PatientComboboxProps {
  patients: Patient[];
  value?: { id: number; fonte: 'ia' | 'humano' } | null;
  onSelect: (patient: Patient | null) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PatientCombobox({
  patients,
  value,
  onSelect,
  disabled = false,
  loading = false,
}: PatientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  console.log('🔍 PatientCombobox: Total de pacientes recebidos:', patients.length);

  // Encontrar o paciente selecionado
  const selectedPatient = value 
    ? patients.find(p => p.id === value.id && p.fonte === value.fonte)
    : null;

  // Filtrar pacientes baseado na busca
  const filteredPatients = patients.filter(patient => {
    const search = searchQuery.toLowerCase();
    return (
      patient.nome?.toLowerCase().includes(search) ||
      patient.email?.toLowerCase().includes(search) ||
      patient.telefone?.includes(search)
    );
  });
  
  console.log('🔍 PatientCombobox: Pacientes após filtro de busca:', filteredPatients.length);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          tabIndex={0}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer transition-colors",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            (disabled || loading) && "cursor-not-allowed opacity-50"
          )}
          onClick={() => !disabled && !loading && setOpen(!open)}
          onKeyDown={(e) => {
            if (!disabled && !loading && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setOpen(!open);
            }
          }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <User className="h-4 w-4 shrink-0" />
            {loading ? (
              <span className="text-muted-foreground">Carregando pacientes...</span>
            ) : selectedPatient ? (
              <span className="truncate">
                {selectedPatient.nome} - {formatPhone(selectedPatient.telefone)}
              </span>
            ) : (
              <span className="text-muted-foreground">Selecionar paciente (opcional)</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {selectedPatient && !disabled && !loading && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-10"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar paciente por nome, email ou telefone..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredPatients.map((patient) => {
                const isSelected = 
                  selectedPatient?.id === patient.id && 
                  selectedPatient?.fonte === patient.fonte;
                
                return (
                  <CommandItem
                    key={`${patient.fonte}-${patient.id}`}
                    value={`${patient.fonte}-${patient.id}`}
                    onSelect={() => {
                      onSelect(isSelected ? null : patient);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className="cursor-pointer !hover:bg-gray-100 !dark:hover:bg-gray-800 !aria-selected:bg-gray-100 !dark:aria-selected:bg-gray-800 hover:text-foreground aria-selected:text-foreground data-[selected='true']:bg-gray-100"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-primary",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 overflow-hidden gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate text-sm text-foreground">{patient.nome}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <span>{formatPhone(patient.telefone)}</span>
                        {patient.email && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="truncate">{patient.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
