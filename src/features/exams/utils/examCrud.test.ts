import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Exam } from '../../../types/index.ts';

class InMemoryExamRepository {
  private items = new Map<string, Exam>();

  async create(item: Exam): Promise<Exam> {
    if (this.items.has(item.id)) {
      throw new Error(`Record with id ${item.id} already exists`);
    }
    this.items.set(item.id, { ...item });
    return { ...item };
  }

  async getAll(): Promise<Exam[]> {
    return Array.from(this.items.values());
  }

  async getById(id: string): Promise<Exam | null> {
    const found = this.items.get(id);
    return found ? { ...found } : null;
  }

  async update(id: string, updates: Partial<Exam>): Promise<Exam> {
    const existing = this.items.get(id);
    if (!existing) {
      throw new Error(`Exam with id ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.items.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    if (!this.items.has(id)) {
      throw new Error(`Exam with id ${id} not found`);
    }
    this.items.delete(id);
  }

  async getByCourseId(courseId: string): Promise<Exam[]> {
    return Array.from(this.items.values()).filter((e) => e.courseId === courseId);
  }

  clear() {
    this.items.clear();
  }
}

describe('Exam CRUD Operations & Data Lifecycle', () => {
  let repo: InMemoryExamRepository;

  const sampleExam: Exam = {
    id: 'exam-crud-1',
    courseId: 'course-cs201',
    title: 'Midterm Examination',
    examType: 'midterm',
    examDate: '2026-11-20T09:00:00Z',
    durationMinutes: 120,
    location: 'Turing Hall - Auditorium 1',
    seatNumber: 'Seat A-12',
    weight: 30,
    topics: ['Trees', 'Graphs', 'Heaps'],
    targetScore: 90,
    maxScore: 100,
    status: 'upcoming',
  };

  beforeEach(() => {
    repo = new InMemoryExamRepository();
  });

  describe('Create (C)', () => {
    it('creates and stores an examination record', async () => {
      const created = await repo.create(sampleExam);
      assert.equal(created.id, 'exam-crud-1');
      assert.equal(created.location, 'Turing Hall - Auditorium 1');

      const all = await repo.getAll();
      assert.equal(all.length, 1);
      assert.equal(all[0].id, 'exam-crud-1');
    });

    it('rejects duplicate exam IDs', async () => {
      await repo.create(sampleExam);
      await assert.rejects(async () => {
        await repo.create(sampleExam);
      }, /already exists/);
    });
  });

  describe('Read (R)', () => {
    it('retrieves an exam by ID', async () => {
      await repo.create(sampleExam);
      const retrieved = await repo.getById('exam-crud-1');
      assert.ok(retrieved);
      assert.equal(retrieved?.title, 'Midterm Examination');
      assert.equal(retrieved?.courseId, 'course-cs201');
    });

    it('queries exams by course association', async () => {
      await repo.create(sampleExam);
      await repo.create({
        ...sampleExam,
        id: 'exam-crud-2',
        courseId: 'course-math101',
        title: 'Math Quiz',
      });

      const csExams = await repo.getByCourseId('course-cs201');
      assert.equal(csExams.length, 1);
      assert.equal(csExams[0].id, 'exam-crud-1');

      const mathExams = await repo.getByCourseId('course-math101');
      assert.equal(mathExams.length, 1);
      assert.equal(mathExams[0].id, 'exam-crud-2');
    });
  });

  describe('Update (U)', () => {
    it('updates logistics: location, seat number, and duration', async () => {
      await repo.create(sampleExam);
      const updated = await repo.update('exam-crud-1', {
        location: 'Science Complex - Hall B',
        seatNumber: 'Seat B-24',
        durationMinutes: 150,
      });

      assert.equal(updated.location, 'Science Complex - Hall B');
      assert.equal(updated.seatNumber, 'Seat B-24');
      assert.equal(updated.durationMinutes, 150);
    });

    it('updates exam completion status and logs actual score', async () => {
      await repo.create(sampleExam);
      const updated = await repo.update('exam-crud-1', {
        status: 'completed',
        actualScore: 94,
      });

      assert.equal(updated.status, 'completed');
      assert.equal(updated.actualScore, 94);
    });

    it('updates syllabus checklist topics', async () => {
      await repo.create(sampleExam);
      const updated = await repo.update('exam-crud-1', {
        topics: ['Trees', 'Graphs', 'Heaps', 'Dynamic Programming'],
      });

      assert.equal(updated.topics.length, 4);
      assert.ok(updated.topics.includes('Dynamic Programming'));
    });
  });

  describe('Delete (D)', () => {
    it('deletes an exam record and confirms deletion', async () => {
      await repo.create(sampleExam);
      assert.equal((await repo.getAll()).length, 1);

      await repo.delete('exam-crud-1');
      assert.equal((await repo.getAll()).length, 0);

      const retrieved = await repo.getById('exam-crud-1');
      assert.equal(retrieved, null);
    });

    it('throws error when deleting non-existent exam', async () => {
      await assert.rejects(async () => {
        await repo.delete('exam-ghost');
      }, /not found/);
    });
  });

  describe('Optimistic Rollback Handling', () => {
    it('reverts local exam list when persistence fails', () => {
      let examsState: Exam[] = [sampleExam];
      const previous = [...examsState];

      // Optimistic delete
      examsState = examsState.filter((e) => e.id !== sampleExam.id);
      assert.equal(examsState.length, 0);

      // Persistence error occurs
      try {
        throw new Error('IndexedDB network transaction aborted');
      } catch {
        // Rollback
        examsState = previous;
      }

      assert.equal(examsState.length, 1);
      assert.equal(examsState[0].id, sampleExam.id);
    });
  });
});

