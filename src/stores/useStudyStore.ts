import { create } from 'zustand';
import { StudySession, PomodoroSettings } from '@/types';
import { studyRepository, settingsRepository, dataAccessLayer } from '@/lib/storage/dal';
import { SEED_DATA } from '@/constants/seedData';
import { DEFAULT_POMODORO_SETTINGS } from '@/features/study/utils/timerEngine';

export interface StudyState {
  sessions: StudySession[];
  settings: PomodoroSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSessions: () => Promise<void>;
  addSession: (session: StudySession) => Promise<StudySession>;
  updateSession: (id: string, updates: Partial<StudySession>) => Promise<StudySession>;
  deleteSession: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<PomodoroSettings>) => void;
  clearError: () => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  sessions: SEED_DATA.data.studySessions,
  settings: DEFAULT_POMODORO_SETTINGS,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  loadSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      await dataAccessLayer.initializeSeedDataIfNeeded();
      const [fetchedSessions, userSettings] = await Promise.all([
        studyRepository.getAll(),
        Promise.resolve(settingsRepository.get()),
      ]);

      set({
        sessions: fetchedSessions.length > 0 ? fetchedSessions : SEED_DATA.data.studySessions,
        settings: userSettings?.pomodoro || DEFAULT_POMODORO_SETTINGS,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load study sessions';
      set({ error: msg, isLoading: false });
    }
  },

  updateSettings: (newSettings: Partial<PomodoroSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...newSettings };
    set({ settings: updated });

    try {
      settingsRepository.update({ pomodoro: updated });
    } catch {
      // LocalStorage error handled safely
    }
  },

  addSession: async (newSession: StudySession) => {
    const previous = get().sessions;

    // Prevent duplicate records with same ID
    if (previous.some((s) => s.id === newSession.id)) {
      return newSession;
    }

    set({ sessions: [newSession, ...previous], error: null });

    try {
      await studyRepository.create(newSession);
      return newSession;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save study session to offline storage';
      set({ sessions: previous, error: msg });
      throw err;
    }
  },

  updateSession: async (id: string, updates: Partial<StudySession>) => {
    const previous = get().sessions;
    const target = previous.find((s) => s.id === id);
    if (!target) {
      throw new Error(`Study session ${id} not found`);
    }

    const updatedSession = { ...target, ...updates };
    set({
      sessions: previous.map((s) => (s.id === id ? updatedSession : s)),
      error: null,
    });

    try {
      await studyRepository.update(id, updates);
      return updatedSession;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update study session';
      set({ sessions: previous, error: msg });
      throw err;
    }
  },

  deleteSession: async (id: string) => {
    const previous = get().sessions;
    set({
      sessions: previous.filter((s) => s.id !== id),
      error: null,
    });

    try {
      await studyRepository.delete(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete study session';
      set({ sessions: previous, error: msg });
      throw err;
    }
  },
}));
