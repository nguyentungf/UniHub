/**
 * UniHub Centralized Data Access Layer (DAL)
 * Repositories providing typed CRUD operations, business queries, and backup orchestrations.
 */

import { SEED_DATA } from '@/constants/seedData';
import { idb } from './db';
import {
  Semester,
  Course,
  TimetableSlot,
  Assignment,
  Exam,
  StudySession,
  Note,
  UserSettings,
  UniHubBackupData,
  DayOfWeek,
  GradingScale,
} from '@/types';
import { UserSettingsSchema, GradingScaleSchema } from '@/lib/validation/schemas';
import { DEFAULT_GRADING_SCALES, DEFAULT_ACTIVE_SCALE_ID } from '@/features/gpa/utils/gradingScales';

// ==========================================
// 1. LocalStorage Settings & Scales Repository
// ==========================================

const SETTINGS_KEY = 'unihub_user_settings_v1';
const SCALES_KEY = 'unihub_custom_grading_scales_v1';
const ACTIVE_SCALE_KEY = 'unihub_active_grading_scale_id_v1';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  studentName: 'Student',
  universityName: 'State University',
  major: 'Computer Science',
  activeSemesterId: null,
  theme: 'system',
  gradingScaleType: '4.0',
  pomodoro: {
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
  },
  assignmentReminderHours: 24,
  examReminderDays: 7,
};

export const gradingScaleRepository = {
  getScales(): GradingScale[] {
    if (typeof window === 'undefined') return DEFAULT_GRADING_SCALES;
    try {
      const raw = localStorage.getItem(SCALES_KEY);
      if (!raw) return DEFAULT_GRADING_SCALES;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_GRADING_SCALES;
      return parsed;
    } catch {
      return DEFAULT_GRADING_SCALES;
    }
  },

  saveScales(scales: GradingScale[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SCALES_KEY, JSON.stringify(scales));
  },

  getActiveScaleId(): string {
    if (typeof window === 'undefined') return DEFAULT_ACTIVE_SCALE_ID;
    try {
      return localStorage.getItem(ACTIVE_SCALE_KEY) || DEFAULT_ACTIVE_SCALE_ID;
    } catch {
      return DEFAULT_ACTIVE_SCALE_ID;
    }
  },

  setActiveScaleId(scaleId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_SCALE_KEY, scaleId);
  },
};

export const settingsRepository = {
  get(): UserSettings {
    if (typeof window === 'undefined') return DEFAULT_USER_SETTINGS;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return DEFAULT_USER_SETTINGS;
      const parsed = JSON.parse(raw);
      const validated = UserSettingsSchema.safeParse(parsed);
      return validated.success ? validated.data : DEFAULT_USER_SETTINGS;
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  },

  save(settings: UserSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  update(partial: Partial<UserSettings>): UserSettings {
    const current = this.get();
    const updated = { ...current, ...partial };
    this.save(updated);
    return updated;
  },
};

// ==========================================
// 2. Generic IndexedDB Repository Factory
// ==========================================

function createEntityRepository<T extends { id: string }>(storeName: import('./db').StoreName) {
  return {
    async getAll(): Promise<T[]> {
      return idb.getAll<T>(storeName);
    },

    async getById(id: string): Promise<T | null> {
      return idb.getById<T>(storeName, id);
    },

    async create(item: T): Promise<T> {
      return idb.put<T>(storeName, item);
    },

    async update(id: string, updates: Partial<T>): Promise<T> {
      const existing = await idb.getById<T>(storeName, id);
      if (!existing) {
        throw new Error(`Record with id ${id} not found in store ${storeName}`);
      }
      const updated = { ...existing, ...updates };
      return idb.put<T>(storeName, updated);
    },

    async delete(id: string): Promise<void> {
      return idb.delete(storeName, id);
    },

    async clear(): Promise<void> {
      return idb.clear(storeName);
    },

    async bulkCreate(items: T[]): Promise<void> {
      return idb.bulkPut<T>(storeName, items);
    },
  };
}

// ==========================================
// 3. Domain Entity Repositories
// ==========================================

export const semesterRepository = createEntityRepository<Semester>('semesters');

export const courseRepository = {
  ...createEntityRepository<Course>('courses'),
  async getBySemesterId(semesterId: string): Promise<Course[]> {
    return idb.getByIndex<Course>('courses', 'by_semesterId', semesterId);
  },
};

export const timetableRepository = {
  ...createEntityRepository<TimetableSlot>('timetable'),
  async getByCourseId(courseId: string): Promise<TimetableSlot[]> {
    return idb.getByIndex<TimetableSlot>('timetable', 'by_courseId', courseId);
  },
  async getByDay(dayOfWeek: DayOfWeek): Promise<TimetableSlot[]> {
    return idb.getByIndex<TimetableSlot>('timetable', 'by_dayOfWeek', dayOfWeek);
  },
};

export const assignmentRepository = {
  ...createEntityRepository<Assignment>('assignments'),
  async getByCourseId(courseId: string): Promise<Assignment[]> {
    return idb.getByIndex<Assignment>('assignments', 'by_courseId', courseId);
  },
  async getByStatus(status: Assignment['status']): Promise<Assignment[]> {
    return idb.getByIndex<Assignment>('assignments', 'by_status', status);
  },
};

export const examRepository = {
  ...createEntityRepository<Exam>('exams'),
  async getByCourseId(courseId: string): Promise<Exam[]> {
    return idb.getByIndex<Exam>('exams', 'by_courseId', courseId);
  },
};

export const studyRepository = {
  ...createEntityRepository<StudySession>('studySessions'),
  async getByCourseId(courseId: string): Promise<StudySession[]> {
    return idb.getByIndex<StudySession>('studySessions', 'by_courseId', courseId);
  },
};

export const noteRepository = {
  ...createEntityRepository<Note>('notes'),
  async getByCourseId(courseId: string): Promise<Note[]> {
    return idb.getByIndex<Note>('notes', 'by_courseId', courseId);
  },
};

// ==========================================
// 4. Backup & Seed Orchestration
// ==========================================

export const dataAccessLayer = {
  semesters: semesterRepository,
  courses: courseRepository,
  timetable: timetableRepository,
  assignments: assignmentRepository,
  exams: examRepository,
  study: studyRepository,
  notes: noteRepository,
  settings: settingsRepository,
  gradingScales: gradingScaleRepository,

  /**
   * Export all database records into a single portable backup JSON
   */
  async exportBackup(): Promise<UniHubBackupData> {
    const [
      semesters,
      courses,
      timetable,
      assignments,
      exams,
      studySessions,
      notes,
    ] = await Promise.all([
      semesterRepository.getAll(),
      courseRepository.getAll(),
      timetableRepository.getAll(),
      assignmentRepository.getAll(),
      examRepository.getAll(),
      studyRepository.getAll(),
      noteRepository.getAll(),
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'UniHub',
      data: {
        semesters,
        courses,
        timetable,
        assignments,
        exams,
        studySessions,
        notes,
        settings: settingsRepository.get(),
      },
    };
  },

  /**
   * Restore all data from a validated backup payload
   */
  async importBackup(backup: UniHubBackupData): Promise<void> {
    await Promise.all([
      semesterRepository.clear(),
      courseRepository.clear(),
      timetableRepository.clear(),
      assignmentRepository.clear(),
      examRepository.clear(),
      studyRepository.clear(),
      noteRepository.clear(),
    ]);

    await Promise.all([
      semesterRepository.bulkCreate(backup.data.semesters),
      courseRepository.bulkCreate(backup.data.courses),
      timetableRepository.bulkCreate(backup.data.timetable),
      assignmentRepository.bulkCreate(backup.data.assignments),
      examRepository.bulkCreate(backup.data.exams),
      studyRepository.bulkCreate(backup.data.studySessions),
      noteRepository.bulkCreate(backup.data.notes),
    ]);

    if (backup.data.settings) {
      settingsRepository.save(backup.data.settings);
    }
  },

  /**
   * Reset database to clean slate
   */
  async resetAll(): Promise<void> {
    await Promise.all([
      semesterRepository.clear(),
      courseRepository.clear(),
      timetableRepository.clear(),
      assignmentRepository.clear(),
      examRepository.clear(),
      studyRepository.clear(),
      noteRepository.clear(),
    ]);
    settingsRepository.save(DEFAULT_USER_SETTINGS);
  },

  /**
   * Ensure initial seed data is loaded into IndexedDB on first run
   */
  async initializeSeedDataIfNeeded(): Promise<void> {
    try {
      const existingSemesters = await semesterRepository.getAll();
      if (existingSemesters.length === 0) {
        await semesterRepository.bulkCreate(SEED_DATA.data.semesters);
      }
      const existingCourses = await courseRepository.getAll();
      if (existingCourses.length === 0) {
        await courseRepository.bulkCreate(SEED_DATA.data.courses);
      }
      const existingTimetable = await timetableRepository.getAll();
      if (existingTimetable.length === 0) {
        await timetableRepository.bulkCreate(SEED_DATA.data.timetable);
      }
      const existingAssignments = await assignmentRepository.getAll();
      if (existingAssignments.length === 0) {
        await assignmentRepository.bulkCreate(SEED_DATA.data.assignments);
      }
      const existingExams = await examRepository.getAll();
      if (existingExams.length === 0) {
        await examRepository.bulkCreate(SEED_DATA.data.exams);
      }
      const existingStudy = await studyRepository.getAll();
      if (existingStudy.length === 0) {
        await studyRepository.bulkCreate(SEED_DATA.data.studySessions);
      }
      const existingNotes = await noteRepository.getAll();
      if (existingNotes.length === 0) {
        await noteRepository.bulkCreate(SEED_DATA.data.notes);
      }
    } catch (err) {
      console.warn('Failed to seed IndexedDB:', err);
    }
  },
};
