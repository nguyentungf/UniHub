import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Calendar,
  CheckSquare,
  GraduationCap,
  Clock,
  FileText,
  Settings,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  X,
} from 'lucide-react';
import {
  useCourseStore,
  useAssignmentStore,
  useExamStore,
  useNoteStore,
} from '@/stores';
import { cn } from '@/lib/utils';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const courses = useCourseStore((state) => state.courses);
  const assignments = useAssignmentStore((state) => state.assignments);
  const exams = useExamStore((state) => state.exams);
  const notes = useNoteStore((state) => state.notes);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const navigationItems = [
    { name: 'Tổng quan học tập', path: '/dashboard', icon: LayoutDashboard, category: 'Điều hướng' },
    { name: 'Danh mục môn học', path: '/courses', icon: BookOpen, category: 'Điều hướng' },
    { name: 'Thời khóa biểu tuần', path: '/timetable', icon: Calendar, category: 'Điều hướng' },
    { name: 'Bài tập & Hạn nộp', path: '/assignments', icon: CheckSquare, category: 'Điều hướng' },
    { name: 'Lịch thi & Ôn tập', path: '/exams', icon: GraduationCap, category: 'Điều hướng' },
    { name: 'Tính điểm & GPA', path: '/gpa', icon: Sparkles, category: 'Điều hướng' },
    { name: 'Đồng hồ Pomodoro', path: '/study', icon: Clock, category: 'Điều hướng' },
    { name: 'Sổ tay ghi chép', path: '/notes', icon: FileText, category: 'Điều hướng' },
    { name: 'Cài đặt hệ thống', path: '/settings', icon: Settings, category: 'Điều hướng' },
  ];

  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        nav: navigationItems.slice(0, 5),
        courses: courses.slice(0, 3),
        assignments: assignments.slice(0, 3),
        exams: exams.slice(0, 2),
        notes: notes.slice(0, 2),
      };
    }

    const nav = navigationItems.filter((item) => item.name.toLowerCase().includes(q));
    const matchedCourses = courses.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
    const matchedAssignments = assignments.filter((a) =>
      a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q))
    );
    const matchedExams = exams.filter((e) =>
      e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
    );
    const matchedNotes = notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q))
    );

    return {
      nav,
      courses: matchedCourses,
      assignments: matchedAssignments,
      exams: matchedExams,
      notes: matchedNotes,
    };
  }, [query, courses, assignments, exams, notes]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl transition-all duration-200 animate-slide-up dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-200 px-4 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Nhập lệnh hoặc tìm kiếm (vd: CS201, thi giữa kỳ, GPA)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-800">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Navigation Items */}
          {filteredResults.nav.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Trang & Điều hướng
              </p>
              <div className="space-y-1">
                {filteredResults.nav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item.path)}
                      className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
                        <span>{item.name}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Courses */}
          {filteredResults.courses.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Môn học
              </p>
              <div className="space-y-1">
                {filteredResults.courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleSelect('/courses')}
                    className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {course.code}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {course.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {course.credits} tín chỉ
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assignments */}
          {filteredResults.assignments.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Bài tập & Nhiệm vụ
              </p>
              <div className="space-y-1">
                {filteredResults.assignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => handleSelect('/assignments')}
                    className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="h-4 w-4 text-brand-500" />
                      <span className="text-slate-800 dark:text-slate-200 truncate">
                        {assignment.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {assignment.priority}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exams */}
          {filteredResults.exams && filteredResults.exams.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Lịch thi & Kiểm tra
              </p>
              <div className="space-y-1">
                {filteredResults.exams.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => handleSelect('/exams')}
                    className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="h-4 w-4 text-indigo-500" />
                      <span className="text-slate-800 dark:text-slate-200 truncate">
                        {exam.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {exam.location}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {filteredResults.notes && filteredResults.notes.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Ghi chú & Tài liệu
              </p>
              <div className="space-y-1">
                {filteredResults.notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleSelect('/notes')}
                    className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      <span className="text-slate-800 dark:text-slate-200 truncate">
                        {note.title}
                      </span>
                    </div>
                    {note.tags.length > 0 && (
                      <span className="text-[10px] text-slate-400">
                        #{note.tags[0]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800/80 dark:bg-slate-900/40">
          <span>Phím tắt điều hướng</span>
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border px-1 py-0.5 dark:border-slate-700">↑↓</kbd> di chuyển
            </span>
            <span>
              <kbd className="rounded border px-1 py-0.5 dark:border-slate-700">↵</kbd> chọn
            </span>
            <span>
              <kbd className="rounded border px-1 py-0.5 dark:border-slate-700">esc</kbd> đóng
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
