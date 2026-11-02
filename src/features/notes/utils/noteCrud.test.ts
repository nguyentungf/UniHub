import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Note } from '../../../types/index.ts';

/**
 * In-memory repository simulating Note DAL IndexedDB semantics
 */
class InMemoryNoteRepository {
  private items = new Map<string, Note>();
  public shouldFail = false;

  async create(item: Note): Promise<Note> {
    if (this.shouldFail) {
      throw new Error('IndexedDB transaction failed: QuotaExceededError');
    }
    if (this.items.has(item.id)) {
      throw new Error(`Record with id ${item.id} already exists`);
    }
    this.items.set(item.id, { ...item });
    return { ...item };
  }

  async getAll(): Promise<Note[]> {
    return Array.from(this.items.values());
  }

  async getById(id: string): Promise<Note | null> {
    const found = this.items.get(id);
    return found ? { ...found } : null;
  }

  async update(id: string, updates: Partial<Note>): Promise<Note> {
    if (this.shouldFail) {
      throw new Error('IndexedDB update failed');
    }
    const existing = this.items.get(id);
    if (!existing) {
      throw new Error(`Note with id ${id} not found`);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.items.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error('IndexedDB delete failed');
    }
    if (!this.items.has(id)) {
      throw new Error(`Note with id ${id} not found`);
    }
    this.items.delete(id);
  }

  async getByCourseId(courseId: string): Promise<Note[]> {
    return Array.from(this.items.values()).filter((n) => n.courseId === courseId);
  }

  clear() {
    this.items.clear();
    this.shouldFail = false;
  }
}

describe('Note Persistence & CRUD Lifecycle Tests', () => {
  let repo: InMemoryNoteRepository;

  beforeEach(() => {
    repo = new InMemoryNoteRepository();
  });

  it('creates and persists a new note in offline storage', async () => {
    const note: Note = {
      id: 'note-001',
      courseId: 'course-cs201',
      title: 'Red-Black Trees Overview',
      content: '# Red-Black Trees Properties\n1. Every node is red or black.',
      tags: ['trees', 'algorithms'],
      isPinned: false,
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z',
    };

    const created = await repo.create(note);
    assert.equal(created.id, 'note-001');

    const fetched = await repo.getById('note-001');
    assert.ok(fetched);
    assert.equal(fetched.title, 'Red-Black Trees Overview');
  });

  it('rejects duplicate note IDs on creation', async () => {
    const note: Note = {
      id: 'note-dup',
      title: 'First',
      content: '',
      tags: [],
      isPinned: false,
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z',
    };

    await repo.create(note);

    await assert.rejects(
      async () => {
        await repo.create(note);
      },
      {
        message: 'Record with id note-dup already exists',
      }
    );
  });

  it('updates note content and title during autosave', async () => {
    const note: Note = {
      id: 'note-autosave',
      title: 'Draft Note',
      content: 'Initial text...',
      tags: ['draft'],
      isPinned: false,
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z',
    };

    await repo.create(note);

    const updated = await repo.update('note-autosave', {
      title: 'Final Note',
      content: 'Updated content from user typing',
    });

    assert.equal(updated.title, 'Final Note');
    assert.equal(updated.content, 'Updated content from user typing');
  });

  it('toggles pin status and verifies persistence', async () => {
    const note: Note = {
      id: 'note-pin',
      title: 'Pin Test',
      content: '',
      tags: [],
      isPinned: false,
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z',
    };

    await repo.create(note);
    assert.equal((await repo.getById('note-pin'))?.isPinned, false);

    await repo.update('note-pin', { isPinned: true });
    assert.equal((await repo.getById('note-pin'))?.isPinned, true);
  });

  it('deletes an existing note record and handles non-existent IDs', async () => {
    const note: Note = {
      id: 'note-del',
      title: 'To Delete',
      content: '',
      tags: [],
      isPinned: false,
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z',
    };

    await repo.create(note);
    assert.equal((await repo.getAll()).length, 1);

    await repo.delete('note-del');
    assert.equal((await repo.getAll()).length, 0);

    await assert.rejects(
      async () => {
        await repo.delete('note-del');
      },
      {
        message: 'Note with id note-del not found',
      }
    );
  });

  it('rolls back in-memory optimistic updates when storage persistence fails', async () => {
    let localNotes: Note[] = [
      {
        id: 'orig-note',
        title: 'Original Title',
        content: 'Original Content',
        tags: [],
        isPinned: false,
        createdAt: '2026-11-01T10:00:00.000Z',
        updatedAt: '2026-11-01T10:00:00.000Z',
      },
    ];

    const snapshot = [...localNotes];

    // Optimistic update
    localNotes = localNotes.map((n) =>
      n.id === 'orig-note' ? { ...n, title: 'Mutated Title' } : n
    );
    assert.equal(localNotes[0].title, 'Mutated Title');

    // Storage failure simulation
    repo.shouldFail = true;

    try {
      await repo.update('orig-note', { title: 'Mutated Title' });
      assert.fail('Should have failed');
    } catch {
      // Rollback
      localNotes = snapshot;
    }

    assert.equal(localNotes[0].title, 'Original Title');
  });
});

