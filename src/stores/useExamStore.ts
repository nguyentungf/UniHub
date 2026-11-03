import { create } from 'zustand';
import { Exam, ExamType, ExamStatus } from '@/types';
import { examRepository, dataAccessLayer } from '@/lib/storage/dal';
import { getDatabaseMode } from '@/lib/storage/db';
import { SEED_DATA } from '@/constants/seedData';
import { ExamSortOption } from '@/features/exams/utils/examLogic';

export interface ExamState {
  exams: Exam[];
  isLoading: boolean;
  error: string | null;

  // Topic revision checklist persistent UI state
  completedTopics: Record<string, boolean>;

  // UI state
  filterCourseId: string | 'all';
  filterType: ExamType | 'all';
  filterStatus: 'all' | 'upcoming' | 'completed';
  searchQuery: string;
  sortBy: ExamSortOption;
  viewMode: 'timeline' | 'table' | 'calendar';

  // Actions
  loadExams: () => Promise<void>;
  addExam: (exam: Exam) => Promise<Exam>;
  updateExam: (id: string, updates: Partial<Exam>) => Promise<Exam>;
  deleteExam: (id: string) => Promise<void>;
  toggleExamTopic: (topicKey: string) => void;

  setFilterCourseId: (courseId: string | 'all') => void;
  setFilterType: (type: ExamType | 'all') => void;
  setFilterStatus: (status: 'all' | 'upcoming' | 'completed') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: ExamSortOption) => void;
  setViewMode: (viewMode: 'timeline' | 'table' | 'calendar') => void;
  clearError: () => void;
}

const INITIAL_COMPLETED_TOPICS: Record<string, boolean> = {
  'CS201-0': true,
  'CS201-1': true,
  'MATH205-0': true,
};

export const useExamStore = create<ExamState>((set, get) => ({
  exams: typeof window !== 'undefined' && getDatabaseMode() === 'real' ? [] : SEED_DATA.data.exams,
  isLoading: false,
  error: null,
  completedTopics: INITIAL_COMPLETED_TOPICS,

  filterCourseId: 'all',
  filterType: 'all',
  filterStatus: 'all',
  searchQuery: '',
  sortBy: 'examDate_asc',
  viewMode: 'timeline',

  clearError: () => set({ error: null }),
  setFilterCourseId: (filterCourseId) => set({ filterCourseId }),
  setFilterType: (filterType) => set({ filterType }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  setViewMode: (viewMode) => set({ viewMode }),

  toggleExamTopic: (topicKey: string) => {
    set((state) => ({
      completedTopics: {
        ...state.completedTopics,
        [topicKey]: !state.completedTopics[topicKey],
      },
    }));
  },

  loadExams: async () => {
    set({ isLoading: true, error: null });
    try {
      await dataAccessLayer.initializeSeedDataIfNeeded();
      const fetched = await examRepository.getAll();
      set({
        exams: fetched,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load exams from offline storage';
      set({ error: msg, isLoading: false });
    }
  },

  addExam: async (newExam: Exam) => {
    const previous = get().exams;
    // Optimistic UI update
    set({ exams: [...previous, newExam], error: null });

    try {
      await examRepository.create(newExam);
      return newExam;
    } catch (err: unknown) {
      // Rollback on failure
      const msg = err instanceof Error ? err.message : 'Failed to save exam';
      set({ exams: previous, error: msg });
      throw err;
    }
  },

  updateExam: async (id: string, updates: Partial<Exam>) => {
    const previous = get().exams;
    const existing = previous.find((e) => e.id === id);
    if (!existing) {
      throw new Error(`Exam with id ${id} not found`);
    }

    const updated: Exam = { ...existing, ...updates };

    // Optimistic UI update
    set({
      exams: previous.map((e) => (e.id === id ? updated : e)),
      error: null,
    });

    try {
      await examRepository.update(id, updates);
      return updated;
    } catch (err: unknown) {
      // Rollback on failure
      const msg = err instanceof Error ? err.message : 'Failed to update exam';
      set({ exams: previous, error: msg });
      throw err;
    }
  },

  deleteExam: async (id: string) => {
    const previous = get().exams;
    const existing = previous.find((e) => e.id === id);
    if (!existing) {
      throw new Error(`Exam with id ${id} not found`);
    }

    // Optimistic UI update
    set({
      exams: previous.filter((e) => e.id !== id),
      error: null,
    });

    try {
      await examRepository.delete(id);
    } catch (err: unknown) {
      // Rollback on failure
      const msg = err instanceof Error ? err.message : 'Failed to delete exam';
      set({ exams: previous, error: msg });
      throw err;
    }
  },
}));

