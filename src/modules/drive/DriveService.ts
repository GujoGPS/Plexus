import { TasksData, NotesData, HistoryData, Task, Note, HistoryEntry } from '../../types';
import { authService } from '../auth/AuthService';
import { v4 as uuidv4 } from 'uuid';

const APP_DATA_FOLDER = 'appDataFolder';

const FILES = {
  tasks: 'tasks.json',
  notes: 'notes.json',
  history: 'history_log.json',
} as const;

type FileName = typeof FILES[keyof typeof FILES];

export class DriveService {
  private cache: Map<string, string> = new Map();

  private getAccessToken(): string {
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    return token;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: object
  ): Promise<T> {
    const token = this.getAccessToken();
    const response = await fetch(`https://www.googleapis.com${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async getFileId(fileName: FileName): Promise<string | null> {
    // CORREÇÃO APLICADA: query formatada com q= e spaces=appDataFolder
    const query = `name='${fileName}' and '${APP_DATA_FOLDER}' in parents and trashed=false`;
    
    const response = await this.request<{
      files: { id: string; name: string }[];
    }>(
      'GET', 
      `/drive/v3/files?q=${encodeURIComponent(query)}&spaces=appDataFolder`
    );

    return response.files[0]?.id || null;
  }

  private async createFile(fileName: FileName, content: object): Promise<string> {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: [APP_DATA_FOLDER],
      mimeType: 'application/json',
    };

    const metadataString = JSON.stringify(metadata);
    const contentString = JSON.stringify(content, null, 2);

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadataString +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      contentString +
      closeDelimiter;

    const token = this.getAccessToken();
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: multipartBody,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create file');
    }

    const result = await response.json();
    return result.id;
  }

  private async updateFile(fileId: string, content: object): Promise<void> {
    const token = this.getAccessToken();
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content, null, 2),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update file');
    }
  }

  private async readFile(fileName: FileName): Promise<string | null> {
    if (this.cache.has(fileName)) {
      return this.cache.get(fileName) || null;
    }

    const fileId = await this.getFileId(fileName);
    if (!fileId) {
      return null;
    }

    try {
      const token = this.getAccessToken();
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        return null;
      }

      const content = await response.text();
      this.cache.set(fileName, content);
      return content;
    } catch {
      return null;
    }
  }

  private async saveFile(fileName: FileName, content: object): Promise<void> {
    const existingId = await this.getFileId(fileName);
    const contentStr = JSON.stringify(content, null, 2);

    if (existingId) {
      await this.updateFile(existingId, content);
    } else {
      await this.createFile(fileName, content);
    }

    this.cache.set(fileName, contentStr);
  }

  // Tasks
  async loadTasks(): Promise<Task[]> {
    const content = await this.readFile(FILES.tasks);
    if (!content) {
      return [];
    }

    try {
      const data: TasksData = JSON.parse(content);
      return data.tasks || [];
    } catch {
      return [];
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await this.saveFile(FILES.tasks, { tasks });
  }

  // Notes
  async loadNotes(): Promise<Note[]> {
    const content = await this.readFile(FILES.notes);
    if (!content) {
      return [];
    }

    try {
      const data: NotesData = JSON.parse(content);
      return data.notes || [];
    } catch {
      return [];
    }
  }

  async saveNotes(notes: Note[]): Promise<void> {
    await this.saveFile(FILES.notes, { notes });
  }

  // History
  async loadHistory(): Promise<HistoryEntry[]> {
    const content = await this.readFile(FILES.history);
    if (!content) {
      return [];
    }

    try {
      const data: HistoryData = JSON.parse(content);
      return data.history || [];
    } catch {
      return [];
    }
  }

  async saveHistory(history: HistoryEntry[]): Promise<void> {
    await this.saveFile(FILES.history, { history });
  }

  async addHistoryEntry(
    type: 'note' | 'task',
    action: HistoryEntry['action'],
    entityId: string,
    data: object | null
  ): Promise<void> {
    const history = await this.loadHistory();
    const entry: HistoryEntry = {
      id: uuidv4(),
      type,
      action,
      entityId,
      data,
      timestamp: new Date().toISOString(),
    };

    history.unshift(entry);

    // Keep only last 1000 entries
    const trimmed = history.slice(0, 1000);
    await this.saveHistory(trimmed);
  }

  clearCache(): void {
    this.cache.clear();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('GET', '/drive/v3/about?fields=user');
      return true;
    } catch {
      return false;
    }
  }
}

export const driveService = new DriveService();