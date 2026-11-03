import React from 'react';
import { Search, Pin, Plus, FileText, Tag as TagIcon, X } from 'lucide-react';
import { Input, Button, Badge } from '@/components/ui';
import { EmptyState } from '@/components/common';
import type { Note, Course } from '@/types';
import { formatDateTime } from '@/lib/utils';

export interface NoteListSidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  courses: Course[];
  searchQuery: string;
  selectedTag: string;
  selectedCourseId: string;
  uniqueTags: { tag: string; count: number }[];
  onSelectNote: (id: string) => void;
  onSearchChange: (query: string) => void;
  onTagChange: (tag: string) => void;
  onCourseChange: (courseId: string) => void;
  onTogglePin: (id: string) => void;
  onCreateNewNote: () => void;
}

export const NoteListSidebar: React.FC<NoteListSidebarProps> = ({
  notes,
  activeNoteId,
  courses,
  searchQuery,
  selectedTag,
  selectedCourseId,
  uniqueTags,
  onSelectNote,
  onSearchChange,
  onTagChange,
  onCourseChange,
  onTogglePin,
  onCreateNewNote,
}) => {
  const courseMap = new Map<string, Course>();
  for (const c of courses) {
    courseMap.set(c.id, c);
  }

  return (
    <div className="space-y-4">
      {/* Search Input & New Note Header Button */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            placeholder="Tìm kiếm ghi chú, nội dung..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={onCreateNewNote}
          className="shrink-0"
        >
          Ghi chú mới
        </Button>
      </div>

      {/* Course Filter Dropdown */}
      <div>
        <select
          value={selectedCourseId}
          onChange={(e) => onCourseChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 shadow-xs cursor-pointer focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Tất cả môn học & Tự do</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tag Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onTagChange('all')}
          className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
            selectedTag === 'all'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          Tất cả thẻ
        </button>
        {uniqueTags.map(({ tag, count }) => (
          <button
            key={tag}
            onClick={() => onTagChange(tag)}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedTag === tag
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span>#{tag}</span>
            <span
              className={`text-[10px] px-1 rounded-full ${
                selectedTag === tag
                  ? 'bg-brand-700 text-white'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Notes List */}
      <div className="space-y-2.5 max-h-[660px] overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Không tìm thấy ghi chú nào"
            description="Không có ghi chú nào phù hợp với bộ lọc tìm kiếm. Nhấn bên dưới để tạo mới."
            actionLabel="Tạo ghi chú"
            onAction={onCreateNewNote}
          />
        ) : (
          notes.map((note) => {
            const course = note.courseId ? courseMap.get(note.courseId) : null;
            const isSelected = note.id === activeNoteId;

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/40 shadow-xs dark:bg-brand-950/20 dark:border-brand-500'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {course && (
                      <span
                        className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: course.color }}
                      >
                        {course.code}
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {note.title}
                    </h4>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(note.id);
                    }}
                    className={`p-1 rounded-lg transition-colors ${
                      note.isPinned
                        ? 'text-amber-500 hover:text-amber-600'
                        : 'text-slate-300 hover:text-slate-500 dark:text-slate-600'
                    }`}
                    title={note.isPinned ? 'Bỏ ghim ghi chú' : 'Ghim lên đầu'}
                  >
                    <Pin className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>

                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {note.content.replace(/#|\*|`|>|\|/g, '').trim() || 'Không có nội dung xem trước'}
                </p>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span>{formatDateTime(note.updatedAt)}</span>
                  <div className="flex items-center gap-1">
                    {note.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        #{t}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-slate-400">+{note.tags.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

