import React, { useState } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import { Star } from 'lucide-react';
import type { Course, StudySession } from '@/types';

export interface LogManualSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onSave: (session: StudySession) => Promise<unknown>;
}

export const LogManualSessionModal: React.FC<LogManualSessionModalProps> = ({
  isOpen,
  onClose,
  courses,
  onSave,
}) => {
  const [courseId, setCourseId] = useState<string>('general');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [focusRating, setFocusRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (durationMinutes <= 0) return;

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const newSession: StudySession = {
        id: `study-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        courseId: courseId === 'general' ? null : courseId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        durationMinutes,
        sessionType: 'manual',
        focusRating,
        notes: notes.trim() || 'Phiên học ngoại tuyến thủ công',
      };

      await onSave(newSession);
      onClose();
    } catch {
      // Handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ghi nhận phiên học ngoại tuyến"
      description="Ghi nhận thời gian học ngoài ứng dụng (ví dụ: học tại thư viện, ôn tập trên lớp)"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Select
          label="Môn học"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          options={[
            { value: 'general', label: 'Tự học chung / Không gắn môn' },
            ...courses.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` })),
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ngày học *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Giờ bắt đầu *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Thời lượng (Phút) *
          </label>
          <input
            type="number"
            min={1}
            max={720}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Đánh giá mức độ tập trung
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFocusRating(star as 1 | 2 | 3 | 4 | 5)}
                className="p-1 focus:outline-hidden"
              >
                <Star
                  className={`h-5 w-5 ${
                    star <= focusRating
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-slate-200 dark:text-slate-700'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Ghi chú phiên học"
          placeholder="Ví dụ: Đọc chương 4-6, giải bài tập mẫu..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 z-10">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Lưu phiên học
          </Button>
        </div>
      </form>
    </Modal>
  );
};
