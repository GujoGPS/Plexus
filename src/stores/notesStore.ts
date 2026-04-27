import { create } from 'zustand';
import { Note } from '../types';
import { driveService } from '../modules/drive/DriveService';
import { v4 as uuidv4 } from 'uuid';

interface NotesState {
  notes: Note[];
  selectedNoteId: string | null;
  isLoading: boolean;
  error: string | null;
  loadNotes: () => Promise<void>;
  addNote: (noteData: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (id: string | null) => void;
  restoreNote: (historyEntryId: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  selectedNoteId: null,
  isLoading: false,
  error: null,

  loadNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const notes = await driveService.loadNotes();
      set({ notes, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to load notes' });
    }
  },

  addNote: async (noteData) => {
    const newNote: Note = {
      id: uuidv4(),
      title: noteData.title || 'Novo Caderno',
      content: noteData.content || '',
      canvasData: noteData.canvasData || '',
      coverStyle: noteData.coverStyle || 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: noteData.tags || [],
      linkedTaskId: noteData.linkedTaskId,
    };

    const { notes } = get();
    const updatedNotes = [...notes, newNote];

    set({ notes: updatedNotes, selectedNoteId: newNote.id });

    try {
      await driveService.saveNotes(updatedNotes);
      await driveService.addHistoryEntry('note', 'create', newNote.id, newNote);
    } catch (error) {
      console.error(error);
    }
    return newNote;
  },

  updateNote: async (id, updates) => {
    const { notes } = get();
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex === -1) return;

    const oldNote = { ...notes[noteIndex] };
    const updatedNote = { ...notes[noteIndex], ...updates, updatedAt: new Date().toISOString() };

    const updatedNotes = [...notes];
    updatedNotes[noteIndex] = updatedNote;

    set({ notes: updatedNotes });

    try {
      await driveService.saveNotes(updatedNotes);
      await driveService.addHistoryEntry('note', 'update', id, { old: oldNote, new: updatedNote });
    } catch (error) {
      console.error('Failed to update note');
    }
  },

  deleteNote: async (id) => {
    const { notes, selectedNoteId } = get();
    const note = notes.find(n => n.id === id);
    const filtered = notes.filter(n => n.id !== id);

    set({ notes: filtered, selectedNoteId: selectedNoteId === id ? null : selectedNoteId });

    try {
      await driveService.saveNotes(filtered);
      if (note) await driveService.addHistoryEntry('note', 'delete', id, note);
    } catch (error) {
      console.error('Failed to delete note');
    }
  },

  selectNote: (id) => set({ selectedNoteId: id }),

  restoreNote: async (historyEntryId) => {
    // Mantido para compatibilidade de histórico futura
  },
}));