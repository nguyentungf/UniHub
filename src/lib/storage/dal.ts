/**
 * UniHub Centralized Data Access Layer (DAL)
 * Repositories providing typed CRUD operations, business queries, and backup orchestrations.
 */

import { SEED_DATA } from '@/constants/seedData';
import { idb, getDatabaseMode, setDatabaseModeKey, DatabaseMode, DATA_MODE_KEY } from './db';
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

export const SCALES_KEY = 'unihub_custom_grading_scales_v1';
export const ACTIVE_SCALE_KEY = 'unihub_active_grading_scale_id_v1';

export const DEFAULT_INITIAL_SEMESTER: Semester = {
  id: 'sem-current',
  name: 'Học kỳ 1 (2026 - 2027)',
  startDate: '2026-09-01',
  endDate: '2027-01-15',
  isCurrent: true,
  targetGpa: 3.5,
};

export const DEFAULT_REAL_USER_SETTINGS: UserSettings = {
  studentName: 'Sinh viên',
  universityName: 'Trường Đại học',
  major: 'Chuyên ngành của bạn',
  activeSemesterId: 'sem-current',
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

export const DEFAULT_USER_SETTINGS: UserSettings = {
  studentName: 'Alex Chen',
  universityName: 'Metropolis University of Technology',
  major: 'Computer Science & Engineering',
  activeSemesterId: 'sem-fall-2026',
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

export function getSettingsStorageKey(): string {
  const mode = getDatabaseMode();
  return mode === 'demo' ? 'unihub_user_settings_demo_v2' : 'unihub_user_settings_real_v2';
}

export function getDefaultUserSettings(): UserSettings {
  const mode = getDatabaseMode();
  return mode === 'demo' ? DEFAULT_USER_SETTINGS : DEFAULT_REAL_USER_SETTINGS;
}

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
    const fallback = getDefaultUserSettings();
    if (typeof window === 'undefined') return fallback;
    try {
      const key = getSettingsStorageKey();
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      const validated = UserSettingsSchema.safeParse(parsed);
      return validated.success ? validated.data : fallback;
    } catch {
      return fallback;
    }
  },

  save(settings: UserSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getSettingsStorageKey(), JSON.stringify(settings));
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

    async bulkDelete(ids: string[]): Promise<void> {
      return idb.bulkDelete(storeName, ids);
    },
  };
}

// ==========================================
// 3. Domain Entity Repositories
// ==========================================

export const semesterRepository = {
  ...createEntityRepository<Semester>('semesters'),

  /**
   * Sets a semester as the current active semester in IndexedDB
   * and updates user settings in LocalStorage.
   */
  async setCurrent(id: string): Promise<Semester[]> {
    const all = await this.getAll();
    const updated = all.map((s) => ({
      ...s,
      isCurrent: s.id === id,
    }));
    await this.bulkCreate(updated);

    // Sync activeSemesterId in settings
    const settings = settingsRepository.get();
    settingsRepository.save({
      ...settings,
      activeSemesterId: id,
    });

    return updated;
  },

  /**
   * Validates if a semester can be safely deleted.
   * Checks if it's current, if it's the last remaining semester, or if courses are linked to it.
   */
  async validateDelete(id: string): Promise<{ canDelete: boolean; reason?: string; courseCount: number }> {
    const all = await this.getAll();
    const target = all.find((s) => s.id === id);
    if (!target) {
      return { canDelete: false, reason: 'Không tìm thấy học kỳ để xóa', courseCount: 0 };
    }

    if (all.length <= 1) {
      return { canDelete: false, reason: 'Không thể xóa học kỳ duy nhất của hệ thống.', courseCount: 0 };
    }

    if (target.isCurrent) {
      return {
        canDelete: false,
        reason: 'Không thể xóa học kỳ đang được đặt làm hiện tại. Vui lòng chuyển trạng thái hiện tại sang học kỳ khác trước khi xóa.',
        courseCount: 0,
      };
    }

    const linkedCourses = await idb.getByIndex<Course>('courses', 'by_semesterId', id);
    if (linkedCourses.length > 0) {
      return {
        canDelete: false,
        reason: `Không thể xóa học kỳ đang chứa ${linkedCourses.length} môn học. Vui lòng xóa hoặc chuyển các môn học này sang học kỳ khác trước khi xóa.`,
        courseCount: linkedCourses.length,
      };
    }

    return { canDelete: true, courseCount: 0 };
  },

  /**
   * Safely deletes a semester after validating business rules.
   */
  async deleteSafe(id: string): Promise<void> {
    const validation = await this.validateDelete(id);
    if (!validation.canDelete) {
      throw new Error(validation.reason || 'Không thể xóa học kỳ');
    }
    await this.delete(id);
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

export interface CascadeDeletedEntities {
  slotIds: string[];
  assignmentIds: string[];
  examIds: string[];
  noteIds: string[];
  sessionIds: string[];
}

export const courseRepository = {
  ...createEntityRepository<Course>('courses'),
  async getBySemesterId(semesterId: string): Promise<Course[]> {
    return idb.getByIndex<Course>('courses', 'by_semesterId', semesterId);
  },

  /**
   * Transactional atomic cascade delete:
   * Gathers all related IDs and performs deletion across all 6 stores in a single atomic transaction.
   * If any step fails, the entire transaction is rolled back by IndexedDB.
   */
  async deleteCascadeAtomic(id: string): Promise<CascadeDeletedEntities> {
    const [slots, asgs, exams, notes, sessions] = await Promise.all([
      timetableRepository.getByCourseId(id),
      assignmentRepository.getByCourseId(id),
      examRepository.getByCourseId(id),
      noteRepository.getByCourseId(id),
      studyRepository.getByCourseId(id),
    ]);

    const cascadeIds: CascadeDeletedEntities = {
      slotIds: slots.map((s) => s.id),
      assignmentIds: asgs.map((a) => a.id),
      examIds: exams.map((e) => e.id),
      noteIds: notes.map((n) => n.id),
      sessionIds: sessions.map((s) => s.id),
    };

    await idb.deleteCourseCascadeAtomic(id, cascadeIds);
    return cascadeIds;
  },
};

export function getSeededKey(): string {
  const mode = getDatabaseMode();
  return mode === 'demo' ? 'unihub_demo_seeded_v2' : 'unihub_real_seeded_v2';
}

export const DB_SEEDED_KEY = 'unihub_db_has_seeded_v1';

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
        gradingScales: gradingScaleRepository.getScales(),
        activeScaleId: gradingScaleRepository.getActiveScaleId(),
      },
    };
  },

  /**
   * Restore all data from a validated backup payload atomically.
   * If any error occurs in IndexedDB, the entire transaction aborts,
   * guaranteeing that existing data is never wiped out or corrupted on failure.
   */
  async importBackup(backup: UniHubBackupData): Promise<void> {
    // 1. Atomic IndexedDB restore across all 7 stores in a single transaction
    await idb.restoreBackupAtomic(backup.data);

    // 2. Restore settings
    if (backup.data.settings) {
      settingsRepository.save(backup.data.settings);
    }

    // 3. Restore custom grading scales & active scale selection
    if (backup.data.gradingScales && backup.data.gradingScales.length > 0) {
      gradingScaleRepository.saveScales(backup.data.gradingScales);
    }
    if (backup.data.activeScaleId) {
      gradingScaleRepository.setActiveScaleId(backup.data.activeScaleId);
    }
  },

  getDatabaseMode(): DatabaseMode {
    return getDatabaseMode();
  },

  async switchDatabaseMode(newMode: DatabaseMode): Promise<void> {
    idb.switchDatabase(newMode);
    await this.initializeSeedDataIfNeeded();
  },

  /**
   * Reset the current database environment
   */
  async resetAll(): Promise<void> {
    const mode = getDatabaseMode();
    const seedKey = getSeededKey();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(seedKey);
    }
    await Promise.all([
      semesterRepository.clear(),
      courseRepository.clear(),
      timetableRepository.clear(),
      assignmentRepository.clear(),
      examRepository.clear(),
      studyRepository.clear(),
      noteRepository.clear(),
    ]);

    if (mode === 'real') {
      await semesterRepository.bulkCreate([DEFAULT_INITIAL_SEMESTER]);
      settingsRepository.save(DEFAULT_REAL_USER_SETTINGS);
      if (typeof window !== 'undefined') {
        localStorage.setItem(seedKey, 'true');
      }
    } else {
      settingsRepository.save(DEFAULT_USER_SETTINGS);
      await this.initializeSeedDataIfNeeded();
    }
  },

  /**
   * Ensure initial seed data is loaded into IndexedDB on first run
   */
  async initializeSeedDataIfNeeded(): Promise<void> {
    const mode = getDatabaseMode();
    const seedKey = getSeededKey();

    if (typeof window !== 'undefined' && localStorage.getItem(seedKey) === 'true') {
      return;
    }

    try {
      if (mode === 'demo') {
        // DEMO MODE: Pre-load rich demonstration data for tester & dev evaluation
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
        settingsRepository.save(SEED_DATA.data.settings);
      } else {
        // REAL MODE: 100% Blank Slate (Trường trắng) for real student usage
        // Seed ONLY 1 clean initial semester so user can immediately add courses
        const existingSemesters = await semesterRepository.getAll();
        if (existingSemesters.length === 0) {
          await semesterRepository.bulkCreate([DEFAULT_INITIAL_SEMESTER]);
        }
        // Courses, Timetable, Assignments, Exams, StudySessions, Notes stay 100% EMPTY []
        settingsRepository.save(DEFAULT_REAL_USER_SETTINGS);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(seedKey, 'true');
      }
    } catch (err) {
      console.warn('Failed to initialize database:', err);
    }
  },
};
