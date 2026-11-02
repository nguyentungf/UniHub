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
      title="Class Session Details"
      description={`${getDayName(slot.dayOfWeek)} · ${slot.startTime} to ${slot.endTime}`}
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
              {course?.code || 'Course'}
            </span>
            <h3 className="text-lg font-black leading-snug">{course?.name || 'Class Session'}</h3>
          </div>
          <Badge variant="outline" size="sm" className="bg-black/25 text-white border-white/20 capitalize">
            {slot.type}
          </Badge>
        </div>

        {/* Detailed specs */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
            <Clock className="h-4 w-4 text-brand-500 shrink-0" />
            <div>
              <span className="font-semibold block text-slate-800 dark:text-slate-200">
                {getDayName(slot.dayOfWeek)}, {slot.startTime} - {slot.endTime}
              </span>
              <span className="text-[11px] text-slate-400 capitalize">
                Recurrence: {slot.recurrence.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
            <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
            <div>
              <span className="font-semibold block text-slate-800 dark:text-slate-200">
                {slot.room ? `${slot.room} · ` : ''}{slot.location}
              </span>
              <span className="text-[11px] text-slate-400">Classroom & Building</span>
            </div>
          </div>

          {(slot.instructor || course?.instructor) && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
              <User className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  {slot.instructor || course?.instructor}
                </span>
                <span className="text-[11px] text-slate-400">Lecturer / Instructor</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          {course ? (
            <NavLink to={`/courses/${course.id}`} onClick={onClose}>
              <Button size="xs" variant="ghost" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                Course Cockpit
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
              Edit
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
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
