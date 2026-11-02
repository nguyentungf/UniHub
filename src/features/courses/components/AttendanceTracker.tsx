import React, { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Course, AttendanceRecord, AttendanceStatus } from '@/types';
import { calculateAttendanceStats } from '../utils/courseProgress';
import { Button, Input, Select, Badge, Card, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface AttendanceTrackerProps {
  course: Course;
  onLogAttendance: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  onDeleteAttendanceRecord: (recordId: string) => Promise<void>;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  course,
  onLogAttendance,
  onDeleteAttendanceRecord,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = calculateAttendanceStats(course);
  const records = course.attendanceRecords || [];

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setIsSubmitting(true);
    try {
      await onLogAttendance({
        date,
        status,
        note: note.trim() || undefined,
      });
      setIsModalOpen(false);
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Alert Banner if attendance < 80% */}
      {stats.isAtRisk && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-rose-200/90 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200">
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="text-xs">
            <span className="font-bold block">Examination Eligibility Warning</span>
            <span>
              Your attendance is currently {stats.attendanceRate}%, which is below the 80% threshold required by university academic policy. Ensure future classes are attended to avoid being barred from the final exam.
            </span>
          </div>
        </div>
      )}

      {/* Top Attendance Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Rate</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.attendanceRate}%
            </span>
          </div>
          <Badge
            variant={stats.isAtRisk ? 'rose' : stats.attendanceRate >= 90 ? 'emerald' : 'amber'}
            size="sm"
            className="mt-2 self-start"
          >
            {stats.statusLabel}
          </Badge>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Present</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.present}
          </p>
          <span className="text-[10px] text-slate-400">100% Full credit</span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Late</span>
          <p className="text-2xl font-black text-amber-500 mt-1">{stats.late}</p>
          <span className="text-[10px] text-slate-400">50% Half credit</span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Absent</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.absent}</p>
          <span className="text-[10px] text-slate-400">Unexcused</span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Excused</span>
          <p className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">{stats.excused}</p>
          <span className="text-[10px] text-slate-400">Medical / Valid</span>
        </Card>
      </div>

      {/* Header and Log Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-brand-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Class Attendance History ({records.length} Recorded)
          </h4>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Log Attendance
        </Button>
      </div>

      {/* Attendance History List */}
      {records.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-2">
          <CalendarCheck className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No attendance records logged yet for this course. Log each session to track compliance with university policies.
          </p>
          <Button size="xs" onClick={() => setIsModalOpen(true)}>
            Log First Session
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-navy-900/60 overflow-hidden shadow-xs">
          {records.map((r) => {
            let badgeVariant: 'emerald' | 'amber' | 'rose' | 'outline' = 'emerald';
            let StatusIcon = CheckCircle;
            if (r.status === 'late') {
              badgeVariant = 'amber';
              StatusIcon = Clock;
            } else if (r.status === 'absent') {
              badgeVariant = 'rose';
              StatusIcon = XCircle;
            } else if (r.status === 'excused') {
              badgeVariant = 'outline';
              StatusIcon = CalendarCheck;
            }

            return (
              <div
                key={r.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[90px]">
                    {formatDate(r.date)}
                  </span>
                  <Badge variant={badgeVariant} size="sm" className="capitalize">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {r.status}
                  </Badge>
                  {r.note && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                      {r.note}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteAttendanceRecord(r.id)}
                  className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                  title="Delete attendance record"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Log Attendance Session */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Attendance Session"
        description={`Record your attendance for ${course.code} · ${course.name}`}
      >
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <Input
            label="Session Date *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Select
            label="Attendance Status *"
            value={status}
            onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
            options={[
              { value: 'present', label: 'Present (Full Attendance)' },
              { value: 'late', label: 'Late (Half Attendance Credit)' },
              { value: 'absent', label: 'Absent (Unexcused Absence)' },
              { value: 'excused', label: 'Excused (Official Medical / Leave)' },
            ]}
          />

          <Input
            label="Note / Lecture Topic (Optional)"
            placeholder="e.g. Chapter 4 Lecture on Heaps"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Attendance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
