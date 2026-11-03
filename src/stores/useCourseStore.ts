import { create } from 'zustand';
import { Course, CourseLesson, AttendanceRecord, Semester } from '@/types';
import {
  courseRepository,
  semesterRepository,
  dataAccessLayer,
  DEFAULT_INITIAL_SEMESTER,
} from '@/lib/storage/dal';
import { getDatabaseMode } from '@/lib/storage/db';
import { SEED_DATA } from '@/constants/seedData';
import { useTimetableStore } from './useTimetableStore';
import { useAssignmentStore } from './useAssignmentStore';
import { useExamStore } from './useExamStore';
import { useNoteStore } from './useNoteStore';
import { useStudyStore } from './useStudyStore';
import { useSettingsStore } from './useSettingsStore';

export interface CourseState {
  courses: Course[];
  semesters: Semester[];
  selectedSemesterId: string | 'all';
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCourses: () => Promise<void>;
  setSelectedSemesterId: (semesterId: string | 'all') => void;
  clearError: () => void;

  addCourse: (course: Course) => Promise<Course>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;

  // Semester actions
  addSemester: (semester: Omit<Semester, 'id'> & { id?: string }) => Promise<Semester>;
  updateSemester: (id: string, updates: Partial<Semester>) => Promise<Semester>;
  deleteSemester: (id: string) => Promise<void>;
  setCurrentSemester: (id: string) => Promise<void>;
  transitionSemester: (data: Omit<Semester, 'id' | 'isCurrent'>) => Promise<Semester>;

  // Lesson actions
  addLesson: (courseId: string, title: string, description?: string) => Promise<void>;
  toggleLessonCompleted: (courseId: string, lessonId: string) => Promise<void>;
  deleteLesson: (courseId: string, lessonId: string) => Promise<void>;

  // Attendance actions
  logAttendance: (courseId: string, record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  deleteAttendanceRecord: (courseId: string, recordId: string) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: typeof window !== 'undefined' && getDatabaseMode() === 'real' ? [] : SEED_DATA.data.courses,
  semesters: typeof window !== 'undefined' && getDatabaseMode() === 'real' ? [DEFAULT_INITIAL_SEMESTER] : SEED_DATA.data.semesters,
  selectedSemesterId: 'all',
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  setSelectedSemesterId: (selectedSemesterId) => set({ selectedSemesterId }),

  loadCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      await dataAccessLayer.initializeSeedDataIfNeeded();
      const [fetchedCourses, fetchedSemesters] = await Promise.all([
        courseRepository.getAll(),
        semesterRepository.getAll(),
      ]);

      const defaultFallback =
        getDatabaseMode() === 'real' ? [DEFAULT_INITIAL_SEMESTER] : SEED_DATA.data.semesters;

      let resolvedSemesters = fetchedSemesters;
      if (resolvedSemesters.length > 0 && !resolvedSemesters.some((s) => s.isCurrent)) {
        const activeSemesterId = useSettingsStore.getState().settings?.activeSemesterId;
        const target = resolvedSemesters.find((s) => s.id === activeSemesterId) || resolvedSemesters[0];
        resolvedSemesters = resolvedSemesters.map((s) => ({
          ...s,
          isCurrent: s.id === target.id,
        }));
      }

      set({
        courses: fetchedCourses,
        semesters: resolvedSemesters.length > 0 ? resolvedSemesters : defaultFallback,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load courses from offline storage';
      set({ error: msg, isLoading: false });
    }
  },

  addCourse: async (newCourse: Course) => {
    const previous = get().courses;
    // Optimistic UI update
    set({ courses: [newCourse, ...previous], error: null });

    try {
      await courseRepository.create(newCourse);
      return newCourse;
    } catch (err: unknown) {
      // Rollback on failure
      const msg = err instanceof Error ? err.message : 'Failed to save course';
      set({ courses: previous, error: msg });
      throw err;
    }
  },

  updateCourse: async (id: string, updates: Partial<Course>) => {
    const previous = get().courses;
    const existingCourse = previous.find((c) => c.id === id);
    if (!existingCourse) {
      throw new Error(`Course with id ${id} not found`);
    }

    const updatedCourse: Course = { ...existingCourse, ...updates };

    // Optimistic UI update
    set({
      courses: previous.map((c) => (c.id === id ? updatedCourse : c)),
      error: null,
    });

    try {
      await courseRepository.update(id, updates);
      return updatedCourse;
    } catch (err: unknown) {
      // Rollback
      const msg = err instanceof Error ? err.message : 'Failed to update course';
      set({ courses: previous, error: msg });
      throw err;
    }
  },

  deleteCourse: async (id: string) => {
    // 1. Capture snapshot of all store states before mutation for complete rollback capability
    const prevCourses = get().courses;
    const prevSlots = useTimetableStore.getState().slots;
    const prevAssignments = useAssignmentStore.getState().assignments;
    const prevExams = useExamStore.getState().exams;
    const prevNotes = useNoteStore.getState().notes;
    const prevActiveNoteId = useNoteStore.getState().activeNoteId;
    const prevSessions = useStudyStore.getState().sessions;

    // 2. Optimistic UI update across all feature stores
    set({
      courses: prevCourses.filter((c) => c.id !== id),
      error: null,
    });
    useTimetableStore.setState({
      slots: prevSlots.filter((s) => s.courseId !== id),
    });
    useAssignmentStore.setState({
      assignments: prevAssignments.filter((a) => a.courseId !== id),
    });
    useExamStore.setState({
      exams: prevExams.filter((e) => e.courseId !== id),
    });
    const remainingNotes = prevNotes.filter((n) => n.courseId !== id);
    useNoteStore.setState({
      notes: remainingNotes,
      activeNoteId:
        prevActiveNoteId && remainingNotes.some((n) => n.id === prevActiveNoteId)
          ? prevActiveNoteId
          : remainingNotes[0]?.id || null,
    });
    useStudyStore.setState({
      sessions: prevSessions.filter((s) => s.courseId !== id),
    });

    try {
      // 3. Execute atomic multi-store cascade delete in a single IndexedDB transaction
      await courseRepository.deleteCascadeAtomic(id);
    } catch (err: unknown) {
      // 4. Complete multi-store rollback: Revert both state and storage on failure
      const msg = err instanceof Error ? err.message : 'Failed to delete course and related records';
      set({ courses: prevCourses, error: msg });
      useTimetableStore.setState({ slots: prevSlots });
      useAssignmentStore.setState({ assignments: prevAssignments });
      useExamStore.setState({ exams: prevExams });
      useNoteStore.setState({ notes: prevNotes, activeNoteId: prevActiveNoteId });
      useStudyStore.setState({ sessions: prevSessions });
      throw err;
    }
  },

  addLesson: async (courseId: string, title: string, description?: string) => {
    const course = get().courses.find((c) => c.id === courseId);
    if (!course) return;

    const lessons = course.lessons || [];
    const newLesson: CourseLesson = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lessonNumber: lessons.length + 1,
      title: title.trim(),
      description: description?.trim(),
      isCompleted: false,
    };

    const updatedLessons = [...lessons, newLesson];
    const newTotal = Math.max(course.totalLessons ?? 0, updatedLessons.length);

    await get().updateCourse(courseId, {
      lessons: updatedLessons,
      totalLessons: newTotal,
    });
  },

  toggleLessonCompleted: async (courseId: string, lessonId: string) => {
    const course = get().courses.find((c) => c.id === courseId);
    if (!course) return;

    const lessons = course.lessons || [];
    const updatedLessons = lessons.map((l) => {
      if (l.id === lessonId) {
        const nextState = !l.isCompleted;
        return {
          ...l,
          isCompleted: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
        };
      }
      return l;
    });

    const completedCount = updatedLessons.filter((l) => l.isCompleted).length;

    await get().updateCourse(courseId, {
      lessons: updatedLessons,
      completedLessons: completedCount,
    });
  },

  deleteLesson: async (courseId: string, lessonId: string) => {
    const course = get().courses.find((c) => c.id === courseId);
    if (!course) return;

    const lessons = (course.lessons || []).filter((l) => l.id !== lessonId);
    // Re-index lesson numbers
    const reindexedLessons = lessons.map((l, index) => ({
      ...l,
      lessonNumber: index + 1,
    }));

    const completedCount = reindexedLessons.filter((l) => l.isCompleted).length;

    await get().updateCourse(courseId, {
      lessons: reindexedLessons,
      completedLessons: completedCount,
      totalLessons: Math.max(0, (course.totalLessons ?? lessons.length) - 1),
    });
  },

  logAttendance: async (courseId: string, record: Omit<AttendanceRecord, 'id'>) => {
    const course = get().courses.find((c) => c.id === courseId);
    if (!course) return;

    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    const currentRecords = course.attendanceRecords || [];
    const updatedRecords = [newRecord, ...currentRecords];

    await get().updateCourse(courseId, {
      attendanceRecords: updatedRecords,
    });
  },

  deleteAttendanceRecord: async (courseId: string, recordId: string) => {
    const course = get().courses.find((c) => c.id === courseId);
    if (!course) return;

    const currentRecords = course.attendanceRecords || [];
    const updatedRecords = currentRecords.filter((r) => r.id !== recordId);

    await get().updateCourse(courseId, {
      attendanceRecords: updatedRecords,
    });
  },

  addSemester: async (newSemesterData) => {
    const previous = get().semesters;
    const newId = newSemesterData.id || `sem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const shouldBeCurrent = newSemesterData.isCurrent || previous.length === 0;

    const newSemester: Semester = {
      ...newSemesterData,
      id: newId,
      isCurrent: shouldBeCurrent,
    };

    const updatedSemesters = shouldBeCurrent
      ? [newSemester, ...previous.map((s) => ({ ...s, isCurrent: false }))]
      : [...previous, newSemester];

    // Optimistic UI update
    set({ semesters: updatedSemesters, error: null });

    if (shouldBeCurrent) {
      useSettingsStore.getState().updateSettings({ activeSemesterId: newId });
    }

    try {
      await semesterRepository.bulkCreate(updatedSemesters);
      return newSemester;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu học kỳ mới';
      set({ semesters: previous, error: msg });
      throw err;
    }
  },

  updateSemester: async (id, updates) => {
    const previous = get().semesters;
    const target = previous.find((s) => s.id === id);
    if (!target) {
      throw new Error(`Không tìm thấy học kỳ với ID ${id}`);
    }

    const isBecomingCurrent = updates.isCurrent === true;
    let updatedSemesters: Semester[];

    if (isBecomingCurrent) {
      updatedSemesters = previous.map((s) =>
        s.id === id ? { ...s, ...updates, isCurrent: true } : { ...s, isCurrent: false }
      );
      useSettingsStore.getState().updateSettings({ activeSemesterId: id });
    } else {
      if (target.isCurrent && updates.isCurrent === false) {
        throw new Error('Hệ thống luôn cần có một học kỳ hiện tại. Vui lòng chọn học kỳ khác làm hiện tại.');
      }
      updatedSemesters = previous.map((s) => (s.id === id ? { ...s, ...updates } : s));
    }

    set({ semesters: updatedSemesters, error: null });

    try {
      await semesterRepository.bulkCreate(updatedSemesters);
      return updatedSemesters.find((s) => s.id === id)!;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật học kỳ';
      set({ semesters: previous, error: msg });
      throw err;
    }
  },

  deleteSemester: async (id) => {
    const prevSemesters = get().semesters;
    const target = prevSemesters.find((s) => s.id === id);
    if (!target) {
      throw new Error(`Không tìm thấy học kỳ với ID ${id}`);
    }

    if (target.isCurrent) {
      throw new Error('Không thể xóa học kỳ đang được đặt làm hiện tại. Vui lòng chuyển trạng thái hiện tại sang học kỳ khác trước khi xóa.');
    }

    if (prevSemesters.length <= 1) {
      throw new Error('Không thể xóa học kỳ duy nhất của hệ thống.');
    }

    const currentCourses = get().courses;
    const linkedCourses = currentCourses.filter((c) => c.semesterId === id);
    if (linkedCourses.length > 0) {
      throw new Error(`Không thể xóa học kỳ đang chứa ${linkedCourses.length} môn học. Vui lòng xóa hoặc chuyển các môn học này sang học kỳ khác trước khi xóa.`);
    }

    // Optimistic UI update
    set({
      semesters: prevSemesters.filter((s) => s.id !== id),
      error: null,
    });

    try {
      await semesterRepository.deleteSafe(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa học kỳ';
      set({ semesters: prevSemesters, error: msg });
      throw err;
    }
  },

  setCurrentSemester: async (id) => {
    const previous = get().semesters;
    const target = previous.find((s) => s.id === id);
    if (!target) {
      throw new Error(`Không tìm thấy học kỳ với ID ${id}`);
    }

    const updatedSemesters = previous.map((s) => ({
      ...s,
      isCurrent: s.id === id,
    }));

    set({ semesters: updatedSemesters, error: null });
    useSettingsStore.getState().updateSettings({ activeSemesterId: id });

    try {
      await semesterRepository.setCurrent(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể chuyển học kỳ hiện tại';
      set({ semesters: previous, error: msg });
      throw err;
    }
  },

  transitionSemester: async (data) => {
    const previous = get().semesters;
    const newId = `sem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSemester: Semester = {
      ...data,
      id: newId,
      isCurrent: true,
    };

    const updatedSemesters = [
      newSemester,
      ...previous.map((s) => ({ ...s, isCurrent: false })),
    ];

    set({ semesters: updatedSemesters, error: null });
    useSettingsStore.getState().updateSettings({ activeSemesterId: newId });

    try {
      await semesterRepository.bulkCreate(updatedSemesters);
      return newSemester;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể chuyển tiếp sang học kỳ mới';
      set({ semesters: previous, error: msg });
      throw err;
    }
  },
}));
