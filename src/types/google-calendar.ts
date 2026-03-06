// Tipos para Google Calendar
export interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  recurringEventId?: string;
  recurrence?: string[];
  // Campos adicionais para eventos com informações de agenda
  calendarId?: string;
  calendarSummary?: string;
  calendarColor?: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
  primary?: boolean;
}

export interface GoogleCalendarListResponse {
  kind: string;
  etag: string;
  nextSyncToken?: string;
  items: GoogleCalendar[];
}

export interface GoogleCalendarEventsResponse {
  kind: string;
  etag: string;
  summary?: string;
  description?: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  defaultReminders: Array<{
    method: string;
    minutes: number;
  }>;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleCalendarEvent[];
}





