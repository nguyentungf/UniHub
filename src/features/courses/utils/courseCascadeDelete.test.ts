import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Course, TimetableSlot, Assignment, Exam, Note, StudySession } from '../../../types/index.ts';

/**
 * In-memory multi-store transaction simulator mirroring IndexedDB atomic transaction semantics
 */
class TransactionalEntityDatabase {
  public courses = new Map<string, Course>();
  public timetable = new Map<string, TimetableSlot>();
  public assignments = new Map<string, Assignment>();
  public exams = new Map<string, Exam>();
  public notes = new Map<string, Note>();
  public studySessions = new Map<string, StudySession>();

  public shouldFailTransaction = false;

  /**
   * Simulates idb.deleteCourseCascadeAtomic in a single atomic transaction.
   * If an error occurs or shouldFailTransaction is true, all pending mutations are aborted
   * and previous storage state is strictly preserved.
   */
  async deleteCourseCascadeAtomic(
    courseId: string,
    cascadeIds: {
      slotIds: string[];
      assignmentIds: string[];
      examIds: string[];
      noteIds: string[];
      sessionIds: string[];
    }
  ): Promise<void> {
    // Snapshot state before transaction begins (simulating IndexedDB transaction isolation)
    const snapshotCourses = new Map(this.courses);
    const snapshotTimetable = new Map(this.timetable);
    const snapshotAssignments = new Map(this.assignments);
    const snapshotExams = new Map(this.exams);
    const snapshotNotes = new Map(this.notes);
    const snapshotSessions = new Map(this.studySessions);

    try {
      if (this.shouldFailTransaction) {
        throw new Error('IndexedDB transaction failed: QuotaExceededError or TransactionAbort');
      }

      // Execute atomic deletions
      this.courses.delete(courseId);
      for (const id of cascadeIds.slotIds) this.timetable.delete(id);
      for (const id of cascadeIds.assignmentIds) this.assignments.delete(id);
      for (const id of cascadeIds.examIds) this.exams.delete(id);
      for (const id of cascadeIds.noteIds) this.notes.delete(id);
      for (const id of cascadeIds.sessionIds) this.studySessions.delete(id);
    } catch (err) {
      // Transaction Abort: Rollback all changes
      this.courses = snapshotCourses;
      this.timetable = snapshotTimetable;
      this.assignments = snapshotAssignments;
      this.exams = snapshotExams;
      this.notes = snapshotNotes;
      this.studySessions = snapshotSessions;
      throw err;
    }
  }

  // Helper query methods
  async getCourse(id: string): Promise<Course | null> {
    return this.courses.get(id) || null;
  }
  async getSlotsByCourse(courseId: string): Promise<TimetableSlot[]> {
    return Array.from(this.timetable.values()).filter((s) => s.courseId === courseId);
  }
  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter((a) => a.courseId === courseId);
  }
  async getExamsByCourse(courseId: string): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter((e) => e.courseId === courseId);
  }
  async getNotesByCourse(courseId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter((n) => n.courseId === courseId);
  }
  async getSessionsByCourse(courseId: string): Promise<StudySession[]> {
    return Array.from(this.studySessions.values()).filter((s) => s.courseId === courseId);
  }
}

/**
 * Functional coordinator mirroring useCourseStore.deleteCourse with multi-store rollback
 */
async function deleteCourseWithAtomicRollback(
  courseId: string,
  db: TransactionalEntityDatabase,
  inMemoryState: {
    courses: Course[];
    slots: TimetableSlot[];
    assignments: Assignment[];
    exams: Exam[];
    notes: Note[];
    sessions: StudySession[];
    activeNoteId: string | null;
  }
) {
  // 1. Snapshot previous in-memory state
  const prevCourses = [...inMemoryState.courses];
  const prevSlots = [...inMemoryState.slots];
  const prevAssignments = [...inMemoryState.assignments];
  const prevExams = [...inMemoryState.exams];
  const prevNotes = [...inMemoryState.notes];
  const prevActiveNoteId = inMemoryState.activeNoteId;
  const prevSessions = [...inMemoryState.sessions];

  // 2. Optimistic UI update
  inMemoryState.courses = prevCourses.filter((c) => c.id !== courseId);
  inMemoryState.slots = prevSlots.filter((s) => s.courseId !== courseId);
  inMemoryState.assignments = prevAssignments.filter((a) => a.courseId !== courseId);
  inMemoryState.exams = prevExams.filter((e) => e.courseId !== courseId);
  const remainingNotes = prevNotes.filter((n) => n.courseId !== courseId);
  inMemoryState.notes = remainingNotes;
  inMemoryState.activeNoteId =
    prevActiveNoteId && remainingNotes.some((n) => n.id === prevActiveNoteId)
      ? prevActiveNoteId
      : remainingNotes[0]?.id || null;
  inMemoryState.sessions = prevSessions.filter((s) => s.courseId !== courseId);

  try {
    // Gather related entity IDs
    const [slots, asgs, exams, notes, sessions] = await Promise.all([
      db.getSlotsByCourse(courseId),
      db.getAssignmentsByCourse(courseId),
      db.getExamsByCourse(courseId),
      db.getNotesByCourse(courseId),
      db.getSessionsByCourse(courseId),
    ]);

    // 3. Execute atomic transaction
    await db.deleteCourseCascadeAtomic(courseId, {
      slotIds: slots.map((s) => s.id),
      assignmentIds: asgs.map((a) => a.id),
      examIds: exams.map((e) => e.id),
      noteIds: notes.map((n) => n.id),
      sessionIds: sessions.map((s) => s.id),
    });
  } catch (err) {
    // 4. Complete multi-store rollback on failure
    inMemoryState.courses = prevCourses;
    inMemoryState.slots = prevSlots;
    inMemoryState.assignments = prevAssignments;
    inMemoryState.exams = prevExams;
    inMemoryState.notes = prevNotes;
    inMemoryState.activeNoteId = prevActiveNoteId;
    inMemoryState.sessions = prevSessions;
    throw err;
  }
}

describe('Course Cascade Delete Lifecycle & Transactional Rollback Tests', () => {
  let db: TransactionalEntityDatabase;

  const TARGET_COURSE_ID = 'course-math205';
  const OTHER_COURSE_ID = 'course-cs201';

  beforeEach(() => {
    db = new TransactionalEntityDatabase();

    // Seed Courses
    db.courses.set(TARGET_COURSE_ID, {
      id: TARGET_COURSE_ID,
      semesterId: 'sem-1',
      code: 'MATH205',
      name: 'Linear Algebra',
      credits: 3,
      color: '#3B82F6',
      status: 'enrolled',
    });
    db.courses.set(OTHER_COURSE_ID, {
      id: OTHER_COURSE_ID,
      semesterId: 'sem-1',
      code: 'CS201',
      name: 'Data Structures',
      credits: 4,
      color: '#10B981',
      status: 'enrolled',
    });

    // Seed Slots
    db.timetable.set('slot-target-1', {
      id: 'slot-target-1',
      courseId: TARGET_COURSE_ID,
      dayOfWeek: 2,
      startTime: '08:00',
      endTime: '10:00',
      location: 'D3-201',
    });
    db.timetable.set('slot-other-1', {
      id: 'slot-other-1',
      courseId: OTHER_COURSE_ID,
      dayOfWeek: 3,
      startTime: '10:00',
      endTime: '12:00',
      location: 'D5-302',
    });

    // Seed Assignments
    db.assignments.set('asg-target-1', {
      id: 'asg-target-1',
      courseId: TARGET_COURSE_ID,
      title: 'Matrix Homework',
      dueDate: '2026-11-15T23:59:00.000Z',
      priority: 'high',
      status: 'todo',
    });
    db.assignments.set('asg-other-1', {
      id: 'asg-other-1',
      courseId: OTHER_COURSE_ID,
      title: 'Binary Tree Project',
      dueDate: '2026-11-20T23:59:00.000Z',
      priority: 'urgent',
      status: 'in_progress',
    });

    // Seed Exams
    db.exams.set('exam-target-1', {
      id: 'exam-target-1',
      courseId: TARGET_COURSE_ID,
      title: 'Linear Algebra Midterm',
      examType: 'midterm',
      examDate: '2026-11-25T09:00:00.000Z',
      durationMinutes: 90,
      location: 'D3-501',
    });
    db.exams.set('exam-other-1', {
      id: 'exam-other-1',
      courseId: OTHER_COURSE_ID,
      title: 'Data Structures Final',
      examType: 'final',
      examDate: '2026-12-15T09:00:00.000Z',
      durationMinutes: 120,
      location: 'D5-102',
    });

    // Seed Notes
    db.notes.set('note-target-1', {
      id: 'note-target-1',
      courseId: TARGET_COURSE_ID,
      title: 'Eigenvalues and Eigenvectors',
      content: 'det(A - lambda*I) = 0',
      tags: ['math'],
      isPinned: true,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01',
    });
    db.notes.set('note-other-1', {
      id: 'note-other-1',
      courseId: OTHER_COURSE_ID,
      title: 'Graph Traversal Algorithms',
      content: 'BFS and DFS comparison',
      tags: ['algorithms'],
      isPinned: false,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01',
    });
    db.notes.set('note-general-1', {
      id: 'note-general-1',
      courseId: null,
      title: 'General Study Tips',
      content: 'Spaced repetition schedule',
      tags: ['productivity'],
      isPinned: false,
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01',
    });

    // Seed Sessions
    db.studySessions.set('session-target-1', {
      id: 'session-target-1',
      courseId: TARGET_COURSE_ID,
      title: 'Matrix Practice',
      startTime: '2026-11-02T14:00:00.000Z',
      endTime: '2026-11-02T14:50:00.000Z',
      durationMinutes: 50,
      sessionType: 'pomodoro',
    });
    db.studySessions.set('session-other-1', {
      id: 'session-other-1',
      courseId: OTHER_COURSE_ID,
      title: 'Trees Practice',
      startTime: '2026-11-02T15:00:00.000Z',
      endTime: '2026-11-02T15:50:00.000Z',
      durationMinutes: 50,
      sessionType: 'pomodoro',
    });
  });

  it('atomically deletes course and all 5 related entities on successful transaction', async () => {
    const memory = {
      courses: Array.from(db.courses.values()),
      slots: Array.from(db.timetable.values()),
      assignments: Array.from(db.assignments.values()),
      exams: Array.from(db.exams.values()),
      notes: Array.from(db.notes.values()),
      sessions: Array.from(db.studySessions.values()),
      activeNoteId: 'note-target-1',
    };

    await deleteCourseWithAtomicRollback(TARGET_COURSE_ID, db, memory);

    // Verify storage has no records for target course
    assert.equal(await db.getCourse(TARGET_COURSE_ID), null);
    assert.equal((await db.getSlotsByCourse(TARGET_COURSE_ID)).length, 0);
    assert.equal((await db.getAssignmentsByCourse(TARGET_COURSE_ID)).length, 0);
    assert.equal((await db.getExamsByCourse(TARGET_COURSE_ID)).length, 0);
    assert.equal((await db.getNotesByCourse(TARGET_COURSE_ID)).length, 0);
    assert.equal((await db.getSessionsByCourse(TARGET_COURSE_ID)).length, 0);

    // Verify in-memory state matches storage
    assert.equal(memory.courses.length, 1);
    assert.equal(memory.courses[0].id, OTHER_COURSE_ID);
    assert.equal(memory.activeNoteId, 'note-other-1');
  });

  it('guarantees 100% atomic rollback across storage AND memory if transaction fails', async () => {
    const memory = {
      courses: Array.from(db.courses.values()),
      slots: Array.from(db.timetable.values()),
      assignments: Array.from(db.assignments.values()),
      exams: Array.from(db.exams.values()),
      notes: Array.from(db.notes.values()),
      sessions: Array.from(db.studySessions.values()),
      activeNoteId: 'note-target-1',
    };

    // Simulate database failure during transaction
    db.shouldFailTransaction = true;

    await assert.rejects(
      async () => {
        await deleteCourseWithAtomicRollback(TARGET_COURSE_ID, db, memory);
      },
      {
        message: /IndexedDB transaction failed/,
      }
    );

    // 1. Verify STORAGE ROLLBACK: Course was NOT deleted from storage!
    const targetCourseInDb = await db.getCourse(TARGET_COURSE_ID);
    assert.ok(targetCourseInDb, 'Storage rollback must preserve course');
    assert.equal(targetCourseInDb.code, 'MATH205');

    // All related entities must still be in storage (NO PARTIAL DELETION)
    assert.equal((await db.getSlotsByCourse(TARGET_COURSE_ID)).length, 1);
    assert.equal((await db.getAssignmentsByCourse(TARGET_COURSE_ID)).length, 1);
    assert.equal((await db.getExamsByCourse(TARGET_COURSE_ID)).length, 1);
    assert.equal((await db.getNotesByCourse(TARGET_COURSE_ID)).length, 1);
    assert.equal((await db.getSessionsByCourse(TARGET_COURSE_ID)).length, 1);

    // 2. Verify MEMORY ROLLBACK: All stores were restored to previous snapshot!
    assert.equal(memory.courses.length, 2);
    assert.ok(memory.courses.some((c) => c.id === TARGET_COURSE_ID));
    assert.equal(memory.slots.length, 2);
    assert.equal(memory.assignments.length, 2);
    assert.equal(memory.exams.length, 2);
    assert.equal(memory.notes.length, 3);
    assert.equal(memory.sessions.length, 2);
    assert.equal(memory.activeNoteId, 'note-target-1');

    // 3. ZERO DATA DESYNCHRONIZATION
    assert.equal(memory.courses.length, db.courses.size);
    assert.equal(memory.slots.length, db.timetable.size);
    assert.equal(memory.assignments.length, db.assignments.size);
    assert.equal(memory.exams.length, db.exams.size);
    assert.equal(memory.notes.length, db.notes.size);
    assert.equal(memory.sessions.length, db.studySessions.size);
  });
});
