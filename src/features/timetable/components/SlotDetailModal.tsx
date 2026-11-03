import React from 'react';
import { NavLink } from 'react-router-dom';
import { Course, TimetableSlot } from '@/types';
import { getDayName } from '../utils/timetableConflict';
import { Modal, Button, Badge } from '@/components/ui';
import { Clock, MapPin, User, Calendar, ExternalLink, Edit2, Trash2 } from 'lucide-react';

interface SlotDetailModalProps {
  slot: TimetableSlot | null;
  course?: Course;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (slot: TimetableSlot) => void;
  onDelete: (slot: TimetableSlot) => void;
}

const getDayNameVi = (day: number): string => {
  const map: Record<number, string> = {
    1: 'Thứ Hai',
    2: 'Thứ Ba',
    3: 'Thứ Tư',
    4: 'Thứ Năm',
    5: 'Thứ Sáu',
    6: 'Thứ Bảy',
    7: 'Chủ Nhật',
  };
  return map[day] || `Thứ ${day}`;
};

const getSlotTypeVi = (type: string): string => {
  const map: Record<string, string> = {
    lecture: 'Lý thuyết',
    lab: 'Thực hành',
    tutorial: 'Bài tập',
    seminar: 'Chuyên đề',
    exam: 'Kiểm tra',
  };
  return map[type] || type;
};

const getRecurrenceVi = (slot: TimetableSlot, course?: Course): string => {
  if (slot.recurrence === 'course_weeks') {
    const weeks = slot.customWeeks || course?.studyWeeks || '2-19';
    return `Theo tuần môn học (${weeks})`;
  }
  if (slot.recurrence === 'custom') {
    return `Tùy chỉnh: Tuần ${slot.customWeeks || 'Đã chọn'}`;
  }
  const map: Record<string, string> = {
    weekly: 'Hàng tuần',
    biweekly_odd: 'Tuần lẻ',
    biweekly_even: 'Tuần chẵn',
  };
  return map[slot.recurrence] || slot.recurrence;
};

export const SlotDetailModal: React.FC<SlotDetailModalProps> = ({
  slot,
  course,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!slot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết tiết học"
      description={`${getDayNameVi(slot.dayOfWeek)} · ${slot.startTime} đến ${slot.endTime}`}
      size="md"
    >
      <div className="space-y-5">
        {/* Course Banner */}
        <div
          className="p-4 rounded-2xl text-white shadow-sm flex items-center justify-between"
          style={{ backgroundColor: course?.color || '#3b82f6' }}
        >
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider opacity-80 block">
              {course?.code || 'Môn học'}
            </span>
            <h3 className="text-lg font-black leading-snug">{course?.name || 'Tiết học'}</h3>
          </div>
          <Badge variant="outline" size="sm" className="bg-black/25 text-white border-white/20">
            {getSlotTypeVi(slot.type)}
          </Badge>
        </div>

        {/* Detailed specs */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
            <Clock className="h-4 w-4 text-brand-500 shrink-0" />
            <div>
              <span className="font-semibold block text-slate-800 dark:text-slate-200">
                {getDayNameVi(slot.dayOfWeek)}, {slot.startTime} - {slot.endTime}
              </span>
              <span className="text-[11px] text-slate-400">
                Tần suất: {getRecurrenceVi(slot, course)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
            <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
            <div>
              <span className="font-semibold block text-slate-800 dark:text-slate-200">
                {slot.room ? `${slot.room} · ` : ''}{slot.location}
              </span>
              <span className="text-[11px] text-slate-400">Phòng học & Tòa nhà</span>
            </div>
          </div>

          {(slot.instructor || course?.instructor) && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
              <User className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  {slot.instructor || course?.instructor}
                </span>
                <span className="text-[11px] text-slate-400">Mã lớp</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          {course ? (
            <NavLink to={`/courses/${course.id}`} onClick={onClose}>
              <Button size="xs" variant="ghost" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                Trang môn học
              </Button>
            </NavLink>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              leftIcon={<Edit2 className="h-3.5 w-3.5" />}
              onClick={() => {
                onClose();
                onEdit(slot);
              }}
            >
              Sửa
            </Button>
            <Button
              size="xs"
              variant="danger"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => {
                onClose();
                onDelete(slot);
              }}
            >
              Xóa
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
