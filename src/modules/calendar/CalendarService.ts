import { CalendarInfo, CalendarEvent } from '../../types';
import { authService } from '../auth/AuthService';

const CALENDAR_COLORS = [
  '#3f51b5', '#33b679', '#d50000', '#f6bf26', '#f5511d', '#8e24aa', '#e67c73',
];

const HOLIDAYS_CALENDAR_ID = 'pt.brazilian#holiday@group.v.calendar.google.com';

const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 10) + '-' + Date.now();
};

export class CalendarService {
  private getAccessToken(): string {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Não autenticado no Google');
    return token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    const response = await fetch(`https://www.googleapis.com/calendar/v3${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept-Language': 'pt-BR, pt;q=0.9',
        ...options.headers,
      },
    });

    // Detecção estrita de Sessão Expirada do Google (1 hora)
    if (response.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Erro HTTP ${response.status}`;
      try {
        const errorObj = JSON.parse(errorText);
        errorMessage = errorObj.error?.message || errorMessage;
      } catch (e) { /* fallback */ }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text);
  }

  async getCalendarList(): Promise<CalendarInfo[]> {
    const response = await this.request<{ items: any[] }>('/users/me/calendarList');
    return (response.items || []).map((cal, index) => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary || false,
      backgroundColor: cal.backgroundColor || CALENDAR_COLORS[index % CALENDAR_COLORS.length],
      foregroundColor: cal.foregroundColor || '#ffffff',
    }));
  }

  async getEvents(calendarId: string, timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    const response = await this.request<{ items: any[] }>(
      `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&hl=pt-BR`
    );

    return (response.items || []).map(event => {
      const meetLink = event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri || event.hangoutLink;
      const attendees = event.attendees?.map((a: any) => a.email) || [];
      const role = event.extendedProperties?.private?.role || '';
      
      return {
        id: event.id,
        summary: event.summary || '(Sem título)',
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        colorId: event.colorId || '9',
        hangoutLink: meetLink,
        extendedProps: { hasMeet: !!meetLink, meetLink, attendees, role, calendarId },
      };
    });
  }

  async getHolidays(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    try {
      const response = await this.request<{ items: any[] }>(
        `/calendars/${encodeURIComponent(HOLIDAYS_CALENDAR_ID)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&hl=pt-BR`
      );
      return (response.items || []).map(event => ({
        id: event.id,
        summary: event.summary || '(Feriado)',
        start: event.start,
        end: event.end,
        colorId: '11',
        extendedProps: { hasMeet: false, isHoliday: true, role: '', calendarId: HOLIDAYS_CALENDAR_ID },
      }));
    } catch (error) {
      return [];
    }
  }

  async getCombinedEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    const calendars = await this.getCalendarList();
    if (!calendars.length) return [];

    const personalCalendars = calendars.filter(cal => !cal.id.includes('holiday@group.v.calendar.google.com'));
    const fetchPromises = personalCalendars.map(cal =>
      this.getEvents(cal.id, timeMin, timeMax).catch(() => [])
    );

    fetchPromises.push(this.getHolidays(timeMin, timeMax).catch(() => []));
    const allEventsArrays = await Promise.all(fetchPromises);
    return allEventsArrays.flat();
  }

  private buildEventPayload(params: any) {
    const payload: any = {
      summary: params.summary,
      description: params.description || '',
      location: params.location || '',
      colorId: params.colorId || '9',
      extendedProperties: {
        private: { role: params.role || '' }
      }
    };

    if (params.allDay) {
      payload.start = { date: params.startISO };
      const [y, m, d] = params.endISO.split('-').map(Number);
      const nextDay = new Date(y, m - 1, d + 1);
      const pad = (n: number) => String(n).padStart(2, '0');
      payload.end = { date: `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}` };
    } else {
      payload.start = { dateTime: params.startISO };
      payload.end = { dateTime: params.endISO };
    }

    if (params.attendees && params.attendees.length > 0) {
      payload.attendees = params.attendees.map((email: string) => ({ email }));
    }

    if (params.addMeet) {
      payload.conferenceData = {
        createRequest: {
          requestId: generateRequestId(),
          // O GRANDE BUG DO MEET ESTAVA AQUI: Faltava o "S" de hangoutsMeet! 
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }
    return payload;
  }

  async createEvent(calendarId: string = 'primary', params: any): Promise<CalendarEvent> {
    const payload = this.buildEventPayload(params);
    const sendUpdates = params.attendees && params.attendees.length > 0 ? 'all' : 'none';
    
    const response = await this.request<any>(`/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=${sendUpdates}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const meetLink = response?.hangoutLink || response?.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
    return { ...response, hangoutLink: meetLink, extendedProps: { hasMeet: !!meetLink, meetLink, calendarId } };
  }

  async updateEvent(calendarId: string, eventId: string, params: any): Promise<CalendarEvent> {
    const payload = this.buildEventPayload(params);
    const sendUpdates = params.attendees && params.attendees.length > 0 ? 'all' : 'none';
    
    const response = await this.request<any>(`/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?conferenceDataVersion=1&sendUpdates=${sendUpdates}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    const meetLink = response?.hangoutLink || response?.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
    return { ...response, hangoutLink: meetLink, extendedProps: { hasMeet: !!meetLink, meetLink, calendarId } };
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.request(`/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, { method: 'DELETE' });
  }
}

export const calendarService = new CalendarService();