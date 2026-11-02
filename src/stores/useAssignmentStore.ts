import { create } from 'zustand';
import { Assignment, AssignmentStatus, PriorityLevel } from '@/types';
import { assignmentRepository, dataAccessLayer } from '@/lib/storage/dal';
import { SEED_DATA } from '@/constants/seedData';
import { AssignmentSortOption } from '@/features/assignments/utils/assignmentLogic';

export interface AssignmentState {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;

  // UI state
  filterCourseId: string | 'all';
  filterPriority: PriorityLevel | 'all';
  filterStatus: AssignmentStatus | 'all';
  searchQuery: string;
  sortBy: AssignmentSortOption;
  viewMode: 'kanban' | 'table' | 'calendar';

  // Actions
  loadAssignments: () => Promise<void>;
  addAssignment: (assignment: Assignment) => Promise<Assignment>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<Assignment>;
  deleteAssignment: (id: string) => Promise<void>;
  updateAssignmentStatus: (id: string, status: AssignmentStatus) => Promise<void>;

  setFilterCourseId: (courseId: string | 'all') => void;
  setFilterPriority: (priority: PriorityLevel | 'all') => void;
  setFilterStatus: (status: AssignmentStatus | 'all') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: AssignmentSortOption) => void;
  setViewMode: (viewMode: 'kanban' | 'table' | 'calendar') => void;
  clearError: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: SEED_DATA.data.assignments,
  isLoading: false,
  error: null,

  filterCourseId: 'all',
  filterPriority: 'all',
  filterStatus: 'all',
  searchQuery: '',
  sortBy: 'dueDate_asc',
  viewMode: 'kanban',

  clearError: () => set({ error: null }),
  setFilterCourseId: (filterCourseId) => set({ filterCourseId }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  setViewMode: (viewMode) => set({ viewMode }),

  loadAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      await dataAccessLayer.initializeSeedDataIfNeeded();
      const fetched = await assignmentRepository.getAll();
      set({
        assignments: fetched.length > 0 ? fetched : SEED_DATA.data.assignments,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load assignments from offline storage';
      set({ error: msg, isLoading: false });
    }
  },

  addAssignment: async (newAssignment: Assignment) => {
    const previous = get().assignments;
    // Optimistic UI update
    set({ assignments: [newAssignment, ...previous], error: null });

    try {
      await assignmentRepository.create(newAssignment);
      return newAssignment;
    } catch (err: unknown) {
      // Rollback on failure
      const msg = err instanceof Error ? err.message : 'Failed to save assignment';
      set({ assignments: previous, error: msg });
      throw err;
    }
  },

  updateAssignment: async (id: string, updates: Partial<Assignment>) => {
    const previous = get().assignments;
    const existing = previous.find((a) => a.id === id);
    if (!existing) {
      throw new Error(`Assignment with id ${id} not found`);
    }

    const updated: Assignment = { ...existing, ...updates };

    // Optimistic UI update
    set({
      assignments: previous.map((a) => (a.id === id ? updated : a)),
      error: null,
    });

    try {
      await assignmentRepository.update(id, updates);
      return updated;
    } catch (err: unknown) {
      // Rollback on failure
      const msg = err instanceof Error ? err.message : 'Failed to update assignment';
      set({ assignments: previous, error: msg });
      throw err;
    }
  },

  deleteAssignment: async (id: string) => {
    const previous = get().assignments;
    const existing = previous.find((a) => a.id === id);
    if (!existing) {
      throw new Error(`Assignment with id ${id} not found`);
    }

    // Optimistic UI update
    set({
      assignments: previous.filter((a) => a.id !== id),
      error: null,
    });

    try {
      await assignmentRepository.delete(id);
    } catch (err: unknown) {
      // Rollback on failure
      const msg = err instanceof Error ? err.message : 'Failed to delete assignment';
      set({ assignments: previous, error: msg });
      throw err;
    }
  },

  updateAssignmentStatus: async (id: string, status: AssignmentStatus) => {
    await get().updateAssignment(id, { status });
  },
}));

