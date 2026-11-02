import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortNotes,
  extractUniqueTags,
  cleanTags,
  calculateNoteMetrics,
} from './noteLogic.ts';
import type { Note } from '../../../types/index.ts';

describe('Note Business Logic & Selectors Tests', () => {
  const sampleNotes: Note[] = [
    {
      id: 'n-1',
      courseId: 'course-cs201',
      title: 'Binary Search Trees & AVL Trees',
      content: '# BST Traversal\nIn-order, pre-order, and post-order depth-first searches.',
      tags: ['algorithms', 'trees', 'midterm'],
      isPinned: false,
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-10T14:00:00.000Z',
    },
    {
      id: 'n-2',
      courseId: 'course-cs201',
      title: 'Graph Algorithms: Dijkstra & A*',
      content: '# Shortest Path\nUsing priority queue min-heap for greedy selection.',
      tags: ['algorithms', 'graphs'],
      isPinned: true, // Pinned!
      createdAt: '2026-10-05T08:00:00.000Z',
      updatedAt: '2026-10-08T12:00:00.000Z',
    },
    {
      id: 'n-3',
      courseId: 'course-math205',
      title: 'Eigenvalues & Diagonalization',
      content: 'Characteristic polynomial det(A - lambda*I) = 0.',
      tags: ['math', 'matrices', 'midterm'],
      isPinned: false,
      createdAt: '2026-10-02T08:00:00.000Z',
      updatedAt: '2026-10-12T16:00:00.000Z',
    },
    {
      id: 'n-4',
      courseId: null, // General note
      title: 'Semester Study Plan & Habits',
      content: 'Daily Pomodoro 4 cycles in the morning.',
      tags: ['productivity', 'habits'],
      isPinned: false,
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-03T09:00:00.000Z',
    },
  ];

  describe('filterAndSortNotes', () => {
    it('always places pinned notes before unpinned notes', () => {
      const sorted = filterAndSortNotes(sampleNotes);
      assert.equal(sorted[0].id, 'n-2'); // Pinned
      assert.equal(sorted[0].isPinned, true);
    });

    it('sorts unpinned notes by newest updatedAt date descending', () => {
      const sorted = filterAndSortNotes(sampleNotes);
      // n-2 is pinned (first), then n-3 (Oct 12), n-1 (Oct 10), n-4 (Oct 3)
      assert.equal(sorted[1].id, 'n-3');
      assert.equal(sorted[2].id, 'n-1');
      assert.equal(sorted[3].id, 'n-4');
    });

    it('filters notes by search query across title, content, and tags', () => {
      const byTitle = filterAndSortNotes(sampleNotes, { query: 'Dijkstra' });
      assert.equal(byTitle.length, 1);
      assert.equal(byTitle[0].id, 'n-2');

      const byContent = filterAndSortNotes(sampleNotes, { query: 'Characteristic polynomial' });
      assert.equal(byContent.length, 1);
      assert.equal(byContent[0].id, 'n-3');

      const byTag = filterAndSortNotes(sampleNotes, { query: 'graphs' });
      assert.equal(byTag.length, 1);
      assert.equal(byTag[0].id, 'n-2');
    });

    it('filters notes by specific tag', () => {
      const midtermNotes = filterAndSortNotes(sampleNotes, { tag: 'midterm' });
      assert.equal(midtermNotes.length, 2);
      assert.ok(midtermNotes.some((n) => n.id === 'n-1'));
      assert.ok(midtermNotes.some((n) => n.id === 'n-3'));
    });

    it('filters notes by course association', () => {
      const csNotes = filterAndSortNotes(sampleNotes, { courseId: 'course-cs201' });
      assert.equal(csNotes.length, 2);
      assert.ok(csNotes.every((n) => n.courseId === 'course-cs201'));
    });
  });

  describe('extractUniqueTags', () => {
    it('extracts unique tags with counts sorted by frequency', () => {
      const tags = extractUniqueTags(sampleNotes);
      // 'algorithms' and 'midterm' both appear twice
      const algorithms = tags.find((t) => t.tag === 'algorithms');
      assert.ok(algorithms);
      assert.equal(algorithms.count, 2);

      const midterm = tags.find((t) => t.tag === 'midterm');
      assert.ok(midterm);
      assert.equal(midterm.count, 2);

      const graphs = tags.find((t) => t.tag === 'graphs');
      assert.ok(graphs);
      assert.equal(graphs.count, 1);
    });
  });

  describe('cleanTags', () => {
    it('normalizes string input, removes leading hashes and empties', () => {
      const cleaned = cleanTags('#algorithms,  trees,   #midterm , , ');
      assert.deepEqual(cleaned, ['algorithms', 'trees', 'midterm']);
    });

    it('normalizes array input and eliminates duplicates', () => {
      const cleaned = cleanTags(['#math', 'math', 'algebra']);
      assert.deepEqual(cleaned, ['math', 'algebra']);
    });
  });

  describe('calculateNoteMetrics', () => {
    it('computes word count, character count, and estimated reading time', () => {
      const text = 'Hello world! This is a test note for estimating reading speed and word counts.';
      const metrics = calculateNoteMetrics(text);
      assert.equal(metrics.wordCount, 14);
      assert.equal(metrics.characterCount, text.length);
      assert.equal(metrics.estimatedReadingTimeMinutes, 1);
    });

    it('returns zero metrics for blank or empty content', () => {
      const metrics = calculateNoteMetrics('    ');
      assert.equal(metrics.wordCount, 0);
      assert.equal(metrics.characterCount, 0);
      assert.equal(metrics.estimatedReadingTimeMinutes, 0);
    });
  });
});
