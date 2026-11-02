import { create } from 'zustand';
import { TimetableSlot, DayOfWeek } from '@/types';
import { timetableRepository, dataAccessLayer } from '@/lib/storage/dal';
import { SEED_DATA } from '@/constants/seedData';

export interface TimetableState {
  slots: TimetableSlot[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'week' | 'agenda';
  selectedDay: DayOfWeek;

  // Actions
  loadSlots: () => Promise<void>;
  setViewMode: (mode: 'week' | 'agenda') => void;
  setSelectedDay: (day: DayOfWeek) => void;
  clearError: () => void;

  addSlot: (slot: TimetableSlot) => Promise<TimetableSlot>;
  updateSlot: (id: string, updates: Partial<TimetableSlot>) => Promise<TimetableSlot>;
  deleteSlot: (id: string) => Promise<void>;
}

// Compute today's day of week: Monday is 1, Sunday is 7
export function getTodayDayOfWeek(): DayOfWeek {
  const day = new Date().getDay(); // 0 is Sunday, 1 is Monday... 6 is Saturday
  return (day === 0 ? 7 : day) as DayOfWeek;
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  slots: SEED_DATA.data.timetable,
  isLoading: false,
  error: null,
  viewMode: 'week',
  selectedDay: getTodayDayOfWeek(),

  clearError: () => set({ error: null }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedDay: (selectedDay) => set({ selectedDay }),

  loadSlots: async () => {
    set({ isLoading: true, error: null });
    try {
      await dataAccessLayer.initializeSeedDataIfNeeded();
      const fetchedSlots = await timetableRepository.getAll();
      set({
        slots: fetchedSlots.length > 0 ? fetchedSlots : SEED_DATA.data.timetable,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load timetable from offline storage';
      set({ error: msg, isLoading: false });
    }
  },

  addSlot: async (newSlot: TimetableSlot) => {
    const previous = get().slots;
    // Optimistic UI update
    set({ slots: [...previous, newSlot], error: null });

    try {
      await timetableRepository.create(newSlot);
      return newSlot;
    } catch (err: unknown) {
      // Rollback
      const msg = err instanceof Error ? err.message : 'Failed to schedule class slot';
      set({ slots: previous, error: msg });
      throw err;
    }
  },

  updateSlot: async (id: string, updates: Partial<TimetableSlot>) => {
    const previous = get().slots;
    const existing = previous.find((s) => s.id === id);
    if (!existing) {
      throw new Error(`Timetable slot with id ${id} not found`);
    }

    const updatedSlot: TimetableSlot = { ...existing, ...updates };

    // Optimistic UI update
    set({
      slots: previous.map((s) => (s.id === id ? updatedSlot : s)),
      error: null,
    });

    try {
      await timetableRepository.update(id, updates);
      return updatedSlot;
    } catch (err: unknown) {
      // Rollback
      const msg = err instanceof Error ? err.message : 'Failed to update class slot';
      set({ slots: previous, error: msg });
      throw err;
    }
  },

  deleteSlot: async (id: string) => {
    const previous = get().slots;
    // Optimistic UI update
    set({
      slots: previous.filter((s) => s.id !== id),
      error: null,
    });

    try {
      await timetableRepository.delete(id);
    } catch (err: unknown) {
      // Rollback
      const msg = err instanceof Error ? err.message : 'Failed to remove class slot';
      set({ slots: previous, error: msg });
      throw err;
    }
  },
}));
