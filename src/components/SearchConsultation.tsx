import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Calendar, Clock, MapPin, X } from 'lucide-react';

interface Appointment {
  id: string;
  title: string;
  time: string;
  patient: string;
  description?: string;
  location?: string;
  googleEvent?: any;
}

interface SearchConsultationProps {
  onSearch?: (query: string) => void;
  appointments?: Appointment[];
  className?: string;
}

const parseEventDate = (start: { dateTime?: string; date?: string }): Date => {
  if (start.dateTime) return new Date(start.dateTime);
  if (start.date) {
    const [year, month, day] = start.date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
};

export function SearchConsultation({ onSearch, appointments = [], className }: SearchConsultationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch?.('');
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getEventDate = (appointment: Appointment) =>
    appointment.googleEvent?.start ? parseEventDate(appointment.googleEvent.start) : new Date();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showResults = isFocused && searchQuery.trim().length > 0;

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Pesquisar consulta..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setIsFocused(true)}
          className="w-full h-9 pl-9 pr-8 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            {appointments.length > 0 ? (
              appointments.map((appointment) => {
                const eventDate = getEventDate(appointment);
                return (
                  <div
                    key={appointment.id}
                    className="px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">
                        {appointment.title}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2 flex-shrink-0">
                        <Calendar className="h-3 w-3" />
                        {formatDate(eventDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {appointment.patient && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">{appointment.patient}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {appointment.time}
                      </span>
                      {appointment.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{appointment.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhuma consulta encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
