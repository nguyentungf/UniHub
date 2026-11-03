import React from 'react';
import { Exam, Course, ExamStatus } from '@/types';
import { Card, Badge, Button } from '@/components/ui';
import {
  Calendar,
  Clock,
  MapPin,
  Award,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  getExamCountdown,
  calculateTopicProgress,
  isExamCompleted,
} from '../utils/examLogic';
import { formatDateTime } from '@/lib/utils';

interface ExamCardProps {
  exam: Exam;
  course?: Course;
  completedTopics: Record<string, boolean>;
  onToggleTopic: (key: string) => void;
  onEdit: (exam: Exam) => void;
  onDelete: (id: string, title: string) => void;
  onStatusChange?: (id: string, status: ExamStatus) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  course,
  completedTopics,
  onToggleTopic,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const countdown = getExamCountdown(exam.examDate);
  const isCompleted = isExamCompleted(exam);
  const prefix = course?.code || exam.id;
  const progress = calculateTopicProgress(exam.topics, completedTopics, prefix);

  const getExamTypeVi = (t: string) => {
    switch (t) {
      case 'midterm':
        return 'Giữa kỳ';
      case 'final':
        return 'Cuối kỳ';
      case 'quiz':
        return 'Quiz';
      case 'practical':
        return 'Thực hành';
      default:
        return t;
    }
  };

  const getStatusVi = (s: string) => {
    switch (s) {
      case 'completed':
        return 'ĐÃ THI';
      case 'in_progress':
        return 'ĐANG DIỄN RA';
      case 'upcoming':
        return 'SẮP THI';
      case 'cancelled':
        return 'ĐÃ HỦY';
      default:
        return s.toUpperCase();
    }
  };

  const formatCountdownLabelVi = (label: string): string => {
    if (label === 'Today!') return 'Hôm nay!';
    if (label === 'Tomorrow') return 'Ngày mai';
    if (label.endsWith('d remaining')) {
      return `Còn ${label.replace('d remaining', 'ngày')}`;
    }
    if (label.endsWith('d ago')) {
      return `${label.replace('d ago', 'ngày trước')}`;
    }
    return label;
  };

  return (
    <Card
      hoverEffect
      className={`p-5 overflow-hidden border-l-4 relative space-y-4 bg-white dark:bg-slate-900 transition-all ${
        countdown.isToday && !isCompleted
          ? 'ring-2 ring-rose-400 dark:ring-rose-900'
          : countdown.daysLeft <= 3 && !isCompleted && !countdown.isPast
          ? 'ring-1 ring-amber-300 dark:ring-amber-800'
          : ''
      }`}
      style={{ borderLeftColor: course?.color || '#f59e0b' }}
    >
      {/* Header Row: Course Tag, Title, Badges, and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-start sm:items-center gap-3">
          <span
            className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg text-white shadow-2xs shrink-0"
            style={{ backgroundColor: course?.color || '#3b82f6' }}
          >
            {course?.code || 'GEN'}
          </span>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {exam.title}
              </h3>
              <Badge variant="outline" size="sm">
                {getExamTypeVi(exam.examType)}
              </Badge>
              {exam.status && (
                <Badge
                  variant={
                    exam.status === 'completed'
                      ? 'emerald'
                      : exam.status === 'in_progress'
                      ? 'rose'
                      : 'slate'
                  }
                  size="sm"
                >
                  {getStatusVi(exam.status)}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {course?.name || 'Môn học chung'} · Trọng số:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {exam.weight !== undefined ? `${exam.weight}%` : 'N/A'}
              </span>{' '}
              điểm tổng kết
            </p>
          </div>
        </div>

        {/* Right side: Countdown box & action controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {/* Countdown badge */}
          <div
            className={`rounded-xl border px-3 py-1.5 text-center min-w-[105px] ${
              isCompleted || countdown.isPast
                ? 'bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700'
                : countdown.isToday
                ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:border-rose-900'
                : countdown.daysLeft <= 3
                ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-900'
                : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-900'
            }`}
          >
            <span
              className={`block text-[10px] font-bold uppercase tracking-wider ${
                isCompleted || countdown.isPast
                  ? 'text-slate-500 dark:text-slate-400'
                  : countdown.isToday
                  ? 'text-rose-700 dark:text-rose-300'
                  : countdown.daysLeft <= 3
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              Đếm ngược
            </span>
            <span
              className={`text-xs font-extrabold ${
                isCompleted || countdown.isPast
                  ? 'text-slate-700 dark:text-slate-300'
                  : countdown.isToday
                  ? 'text-rose-900 dark:text-rose-100'
                  : countdown.daysLeft <= 3
                  ? 'text-amber-900 dark:text-amber-100'
                  : 'text-emerald-900 dark:text-emerald-100'
              }`}
            >
              {isCompleted ? 'Đã thi xong ✓' : formatCountdownLabelVi(countdown.label)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(exam)}
              title="Sửa kỳ thi"
              aria-label={`Sửa ${exam.title}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(exam.id, exam.title)}
              title="Xóa kỳ thi"
              aria-label={`Xóa ${exam.title}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Exam Logistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl dark:bg-slate-900/60 text-xs border border-slate-100 dark:border-slate-800/60">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
            Ngày & Giờ thi
          </span>
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 mt-0.5">
            <Calendar className="h-3.5 w-3.5 text-brand-500 shrink-0" />
            <span className="truncate">{formatDateTime(exam.examDate)}</span>
          </div>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
            Thời lượng
          </span>
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 mt-0.5">
            <Clock className="h-3.5 w-3.5 text-brand-500 shrink-0" />
            <span>{exam.durationMinutes} Phút</span>
          </div>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
            Địa điểm / Phòng thi
          </span>
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 mt-0.5">
            <MapPin className="h-3.5 w-3.5 text-brand-500 shrink-0" />
            <span className="truncate">{exam.location}</span>
          </div>
        </div>

        {/* <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
            Số báo danh
          </span>
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 mt-0.5">
            <Award className="h-3.5 w-3.5 text-brand-500 shrink-0" />
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
              {exam.seatNumber || 'Chưa xếp'}
            </span>
          </div>
        </div> */}
      </div>

      {/* Revision Checklist */}
      {exam.topics.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Danh mục ôn tập theo đề cương</span>
            <span className="text-brand-600 dark:text-brand-400 font-mono">
              {progress.completed}/{progress.total} Chủ đề ({progress.percentage}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-brand-600 dark:bg-brand-500 transition-all duration-300 rounded-full"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {exam.topics.map((topic, idx) => {
              const key = `${prefix}-${idx}`;
              const isChecked = !!completedTopics[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleTopic(key)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left text-xs transition-all ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-200 text-slate-800 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-slate-200'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                  <span className={`truncate ${isChecked ? 'line-through opacity-70' : 'font-medium'}`}>
                    {topic}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Target score, actual score, & notes footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          {exam.targetScore !== undefined && (
            <span>
              Mục tiêu:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {exam.targetScore}
              </span>
            </span>
          )}
          {exam.actualScore !== undefined && (
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Điểm thi: {exam.actualScore}/{exam.maxScore}
            </span>
          )}
        </div>

        {exam.notes && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic truncate max-w-sm">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{exam.notes}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

