export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'q1' | 'q2' | 'q3' | 'q4' | 'high' | 'medium' | 'low';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  role?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  energy?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  canvasData?: string;
  coverStyle?: string;
  pageColor?: string; // NOVO: Cor de fundo do caderno
  localPresets?: string; // NOVO: Presets de texto exclusivos desta nota
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  linkedTaskId?: string;
}

export interface HistoryEntry {
  id: string;
  type: 'note' | 'task';
  action: 'create' | 'update' | 'delete' | 'restore' | 'complete';
  entityId: string;
  data: Partial<Task> | Partial<Note> | null;
  timestamp: string;
}

export interface TasksData { tasks: Task[]; }
export interface NotesData { notes: Note[]; }
export interface HistoryData { history: HistoryEntry[]; }

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
  hangoutLink?: string;
  extendedProps?: {
    hasMeet?: boolean;
    meetLink?: string;
    isHoliday?: boolean;
    role?: string;
    calendarId?: string;
  };
}

export interface CalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor: string;
  foregroundColor: string;
}

export interface User {
  email: string;
  name: string;
  picture?: string;
}