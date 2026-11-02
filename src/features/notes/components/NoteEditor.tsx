import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Quote,
  Table as TableIcon,
  Eye,
  Edit3,
  Columns,
  Pin,
  Trash2,
  Check,
  Clock,
  Tag as TagIcon,
  X,
  Plus,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/common';
import type { Note, Course } from '@/types';
import { MarkdownPreview } from './MarkdownPreview';
import { calculateNoteMetrics, cleanTags } from '../utils/noteLogic';
import { formatDateTime } from '@/lib/utils';

export interface NoteEditorProps {
  note: Note;
  courses: Course[];
  onUpdateNote: (id: string, updates: Partial<Note>) => Promise<Note>;
  onDeleteNote: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
}

export type ViewMode = 'edit' | 'split' | 'preview';

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  courses,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
}) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [courseId, setCourseId] = useState<string | null>(note.courseId || null);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // Autosave State: 'saved' | 'saving' | 'dirty'
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isFirstMount = useRef(true);

  // Sync state when active note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setCourseId(note.courseId || null);
    setTags(note.tags || []);
    setSaveStatus('saved');
    isFirstMount.current = true;
  }, [note.id]);

  // Debounced Autosave (750ms after typing ceases)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    setSaveStatus('dirty');
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await onUpdateNote(note.id, {
          title: title.trim() || 'Untitled Note',
          content,
          courseId,
          tags,
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('dirty');
      }
    }, 750);

    return () => clearTimeout(timer);
  }, [title, content, courseId, tags, note.id, onUpdateNote]);

  // Helper to insert markdown formatting tokens around cursor/selection
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 0);
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();

    const cleaned = cleanTags(newTagInput);
    if (cleaned.length > 0) {
      const merged = Array.from(new Set([...tags, ...cleaned]));
      setTags(merged);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDeleteNote(note.id);
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === courseId);
  const metrics = calculateNoteMetrics(content);

  return (
    <Card className="min-h-[640px] flex flex-col justify-between p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <div className="space-y-4">
        {/* Top Header: Title, Course Badge, Autosave Status, View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title..."
              className="w-full text-xl font-black text-slate-900 dark:text-white bg-transparent border-none p-0 focus:outline-hidden focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>Updated {formatDateTime(note.updatedAt)}</span>

              {/* Autosave Indicator */}
              <div className="flex items-center gap-1.5 font-medium">
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                )}
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 animate-pulse">
                    <Clock className="h-3 w-3" /> Saving to IndexedDB...
                  </span>
                )}
                {saveStatus === 'dirty' && (
                  <span className="text-amber-500">Unsaved edits...</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold select-none">
              <button
                onClick={() => setViewMode('edit')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'edit'
                    ? 'bg-white shadow-xs text-brand-600 dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Edit Markdown"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'split'
                    ? 'bg-white shadow-xs text-brand-600 dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Split View (Editor + Live Preview)"
              >
                <Columns className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-white shadow-xs text-brand-600 dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Preview Rendered Markdown"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Pin Toggle */}
            <button
              onClick={() => onTogglePin(note.id)}
              className={`p-2 rounded-xl border transition-colors ${
                note.isPinned
                  ? 'border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'border-slate-200 text-slate-400 hover:text-slate-700 dark:border-slate-800 dark:hover:text-slate-200'
              }`}
              title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin className="h-4 w-4 fill-current" />
            </button>

            {/* Delete Note */}
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 dark:border-slate-800 dark:hover:text-rose-400 transition-colors"
              title="Delete Note"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Course Link & Tags Bar */}
        <div className="flex flex-wrap items-center gap-3 py-1">
          {/* Course Association Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400">Course:</span>
            <select
              value={courseId || ''}
              onChange={(e) => setCourseId(e.target.value || null)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 shadow-xs cursor-pointer focus:ring-2 focus:ring-brand-500"
            >
              <option value="">General (No Course)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.name}
                </option>
              ))}
            </select>
            {selectedCourse && (
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedCourse.color }}
              />
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Interactive Tag Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <TagIcon className="h-3 w-3 text-slate-400" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="+ tag"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-16 rounded-lg border border-slate-200 px-1.5 py-0.5 text-[11px] bg-transparent text-slate-700 dark:border-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Markdown Toolbar (Visible in edit or split modes) */}
        {viewMode !== 'preview' && (
          <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <button
              onClick={() => insertFormatting('**', '**')}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Bold (**text**)"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('*', '*')}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Italic (*text*)"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('# ')}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Heading 1 (#)"
            >
              <Heading1 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('## ')}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Heading 2 (##)"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('`', '`')}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Inline Code (`code`)"
            >
              <Code className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('```ts\n', '\n```')}
              className="px-1.5 py-0.5 rounded text-[11px] font-mono hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Code Block (```)"
            >
              &lt;/&gt;
            </button>
            <button
              onClick={() => insertFormatting('- ')}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Bullet List (- item)"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('- [ ] ')}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Task Item (- [ ] item)"
            >
              <CheckSquare className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('> ')}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Blockquote (> quote)"
            >
              <Quote className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() =>
                insertFormatting(
                  '\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Row 1 | Data 1 |\n| Row 2 | Data 2 |\n'
                )
              }
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors"
              title="Table Template"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* View Mode Content Panes */}
        <div className="pt-2">
          {viewMode === 'edit' && (
            <textarea
              ref={textareaRef}
              rows={20}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your study notes in markdown..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 shadow-inner resize-y"
            />
          )}

          {viewMode === 'preview' && (
            <div className="min-h-[460px] p-5 rounded-2xl border border-slate-100 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-950/40">
              <MarkdownPreview content={content} />
            </div>
          )}

          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                ref={textareaRef}
                rows={20}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your study notes in markdown..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 shadow-inner resize-y"
              />
              <div className="min-h-[420px] max-h-[520px] overflow-y-auto p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 shadow-inner">
                <MarkdownPreview content={content} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note Footer: Metrics */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>{metrics.wordCount} words</span>
          <span>·</span>
          <span>{metrics.characterCount} characters</span>
          <span>·</span>
          <span>~{metrics.estimatedReadingTimeMinutes} min read</span>
        </div>
        <div>
          <span>Press Enter or comma to create tags</span>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Study Note"
        description={`Are you sure you want to delete "${note.title}"? This note will be removed from your offline IndexedDB vault.`}
        confirmText="Delete Note"
        variant="danger"
        isLoading={isDeleting}
      />
    </Card>
  );
};

