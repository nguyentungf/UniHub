import React from 'react';
import { Assignment, Course, AssignmentStatus } from '@/types';
import { Card, Badge, Button } from '@/components/ui';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';
import { getAssignmentDeadlineInfo, isAssignmentCompleted } from '../utils/assignmentLogic';
import { formatDateTime } from '@/lib/utils';

interface AssignmentCardProps {
  assignment: Assignment;
  course?: Course;
  onEdit: (assignment: Assignment) => void;
  onDelete: (id: string, title: string) => void;
  onStatusChange: (id: string, nextStatus: AssignmentStatus) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  course,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const deadlineInfo = getAssignmentDeadlineInfo(assignment.dueDate, assignment.status);
  const completed = isAssignmentCompleted(assignment.status);

  // Determine next status when clicking advance button
  const getNextStatus = (): AssignmentStatus => {
    switch (assignment.status) {
      case 'todo':
        return 'in_progress';
      case 'in_progress':
        return 'completed';
      case 'completed':
      case 'submitted':
      case 'graded':
        return 'todo';
      default:
        return 'in_progress';
    }
  };

  const getStatusActionText = (): string => {
    switch (assignment.status) {
      case 'todo':
        return 'Bắt đầu →';
      case 'in_progress':
        return 'Hoàn thành ✓';
      default:
        return 'Mở lại';
    }
  };

  const getPriorityLabelVi = (p: string): string => {
    switch (p) {
      case 'urgent':
        return 'Khẩn cấp';
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return p;
    }
  };

  const formatDeadlineLabelVi = (label: string): string => {
    if (label === 'Completed') return 'Đã xong';
    if (label.startsWith('Overdue by ')) {
      return label.replace('Overdue by ', 'Quá hạn ').replace('days', 'ngày').replace('day', 'ngày').replace('hours', 'giờ').replace('hour', 'giờ');
    }
    if (label.startsWith('Due in ')) {
      return label.replace('Due in ', 'Còn ').replace('days', 'ngày').replace('day', 'ngày').replace('hours', 'giờ').replace('hour', 'giờ');
    }
    if (label === 'Due today') return 'Hạn hôm nay';
    if (label === 'Due tomorrow') return 'Hạn ngày mai';
    return label;
  };

  return (
    <Card
      hoverEffect
      className={`p-3.5 space-y-3 border-l-4 bg-white dark:bg-slate-900 transition-all ${
        deadlineInfo.isOverdue && !completed
          ? 'ring-1 ring-rose-300 dark:ring-rose-900/60'
          : ''
      }`}
      style={{ borderLeftColor: course?.color || '#3b82f6' }}
    >
      {/* Top Header: Course badge + Priority + Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white font-mono shadow-2xs"
            style={{ backgroundColor: course?.color || '#3b82f6' }}
          >
            {course?.code || 'GEN'}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              assignment.priority === 'urgent'
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : assignment.priority === 'high'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : assignment.priority === 'medium'
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {getPriorityLabelVi(assignment.priority)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(assignment)}
            title="Sửa bài tập"
            aria-label={`Sửa ${assignment.title}`}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(assignment.id, assignment.title)}
            title="Xóa bài tập"
            aria-label={`Xóa ${assignment.title}`}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h4
          className={`text-xs font-bold leading-snug transition-colors ${
            completed
              ? 'line-through text-slate-400 dark:text-slate-500'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {assignment.title}
        </h4>
        {assignment.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {assignment.description}
          </p>
        )}
      </div>

      {/* Logistics & Due date */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div
          className={`flex items-center gap-1 ${
            deadlineInfo.isOverdue
              ? 'text-rose-600 font-bold dark:text-rose-400 flex items-center gap-1'
              : ''
          }`}
        >
          {deadlineInfo.isOverdue ? (
            <AlertTriangle className="h-3 w-3 shrink-0 text-rose-500" />
          ) : (
            <Calendar className="h-3 w-3 shrink-0" />
          )}
          <span>{formatDeadlineLabelVi(deadlineInfo.label)}</span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          {assignment.weight !== undefined && (
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {assignment.weight}%
            </span>
          )}
          {assignment.earnedScore !== undefined && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {assignment.earnedScore}/{assignment.maxScore} đ
            </span>
          )}
        </div>
      </div>

      {/* Quick Status Advance Action */}
      <div className="flex items-center justify-between pt-1">
        {completed ? (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã xong
          </span>
        ) : (
          <button
            onClick={() => onStatusChange(assignment.id, getNextStatus())}
            className={`text-[11px] font-semibold flex items-center gap-1 hover:underline ${
              assignment.status === 'todo'
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {getStatusActionText()}
          </button>
        )}

        <span className="text-[10px] text-slate-400">
          {formatDateTime(assignment.dueDate)}
        </span>
      </div>
    </Card>
  );
};

