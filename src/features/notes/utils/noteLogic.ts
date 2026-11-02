import type { Note } from '../../../types/index.ts';

export interface NoteFilterOptions {
  query?: string;
  tag?: string;
  courseId?: string | 'all';
}

export interface NoteMetrics {
  wordCount: number;
  characterCount: number;
  estimatedReadingTimeMinutes: number;
}

/**
 * Filter and sort notes
 * Rules:
 * 1. Pinned notes appear first
 * 2. Secondary sort: latest updatedAt descending
 * 3. Case-insensitive search on title and content
 * 4. Tag matching
 * 5. Course ID matching
 */
export function filterAndSortNotes(
  notes: Note[],
  options: NoteFilterOptions = {}
): Note[] {
  const { query, tag, courseId } = options;
  const cleanQuery = query ? query.trim().toLowerCase() : '';

  return notes
    .filter((note) => {
      // 1. Course Filter
      if (courseId && courseId !== 'all') {
        if (note.courseId !== courseId) return false;
      }

      // 2. Tag Filter
      if (tag && tag !== 'all') {
        const hasTag = note.tags.some(
          (t) => t.toLowerCase() === tag.toLowerCase()
        );
        if (!hasTag) return false;
      }

      // 3. Search Query
      if (cleanQuery) {
        const titleMatch = note.title.toLowerCase().includes(cleanQuery);
        const contentMatch = note.content.toLowerCase().includes(cleanQuery);
        const tagMatch = note.tags.some((t) => t.toLowerCase().includes(cleanQuery));
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Pinned notes always come first
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      // Then newest updatedAt first
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

/**
 * Extract unique tags and their frequencies from note collection
 */
export function extractUniqueTags(notes: Note[]): { tag: string; count: number }[] {
  const tagCountMap = new Map<string, number>();

  for (const note of notes) {
    for (const rawTag of note.tags) {
      const t = rawTag.trim().toLowerCase();
      if (t) {
        tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1);
      }
    }
  }

  return Array.from(tagCountMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Clean and normalize a tag input string
 */
export function cleanTags(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return Array.from(
      new Set(
        input
          .map((t) => t.trim().replace(/^#/, ''))
          .filter((t) => t.length > 0)
      )
    );
  }

  return Array.from(
    new Set(
      input
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter((t) => t.length > 0)
    )
  );
}

/**
 * Calculate reading metrics for a note's text content
 */
export function calculateNoteMetrics(content: string): NoteMetrics {
  const trimmed = content.trim();
  const characterCount = trimmed.length;

  if (characterCount === 0) {
    return {
      wordCount: 0,
      characterCount: 0,
      estimatedReadingTimeMinutes: 0,
    };
  }

  // Count words by whitespace separation
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Average reading speed: 200 words per minute
  const estimatedReadingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    wordCount,
    characterCount,
    estimatedReadingTimeMinutes,
  };
}

