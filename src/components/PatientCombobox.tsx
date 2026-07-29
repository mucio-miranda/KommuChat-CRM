import { useState } from "react";
import { Check, ChevronsUpDown, User, X, Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Patient } from "@/types/patient";
import { formatPhone } from "@/hooks/usePatientsSearch";

interface PatientComboboxProps {
  patients: Patient[];
  value?: { id: number; fonte: 'ia' | 'humano' } | null;
  onSelect: (patient: Patient | null) => void;
  disabled?: boolean;
  loading?: boolean;
  onCreatePatient?: () => void;
  onEditPatient?: (patient: Patient) => void;
}

export function PatientCombobox({
  patients,
  value,
  onSelect,
  disabled = false,
  loading = false,
  onCreatePatient,
  onEditPatient,
}: PatientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedPatient = value
    ? patients.find(p => p.id === value.id && p.fonte === value.fonte)
    : null;

  const filteredPatients = patients.filter(patient => {
    const search = searchQuery.toLowerCase();
    return (
      patient.nome?.toLowerCase().includes(search) ||
      patient.email?.toLowerCase().includes(search) ||
      patient.telefone?.includes(search)
    );
  });

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
              <span className="text-muted-foreground">Selecionar paciente</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {selectedPatient && !disabled && !loading && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
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
                    className="cursor-pointer rounded-md hover:bg-accent aria-selected:bg-accent data-[selected='true']:bg-accent transition-colors"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-primary shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 overflow-hidden gap-0.5">
                      <span className="font-medium truncate text-sm text-foreground">{patient.nome}</span>
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
                    {onEditPatient && (
                      <button
                        type="button"
                        className="ml-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                        title="Editar paciente"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpen(false);
                          onEditPatient(patient);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>

          {onCreatePatient && (
            <div className="border-t p-1">
              <button
                type="button"
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-primary rounded-md hover:bg-muted transition-colors"
                onClick={() => {
                  setOpen(false);
                  setSearchQuery("");
                  onCreatePatient();
                }}
              >
                <Plus className="h-4 w-4" />
                Novo Paciente
              </button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
