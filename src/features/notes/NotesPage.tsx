import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader, EmptyState } from '@/components/common';
import { Badge, Button } from '@/components/ui';
import { Plus, FileText, RefreshCw, Sparkles, BookOpen } from 'lucide-react';
import { useNoteStore, useCourseStore } from '@/stores';
import { NoteListSidebar, NoteEditor, CreateNoteModal } from './components';
import { filterAndSortNotes, extractUniqueTags } from './utils/noteLogic';

export const NotesPage: React.FC = () => {
  const notes = useNoteStore((state) => state.notes);
  const activeNoteId = useNoteStore((state) => state.activeNoteId);
  const isLoading = useNoteStore((state) => state.isLoading);
  const error = useNoteStore((state) => state.error);
  const loadNotes = useNoteStore((state) => state.loadNotes);
  const setActiveNoteId = useNoteStore((state) => state.setActiveNoteId);
  const createNote = useNoteStore((state) => state.createNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const togglePin = useNoteStore((state) => state.togglePin);

  const courses = useCourseStore((state) => state.courses);
  const loadCourses = useCourseStore((state) => state.loadCourses);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadNotes();
    loadCourses();
  }, [loadNotes, loadCourses]);

  // Derived filtered notes and tag catalog
  const filteredNotes = useMemo(
    () =>
      filterAndSortNotes(notes, {
        query: searchQuery,
        tag: selectedTag,
        courseId: selectedCourseId,
      }),
    [notes, searchQuery, selectedTag, selectedCourseId]
  );

  const uniqueTags = useMemo(() => extractUniqueTags(notes), [notes]);

  // Active note resolution:
  // If activeNoteId exists in filteredNotes, pick it; otherwise fallback to first filtered note
  const activeNote = useMemo(() => {
    if (activeNoteId) {
      const found = notes.find((n) => n.id === activeNoteId);
      if (found) return found;
    }
    return filteredNotes[0] || null;
  }, [notes, activeNoteId, filteredNotes]);

  const handleCreateNoteSubmit = async (input: {
    title: string;
    content: string;
    courseId: string | null;
    tags: string[];
    isPinned: boolean;
  }) => {
    const created = await createNote(input);
    setActiveNoteId(created.id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Kho tri thức & Ghi chú"
        subtitle="Ghi chú bài giảng Markdown, tóm tắt thuật toán và phân loại ôn tập theo môn học"
        badge={
          <Badge variant="brand">
            {notes.length} Ghi chú
          </Badge>
        }
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Tạo ghi chú mới
          </Button>
        }
      />

      {/* Storage Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
          <span>{error}</span>
          <Button size="xs" variant="outline" onClick={loadNotes} leftIcon={<RefreshCw className="h-3 w-3" />}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Split Pane Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane (Col 1-5): Search, Tag Filters & Note List */}
        <div className="lg:col-span-5">
          <NoteListSidebar
            notes={filteredNotes}
            activeNoteId={activeNote?.id || null}
            courses={courses}
            searchQuery={searchQuery}
            selectedTag={selectedTag}
            selectedCourseId={selectedCourseId}
            uniqueTags={uniqueTags}
            onSelectNote={setActiveNoteId}
            onSearchChange={setSearchQuery}
            onTagChange={setSelectedTag}
            onCourseChange={setSelectedCourseId}
            onTogglePin={togglePin}
            onCreateNewNote={() => setIsCreateModalOpen(true)}
          />
        </div>

        {/* Right Pane (Col 6-12): Markdown Reader / Editor */}
        <div className="lg:col-span-7">
          {activeNote ? (
            <NoteEditor
              key={activeNote.id}
              note={activeNote}
              courses={courses}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              onTogglePin={togglePin}
            />
          ) : (
            <div className="min-h-[500px] flex items-center justify-center p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <EmptyState
                icon={FileText}
                title="Chưa chọn ghi chú nào"
                description="Chọn một ghi chú từ danh sách bên trái để xem nội dung, hoặc tạo một ghi chú mới."
                actionLabel="Tạo ghi chú"
                onAction={() => setIsCreateModalOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Note Modal */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        courses={courses}
        onCreate={handleCreateNoteSubmit}
      />
    </div>
  );
};
