import { create } from 'zustand';
import { Note } from '@/types';
import { noteRepository, dataAccessLayer } from '@/lib/storage/dal';
import { getDatabaseMode } from '@/lib/storage/db';
import { SEED_DATA } from '@/constants/seedData';

export interface NoteState {
  notes: Note[];
  activeNoteId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  loadNotes: () => Promise<void>;
  setActiveNoteId: (id: string | null) => void;
  createNote: (input: {
    title: string;
    content?: string;
    courseId?: string | null;
    tags?: string[];
    isPinned?: boolean;
    id?: string;
  }) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: typeof window !== 'undefined' && getDatabaseMode() === 'real' ? [] : SEED_DATA.data.notes,
  activeNoteId: typeof window !== 'undefined' && getDatabaseMode() === 'real' ? null : (SEED_DATA.data.notes[0]?.id || null),
  isLoading: false,
  isSaving: false,
  error: null,

  clearError: () => set({ error: null }),

  setActiveNoteId: (id: string | null) => set({ activeNoteId: id }),

  loadNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      await dataAccessLayer.initializeSeedDataIfNeeded();
      const fetched = await noteRepository.getAll();
      const notesList = fetched;

      // Sort pinned notes first, then latest updatedAt
      const sorted = [...notesList].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      set({
        notes: sorted,
        activeNoteId: get().activeNoteId || sorted[0]?.id || null,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load notes from offline storage';
      set({ error: msg, isLoading: false });
    }
  },

  createNote: async (input) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: input.id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: input.title.trim() || 'Untitled Note',
      content: input.content || '',
      courseId: input.courseId || null,
      tags: input.tags || [],
      isPinned: !!input.isPinned,
      createdAt: now,
      updatedAt: now,
    };

    const previous = get().notes;
    // Optimistic insert (pinned sorted to top if pinned)
    const updatedList = [newNote, ...previous].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    set({ notes: updatedList, activeNoteId: newNote.id, error: null });

    try {
      await noteRepository.create(newNote);
      return newNote;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save note';
      set({ notes: previous, error: msg });
      throw err;
    }
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    const previous = get().notes;
    const target = previous.find((n) => n.id === id);
    if (!target) {
      throw new Error(`Note ${id} not found`);
    }

    const now = new Date().toISOString();
    const updatedNote: Note = {
      ...target,
      ...updates,
      updatedAt: now,
    };

    const updatedList = previous.map((n) => (n.id === id ? updatedNote : n)).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    set({ notes: updatedList, isSaving: true, error: null });

    try {
      await noteRepository.update(id, { ...updates, updatedAt: now });
      set({ isSaving: false });
      return updatedNote;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update note in offline storage';
      set({ notes: previous, isSaving: false, error: msg });
      throw err;
    }
  },

  deleteNote: async (id: string) => {
    const previous = get().notes;
    const currentActiveId = get().activeNoteId;
    const remaining = previous.filter((n) => n.id !== id);

    let nextActiveId = currentActiveId;
    if (currentActiveId === id) {
      nextActiveId = remaining.length > 0 ? remaining[0].id : null;
    }

    set({ notes: remaining, activeNoteId: nextActiveId, error: null });

    try {
      await noteRepository.delete(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete note from offline storage';
      set({ notes: previous, activeNoteId: currentActiveId, error: msg });
      throw err;
    }
  },

  togglePin: async (id: string) => {
    const target = get().notes.find((n) => n.id === id);
    if (!target) return;
    await get().updateNote(id, { isPinned: !target.isPinned });
  },
}));

