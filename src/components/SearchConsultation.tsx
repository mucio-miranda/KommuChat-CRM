import React, { useState } from 'react';
import { Search, User, Calendar, Clock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export function SearchConsultation({ onSearch, appointments = [], className }: SearchConsultationProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEventDate = (appointment: Appointment) => {
    if (appointment.googleEvent?.start?.dateTime) {
      return new Date(appointment.googleEvent.start.dateTime);
    } else if (appointment.googleEvent?.start?.date) {
      return new Date(appointment.googleEvent.start.date);
    }
    return new Date();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-1.5">
        <CardTitle className="text-xs font-semibold text-foreground">
          Procurar Consulta
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Nome do paciente, título..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Lista de resultados */}
        {searchQuery.trim() && (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {appointments.length > 0 ? (
              appointments.map((appointment) => {
                const eventDate = getEventDate(appointment);
                return (
                  <div
                    key={appointment.id}
                    className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-xs text-foreground line-clamp-1">
                        {appointment.title}
                      </h4>
                      <div className="flex items-center text-xs text-muted-foreground ml-1.5">
                        <Calendar className="h-2.5 w-2.5 mr-0.5" />
                        {formatDate(eventDate)}
                      </div>
                    </div>
                    
                    <div className="space-y-0.5">
                      {appointment.patient && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="h-2.5 w-2.5 mr-0.5" />
                          <span className="truncate">{appointment.patient}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {appointment.time}
                      </div>
                      
                      {appointment.location && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5 mr-0.5" />
                          <span className="truncate">{appointment.location}</span>
                        </div>
                      )}
                      
                      {appointment.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {appointment.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-muted-foreground text-xs">
                Nenhuma consulta encontrada para "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
