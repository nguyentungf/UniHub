import { create } from 'zustand';
import { Course, CourseLesson, AttendanceRecord, Semester } from '@/types';
import { courseRepository, semesterRepository, timetableRepository, dataAccessLayer } from '@/lib/storage/dal';
import { SEED_DATA } from '@/constants/seedData';

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

  // Lesson actions
  addLesson: (courseId: string, title: string, description?: string) => Promise<void>;
  toggleLessonCompleted: (courseId: string, lessonId: string) => Promise<void>;
  deleteLesson: (courseId: string, lessonId: string) => Promise<void>;

  // Attendance actions
  logAttendance: (courseId: string, record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  deleteAttendanceRecord: (courseId: string, recordId: string) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: SEED_DATA.data.courses,
  semesters: SEED_DATA.data.semesters,
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

      set({
        courses: fetchedCourses.length > 0 ? fetchedCourses : SEED_DATA.data.courses,
        semesters: fetchedSemesters.length > 0 ? fetchedSemesters : SEED_DATA.data.semesters,
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
    const previous = get().courses;
    // Optimistic UI update
    set({
      courses: previous.filter((c) => c.id !== id),
      error: null,
    });

    try {
      await courseRepository.delete(id);
      // Clean up timetable slots belonging to this course
      const slots = await timetableRepository.getByCourseId(id);
      for (const slot of slots) {
        await timetableRepository.delete(slot.id);
      }
    } catch (err: unknown) {
      // Rollback
      const msg = err instanceof Error ? err.message : 'Failed to delete course';
      set({ courses: previous, error: msg });
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
}));
