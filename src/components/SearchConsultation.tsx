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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          Procurar Consulta
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Nome do paciente, título ou descrição"
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 text-sm border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Lista de resultados */}
        {searchQuery.trim() && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {appointments.length > 0 ? (
              appointments.map((appointment) => {
                const eventDate = getEventDate(appointment);
                return (
                  <div
                    key={appointment.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                        {appointment.title}
                      </h4>
                      <div className="flex items-center text-xs text-muted-foreground ml-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(eventDate)}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {appointment.patient && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="h-3 w-3 mr-1" />
                          {appointment.patient}
                        </div>
                      )}
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {appointment.time}
                      </div>
                      
                      {appointment.location && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {appointment.location}
                        </div>
                      )}
                      
                      {appointment.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {appointment.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Nenhuma consulta encontrada para "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
