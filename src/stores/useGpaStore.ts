import { create } from 'zustand';
import { GradingScale } from '@/types';
import { gradingScaleRepository } from '@/lib/storage/dal';
import { DEFAULT_GRADING_SCALES, DEFAULT_ACTIVE_SCALE_ID } from '@/features/gpa/utils/gradingScales';

export interface GpaStoreState {
  activeScaleId: string;
  scales: GradingScale[];
  simulatedGrades: Record<string, number>; // courseId -> simulated gradePoint
  selectedSemesterId: string | 'all';
  activeTab: 'calculator' | 'analytics' | 'scales';

  // Actions
  loadScales: () => void;
  setActiveScaleId: (id: string) => void;
  saveScale: (scale: GradingScale) => void;
  deleteCustomScale: (scaleId: string) => void;
  resetScalesToDefault: () => void;

  setSimulatedGrade: (courseId: string, gradePoint: number) => void;
  setAllSimulatedGrades: (grades: Record<string, number>) => void;
  resetSimulatedGrades: () => void;

  setSelectedSemesterId: (id: string | 'all') => void;
  setActiveTab: (tab: 'calculator' | 'analytics' | 'scales') => void;
}

export const useGpaStore = create<GpaStoreState>((set, get) => ({
  activeScaleId: gradingScaleRepository.getActiveScaleId(),
  scales: gradingScaleRepository.getScales(),
  simulatedGrades: {},
  selectedSemesterId: 'all',
  activeTab: 'calculator',

  loadScales: () => {
    const scales = gradingScaleRepository.getScales();
    const activeScaleId = gradingScaleRepository.getActiveScaleId();
    set({ scales, activeScaleId });
  },

  setActiveScaleId: (id: string) => {
    gradingScaleRepository.setActiveScaleId(id);
    set({ activeScaleId: id });
  },

  saveScale: (scale: GradingScale) => {
    const current = get().scales;
    const existingIndex = current.findIndex((s) => s.id === scale.id);

    let updated: GradingScale[];
    if (existingIndex >= 0) {
      updated = current.map((s) => (s.id === scale.id ? scale : s));
    } else {
      updated = [...current, scale];
    }

    gradingScaleRepository.saveScales(updated);
    set({ scales: updated, activeScaleId: scale.id });
    gradingScaleRepository.setActiveScaleId(scale.id);
  },

  deleteCustomScale: (scaleId: string) => {
    const current = get().scales;
    const target = current.find((s) => s.id === scaleId);
    if (!target || !target.isCustom) return; // Do not delete default presets

    const updated = current.filter((s) => s.id !== scaleId);
    gradingScaleRepository.saveScales(updated);

    // If active was deleted, fallback to default
    let nextActiveId = get().activeScaleId;
    if (nextActiveId === scaleId) {
      nextActiveId = DEFAULT_ACTIVE_SCALE_ID;
      gradingScaleRepository.setActiveScaleId(nextActiveId);
    }

    set({ scales: updated, activeScaleId: nextActiveId });
  },

  resetScalesToDefault: () => {
    gradingScaleRepository.saveScales(DEFAULT_GRADING_SCALES);
    gradingScaleRepository.setActiveScaleId(DEFAULT_ACTIVE_SCALE_ID);
    set({
      scales: DEFAULT_GRADING_SCALES,
      activeScaleId: DEFAULT_ACTIVE_SCALE_ID,
    });
  },

  setSimulatedGrade: (courseId: string, gradePoint: number) => {
    set((state) => ({
      simulatedGrades: {
        ...state.simulatedGrades,
        [courseId]: gradePoint,
      },
    }));
  },

  setAllSimulatedGrades: (grades: Record<string, number>) => {
    set({ simulatedGrades: grades });
  },

  resetSimulatedGrades: () => {
    set({ simulatedGrades: {} });
  },

  setSelectedSemesterId: (id: string | 'all') => {
    set({ selectedSemesterId: id });
  },

  setActiveTab: (tab: 'calculator' | 'analytics' | 'scales') => {
    set({ activeTab: tab });
  },
}));

