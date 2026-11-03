import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  BookOpen,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Course, CourseLesson } from '@/types';
import { calculateLessonProgress } from '../utils/courseProgress';
import { Button, Input, Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface LessonTrackerProps {
  course: Course;
  onToggleLesson: (lessonId: string) => Promise<void>;
  onAddLesson: (title: string, description?: string) => Promise<void>;
  onDeleteLesson: (lessonId: string) => Promise<void>;
  onUpdateCourse: (updates: Partial<Course>) => Promise<Course>;
}

export const LessonTracker: React.FC<LessonTrackerProps> = ({
  course,
  onToggleLesson,
  onAddLesson,
  onDeleteLesson,
  onUpdateCourse,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'pending'>('all');

  const progress = calculateLessonProgress(course);
  const lessons = course.lessons || [];

  const filteredLessons = lessons.filter((l) => {
    if (filterMode === 'completed') return l.isCompleted;
    if (filterMode === 'pending') return !l.isCompleted;
    return true;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddLesson(newTitle.trim(), newDesc.trim() || undefined);
    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleQuickIncrement = async (delta: number) => {
    const current = progress.completed;
    const nextCompleted = Math.max(0, Math.min(progress.total, current + delta));
    await onUpdateCourse({
      completedLessons: nextCompleted,
    });
  };

  const handlePopulateDefaultSyllabus = async () => {
    const defaultTopics = [
      'Bài 1: Giới thiệu & Tổng quan môn học',
      'Bài 2: Các khái niệm cơ bản & Nền tảng',
      'Bài 3: Phương pháp luận cốt lõi (Phần 1)',
      'Bài 4: Phương pháp luận cốt lõi (Phần 2)',
      'Bài 5: Thực hành & Giải quyết bài toán',
      'Bài 6: Ôn tập & Tổng hợp giữa kỳ',
      'Bài 7: Kỹ thuật nâng cao & Nghiên cứu tình huống',
      'Bài 8: Kiến trúc hệ thống & Mẫu thiết kế',
      'Bài 9: Tối ưu hóa & Đánh giá hiệu năng',
      'Bài 10: Đồ án môn học & Ôn tập cuối kỳ',
    ];

    for (const topic of defaultTopics) {
      await onAddLesson(topic);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Progress Summary Card */}
      <Card className="p-5 border-l-4" style={{ borderLeftColor: course.color }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                <BookOpen className="h-5 w-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Theo dõi tiến độ bài học
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Theo dõi các bài giảng, bài đọc và chuyên đề trong đề cương môn học
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {progress.completed}
                <span className="text-sm font-semibold text-slate-400"> / {progress.total}</span>
              </span>
              <span className="text-[11px] block font-semibold text-slate-500">
                {progress.percentage}% hoàn thành
              </span>
            </div>

            {/* Quick manual steppers */}
            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => handleQuickIncrement(-1)}
                className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Giảm số bài đã học"
                disabled={progress.completed <= 0}
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleQuickIncrement(1)}
                className="px-2 py-1 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
                title="Tăng số bài đã học"
                disabled={progress.completed >= progress.total}
              >
                +1 Bài học
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress.percentage}%`,
                backgroundColor: course.color,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>{progress.completed} bài đã hoàn thành</span>
            <span>Còn {progress.remaining} bài trước kỳ thi</span>
          </div>
        </div>
      </Card>

      {/* Filter and Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'all'
                ? 'bg-white shadow-xs text-slate-900 dark:bg-slate-900 dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Tất cả ({lessons.length})
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'completed'
                ? 'bg-white shadow-xs text-emerald-600 dark:bg-slate-900 dark:text-emerald-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Đã hoàn thành ({lessons.filter((l) => l.isCompleted).length})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === 'pending'
                ? 'bg-white shadow-xs text-brand-600 dark:bg-slate-900 dark:text-brand-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Chưa hoàn thành ({lessons.filter((l) => !l.isCompleted).length})
          </button>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? 'Đóng biểu mẫu' : 'Thêm bài học'}
        </Button>
      </div>

      {/* Inline Add Lesson Form */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3 animate-fade-in"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Thêm bài học theo đề cương
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Tiêu đề bài học (VD: Duyệt đồ thị & Đường đi ngắn nhất)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                placeholder="Mô tả / Tài liệu đọc (Tùy chọn)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="xs" onClick={() => setIsAdding(false)}>
              Hủy
            </Button>
            <Button type="submit" size="xs">
              Lưu bài học
            </Button>
          </div>
        </form>
      )}

      {/* Lesson List */}
      {filteredLessons.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Không có bài học nào phù hợp với bộ lọc
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Bạn có thể thêm từng bài học hoặc tạo nhanh mẫu đề cương 10 bài học khởi đầu.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button size="xs" variant="outline" onClick={handlePopulateDefaultSyllabus}>
              Tạo mẫu đề cương tự động
            </Button>
            <Button size="xs" onClick={() => setIsAdding(true)}>
              Thêm bài học
            </Button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-navy-900/60 overflow-hidden shadow-xs">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                lesson.isCompleted
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Toggle checkbox button */}
                <button
                  type="button"
                  onClick={() => onToggleLesson(lesson.id)}
                  className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                    lesson.isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border-2 border-slate-300 hover:border-brand-500 text-transparent dark:border-slate-700'
                  }`}
                  title={lesson.isCompleted ? 'Đánh dấu chưa học' : 'Đánh dấu đã học'}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>

                {/* Lesson number chip */}
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  L{String(lesson.lessonNumber).padStart(2, '0')}
                </span>

                {/* Title & details */}
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${
                      lesson.isCompleted
                        ? 'text-slate-400 dark:text-slate-500 line-through'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {lesson.title}
                  </p>
                  {lesson.description && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {lesson.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {lesson.completedAt && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                    Xong {formatDate(lesson.completedAt)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteLesson(lesson.id)}
                  className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Xóa bài học"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
