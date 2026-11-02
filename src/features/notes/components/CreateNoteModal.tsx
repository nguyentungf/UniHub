import React, { useState } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import type { Course } from '@/types';
import { cleanTags } from '../utils/noteLogic';

export interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onCreate: (input: {
    title: string;
    content: string;
    courseId: string | null;
    tags: string[];
    isPinned: boolean;
  }) => Promise<void>;
}

export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  isOpen,
  onClose,
  courses,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedTags = cleanTags(tagsInput);
      const initialContent =
        content.trim() || `# ${title.trim()}\n\nWrite your lecture notes, formulas, or summaries here...`;

      await onCreate({
        title: title.trim(),
        content: initialContent,
        courseId: courseId ? courseId : null,
        tags: parsedTags,
        isPinned,
      });

      // Reset form
      setTitle('');
      setCourseId('');
      setTagsInput('');
      setContent('');
      setIsPinned(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Study Note"
      description="Capture lecture concepts, algorithms, exam cheatsheets, or revision notes"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Note Title *"
          placeholder="e.g. Graph Traversals (BFS & DFS) or Linear Transformations"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Course Link"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            options={[
              { value: '', label: 'General / No Course' },
              ...courses.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` })),
            ]}
          />

          <Input
            label="Tags (comma-separated)"
            placeholder="e.g. algorithms, graphs, midterm"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <Textarea
          label="Initial Markdown Content"
          placeholder="# Main Topic&#10;&#10;Key concepts:&#10;- Principle 1&#10;- Principle 2"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Pin this note to the top of the vault
          </span>
        </label>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Create Note
          </Button>
        </div>
      </form>
    </Modal>
  );
};

