import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MiniCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MiniCalendar({ selectedDate, onDateSelect, className }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    onDateSelect?.(clickedDate);
  };
  
  const isToday = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {monthNames[currentMonth]}, {currentYear}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekDays.map((day) => (
            <div key={day} className="text-xs text-muted-foreground text-center py-0.5">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-5" />;
            }
            
            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-5 w-5 p-0 text-xs font-normal rounded-full",
                  isToday(day) && "bg-red-500 text-white hover:bg-red-600",
                  isSelected(day) && !isToday(day) && "bg-primary/20 text-primary hover:bg-primary/30",
                  !isToday(day) && !isSelected(day) && "hover:bg-muted"
                )}
                onClick={() => handleDateClick(day)}
              >
                {day}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
