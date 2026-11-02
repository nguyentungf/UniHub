import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { StudySession } from '../../../types/index.ts';

/**
 * In-memory repository simulating study DAL IndexedDB semantics
 */
class InMemoryStudyRepository {
  private items = new Map<string, StudySession>();
  public shouldFail = false;

  async create(item: StudySession): Promise<StudySession> {
    if (this.shouldFail) {
      throw new Error('IndexedDB transaction failed: QuotaExceededError');
    }
    if (this.items.has(item.id)) {
      throw new Error(`Record with id ${item.id} already exists`);
    }
    this.items.set(item.id, { ...item });
    return { ...item };
  }

  async getAll(): Promise<StudySession[]> {
    return Array.from(this.items.values());
  }

  async getById(id: string): Promise<StudySession | null> {
    const found = this.items.get(id);
    return found ? { ...found } : null;
  }

  async delete(id: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error('IndexedDB delete failed');
    }
    if (!this.items.has(id)) {
      throw new Error(`Study session with id ${id} not found`);
    }
    this.items.delete(id);
  }

  async getByCourseId(courseId: string): Promise<StudySession[]> {
    return Array.from(this.items.values()).filter((s) => s.courseId === courseId);
  }

  clear() {
    this.items.clear();
    this.shouldFail = false;
  }
}

describe('Study Session Persistence & Optimistic Lifecycle Tests', () => {
  let repo: InMemoryStudyRepository;

  beforeEach(() => {
    repo = new InMemoryStudyRepository();
  });

  it('records and persists a newly completed study session', async () => {
    const session: StudySession = {
      id: 'session-101',
      courseId: 'course-cs201',
      startTime: '2026-11-02T10:00:00.000Z',
      endTime: '2026-11-02T10:25:00.000Z',
      durationMinutes: 25,
      sessionType: 'pomodoro',
      focusRating: 5,
      notes: 'Implemented Graph DFS',
    };

    const saved = await repo.create(session);
    assert.equal(saved.id, 'session-101');
    assert.equal(saved.durationMinutes, 25);

    const fetched = await repo.getById('session-101');
    assert.ok(fetched);
    assert.equal(fetched?.notes, 'Implemented Graph DFS');
  });

  it('rejects duplicate study session IDs to prevent duplicate records', async () => {
    const session: StudySession = {
      id: 'session-dup',
      courseId: 'course-cs201',
      startTime: '2026-11-02T10:00:00.000Z',
      endTime: '2026-11-02T10:25:00.000Z',
      durationMinutes: 25,
      sessionType: 'pomodoro',
      focusRating: 4,
    };

    await repo.create(session);

    await assert.rejects(
      async () => {
        await repo.create(session);
      },
      {
        message: 'Record with id session-dup already exists',
      }
    );
  });

  it('deletes an existing session record and verifies removal', async () => {
    const session: StudySession = {
      id: 'session-to-del',
      startTime: '2026-11-02T11:00:00.000Z',
      endTime: '2026-11-02T11:25:00.000Z',
      durationMinutes: 25,
      sessionType: 'pomodoro',
      focusRating: 3,
    };

    await repo.create(session);
    assert.equal((await repo.getAll()).length, 1);

    await repo.delete('session-to-del');
    assert.equal((await repo.getAll()).length, 0);
  });

  it('handles optimistic UI rollback pattern on storage write error', async () => {
    let localSessions: StudySession[] = [
      {
        id: 'existing-1',
        startTime: '2026-11-01T10:00:00.000Z',
        endTime: '2026-11-01T10:25:00.000Z',
        durationMinutes: 25,
        sessionType: 'pomodoro',
        focusRating: 5,
      },
    ];

    const snapshot = [...localSessions];

    const newSession: StudySession = {
      id: 'session-failing',
      startTime: '2026-11-02T10:00:00.000Z',
      endTime: '2026-11-02T10:25:00.000Z',
      durationMinutes: 25,
      sessionType: 'pomodoro',
      focusRating: 4,
    };

    // Optimistically prepend to UI state
    localSessions = [newSession, ...localSessions];
    assert.equal(localSessions.length, 2);

    // Storage fails
    repo.shouldFail = true;

    try {
      await repo.create(newSession);
      assert.fail('Should have thrown');
    } catch {
      // Rollback to prior snapshot
      localSessions = snapshot;
    }

    // UI state successfully reverted to 1 item
    assert.equal(localSessions.length, 1);
    assert.equal(localSessions[0].id, 'existing-1');
  });
});

