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
  const [date, setDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
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
            <span className="font-bold block">Cảnh báo điều kiện dự thi</span>
            <span>
              Tỷ lệ chuyên cần của bạn hiện đạt {stats.attendanceRate}%, dưới ngưỡng 80% theo quy chế học tập. Hãy đi học đầy đủ các buổi tiếp theo để tránh bị cấm thi kết thúc học phần.
            </span>
          </div>
        </div>
      )}

      {/* Top Attendance Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Tỷ lệ</span>
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
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Có mặt</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.present}
          </p>
          <span className="text-[10px] text-slate-400">Đầy đủ 100%</span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Đi muộn</span>
          <p className="text-2xl font-black text-amber-500 mt-1">{stats.late}</p>
          <span className="text-[10px] text-slate-400">Tính 50%</span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Vắng mặt</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.absent}</p>
          <span className="text-[10px] text-slate-400">Không phép</span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Có phép</span>
          <p className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">{stats.excused}</p>
          <span className="text-[10px] text-slate-400">Lý do y tế / phép</span>
        </Card>
      </div>

      {/* Header and Log Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-brand-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Lịch sử điểm danh ({records.length} buổi)
          </h4>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Điểm danh buổi học
        </Button>
      </div>

      {/* Attendance History List */}
      {records.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-2">
          <CalendarCheck className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chưa có buổi học nào được ghi nhận điểm danh. Hãy ghi nhận từng buổi để theo dõi điều kiện dự thi.
          </p>
          <Button size="xs" onClick={() => setIsModalOpen(true)}>
            Điểm danh buổi đầu tiên
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-navy-900/60 overflow-hidden shadow-xs">
          {records.map((r) => {
            let badgeVariant: 'emerald' | 'amber' | 'rose' | 'outline' = 'emerald';
            let StatusIcon = CheckCircle;
            let statusText = 'Có mặt';
            if (r.status === 'late') {
              badgeVariant = 'amber';
              StatusIcon = Clock;
              statusText = 'Đi muộn';
            } else if (r.status === 'absent') {
              badgeVariant = 'rose';
              StatusIcon = XCircle;
              statusText = 'Vắng mặt';
            } else if (r.status === 'excused') {
              badgeVariant = 'outline';
              StatusIcon = CalendarCheck;
              statusText = 'Có phép';
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
                  <Badge variant={badgeVariant} size="sm">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusText}
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
                  title="Xóa buổi điểm danh"
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
        title="Ghi nhận điểm danh buổi học"
        description={`Cập nhật tình trạng tham dự cho môn ${course.code} · ${course.name}`}
      >
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <Input
            label="Ngày học *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Select
            label="Trạng thái tham dự *"
            value={status}
            onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
            options={[
              { value: 'present', label: 'Có mặt (Tính đủ 100% chuyên cần)' },
              { value: 'late', label: 'Đi muộn (Tính 50% chuyên cần)' },
              { value: 'absent', label: 'Vắng mặt (Nghỉ không phép)' },
              { value: 'excused', label: 'Có phép (Giấy phép / Lý do y tế)' },
            ]}
          />

          <Input
            label="Ghi chú / Chủ đề bài học (Tùy chọn)"
            placeholder="vd: Bài giảng Chương 4 về Cấu trúc Heaps"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 z-10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Lưu điểm danh
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
