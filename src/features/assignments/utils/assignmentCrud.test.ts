import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Assignment, AssignmentStatus } from '../../../types/index.ts';

/**
 * In-memory repository simulating DAL CRUD semantics
 */
class InMemoryAssignmentRepository {
  private items = new Map<string, Assignment>();

  async create(item: Assignment): Promise<Assignment> {
    if (this.items.has(item.id)) {
      throw new Error(`Record with id ${item.id} already exists`);
    }
    this.items.set(item.id, { ...item });
    return { ...item };
  }

  async getAll(): Promise<Assignment[]> {
    return Array.from(this.items.values());
  }

  async getById(id: string): Promise<Assignment | null> {
    const found = this.items.get(id);
    return found ? { ...found } : null;
  }

  async update(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    const existing = this.items.get(id);
    if (!existing) {
      throw new Error(`Assignment with id ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.items.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    if (!this.items.has(id)) {
      throw new Error(`Assignment with id ${id} not found`);
    }
    this.items.delete(id);
  }

  async getByCourseId(courseId: string): Promise<Assignment[]> {
    return Array.from(this.items.values()).filter((a) => a.courseId === courseId);
  }

  async getByStatus(status: AssignmentStatus): Promise<Assignment[]> {
    return Array.from(this.items.values()).filter((a) => a.status === status);
  }

  clear() {
    this.items.clear();
  }
}

describe('Assignment CRUD Operations & Data Lifecycle', () => {
  let repo: InMemoryAssignmentRepository;

  const sampleAssignment: Assignment = {
    id: 'asg-test-1',
    courseId: 'course-cs201',
    title: 'B-Tree Implementation',
    description: 'Implement B-Tree splitting and indexing',
    dueDate: '2026-11-25T23:59:00Z',
    priority: 'high',
    status: 'todo',
    weight: 15,
    maxScore: 100,
  };

  beforeEach(() => {
    repo = new InMemoryAssignmentRepository();
  });

  describe('Create (C)', () => {
    it('creates and persists a new assignment', async () => {
      const created = await repo.create(sampleAssignment);
      assert.equal(created.id, 'asg-test-1');
      assert.equal(created.title, 'B-Tree Implementation');

      const all = await repo.getAll();
      assert.equal(all.length, 1);
      assert.equal(all[0].id, 'asg-test-1');
    });

    it('rejects duplicate ID creations', async () => {
      await repo.create(sampleAssignment);
      await assert.rejects(async () => {
        await repo.create(sampleAssignment);
      }, /already exists/);
    });
  });

  describe('Read (R)', () => {
    it('reads an assignment by ID', async () => {
      await repo.create(sampleAssignment);
      const retrieved = await repo.getById('asg-test-1');
      assert.ok(retrieved);
      assert.equal(retrieved?.id, 'asg-test-1');
      assert.equal(retrieved?.courseId, 'course-cs201');
    });

    it('returns null for non-existent IDs', async () => {
      const retrieved = await repo.getById('non-existent');
      assert.equal(retrieved, null);
    });

    it('queries assignments by courseId and status', async () => {
      await repo.create(sampleAssignment);
      await repo.create({
        ...sampleAssignment,
        id: 'asg-test-2',
        courseId: 'course-math101',
        status: 'completed',
      });

      const csAssignments = await repo.getByCourseId('course-cs201');
      assert.equal(csAssignments.length, 1);
      assert.equal(csAssignments[0].id, 'asg-test-1');

      const completed = await repo.getByStatus('completed');
      assert.equal(completed.length, 1);
      assert.equal(completed[0].id, 'asg-test-2');
    });
  });

  describe('Update (U)', () => {
    it('updates title, priority, and description', async () => {
      await repo.create(sampleAssignment);
      const updated = await repo.update('asg-test-1', {
        title: 'B-Tree & B+Tree Implementation',
        priority: 'urgent',
        weight: 20,
      });

      assert.equal(updated.title, 'B-Tree & B+Tree Implementation');
      assert.equal(updated.priority, 'urgent');
      assert.equal(updated.weight, 20);

      const fetched = await repo.getById('asg-test-1');
      assert.equal(fetched?.title, 'B-Tree & B+Tree Implementation');
    });

    it('updates status from todo -> in_progress -> completed', async () => {
      await repo.create(sampleAssignment);

      const step1 = await repo.update('asg-test-1', { status: 'in_progress' });
      assert.equal(step1.status, 'in_progress');

      const step2 = await repo.update('asg-test-1', {
        status: 'completed',
        earnedScore: 96,
      });
      assert.equal(step2.status, 'completed');
      assert.equal(step2.earnedScore, 96);
    });

    it('throws error when updating nonexistent record', async () => {
      await assert.rejects(async () => {
        await repo.update('asg-unknown', { status: 'completed' });
      }, /not found/);
    });
  });

  describe('Delete (D)', () => {
    it('deletes an existing assignment', async () => {
      await repo.create(sampleAssignment);
      assert.equal((await repo.getAll()).length, 1);

      await repo.delete('asg-test-1');
      assert.equal((await repo.getAll()).length, 0);

      const retrieved = await repo.getById('asg-test-1');
      assert.equal(retrieved, null);
    });

    it('throws error when attempting to delete non-existent ID', async () => {
      await assert.rejects(async () => {
        await repo.delete('non-existent');
      }, /not found/);
    });
  });

  describe('Optimistic UI Rollback Pattern', () => {
    it('rolls back in-memory state on persistence failure', async () => {
      // Simulating store optimistic update pattern
      let storeState: Assignment[] = [sampleAssignment];
      const previous = [...storeState];

      // Optimistic update: advance status
      const updatedItem: Assignment = { ...sampleAssignment, status: 'completed' };
      storeState = storeState.map((a) => (a.id === sampleAssignment.id ? updatedItem : a));
      assert.equal(storeState[0].status, 'completed');

      // Persistence fails
      try {
        throw new Error('Storage write failed: quota exceeded');
      } catch {
        // Rollback
        storeState = previous;
      }

      assert.equal(storeState[0].status, 'todo');
    });
  });
});

