import React, { useState } from 'react';
import { Semester } from '@/types';
import { SemesterFormSchema, SemesterFormData } from '@/lib/validation/schemas';
import { Modal, Input, Button } from '@/components/ui';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, GraduationCap } from 'lucide-react';

export interface SemesterTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSemester: Semester;
  onTransition: (data: SemesterFormData) => Promise<void>;
}

export const SemesterTransitionModal: React.FC<SemesterTransitionModalProps> = ({
  isOpen,
  onClose,
  currentSemester,
  onTransition,
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetGpa, setTargetGpa] = useState<string>('3.80');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize dates ahead of current semester
  React.useEffect(() => {
    if (isOpen) {
      const prevEnd = new Date(currentSemester.endDate || new Date());
      const nextStart = new Date(prevEnd);
      nextStart.setDate(nextStart.getDate() + 14); // 2 weeks after previous term
      const nextEnd = new Date(nextStart);
      nextEnd.setMonth(nextEnd.getMonth() + 4);

      const year = nextStart.getFullYear();
      setName(`Học kỳ tiếp theo (${year} - ${year + 1})`);
      setStartDate(nextStart.toISOString().split('T')[0]);
      setEndDate(nextEnd.toISOString().split('T')[0]);
      setTargetGpa(currentSemester.targetGpa ? String(currentSemester.targetGpa) : '3.80');
      setErrors({});
    }
  }, [isOpen, currentSemester]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});

    const rawPayload = {
      name,
      startDate,
      endDate,
      targetGpa: targetGpa.trim() === '' ? undefined : targetGpa,
      isCurrent: true,
    };

    const validation = SemesterFormSchema.safeParse(rawPayload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const err of validation.error.errors) {
        const fieldName = err.path[0] ? String(err.path[0]) : 'name';
        fieldErrors[fieldName] = err.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onTransition(validation.data);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chuyển tiếp học kỳ thất bại';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Quy trình chuyển tiếp sang Học kỳ mới (Semester Rollover)"
      description="Khởi động học kỳ mới an toàn, bảo toàn toàn bộ dữ liệu lịch sử môn học và GPA"
      size="lg"
    >
      <form onSubmit={handleConfirm} className="space-y-5 pt-1">
        {errors.form && (
          <div className="p-3 rounded-xl text-xs bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {errors.form}
          </div>
        )}

        {/* Transition Summary Guarantee Banner */}
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900 dark:bg-brand-950/40">
          <h4 className="text-xs font-bold text-brand-900 dark:text-brand-200 flex items-center gap-1.5 mb-2">
            <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>Cam kết bảo toàn dữ liệu học vụ</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-brand-800/90 dark:text-brand-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                Giữ nguyên 100% môn học, điểm số, GPA và bài tập của học kỳ <strong>{currentSemester.name}</strong>.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                Không làm mất lịch sử học tập, có thể xem lại bất kỳ lúc nào tại mục Môn học & GPA.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                Học kỳ mới bắt đầu với danh mục môn học mới, sẵn sàng để bạn đăng ký môn và xếp thời khóa biểu.
              </span>
            </li>
          </ul>
        </div>

        {/* Input Fields for New Term */}
        <div className="space-y-3.5">
          <Input
            label="Tên học kỳ mới *"
            placeholder="Ví dụ: Học kỳ 2 (2026 - 2027)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Ngày bắt đầu học kỳ *"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              error={errors.startDate}
              required
            />
            <Input
              label="Ngày kết thúc học kỳ *"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={errors.endDate}
              required
            />
          </div>

          <Input
            label="Mục tiêu GPA cho học kỳ mới (Thang 4.0)"
            type="number"
            step="0.01"
            min="0"
            max="4.0"
            placeholder="Ví dụ: 3.85"
            value={targetGpa}
            onChange={(e) => setTargetGpa(e.target.value)}
            error={errors.targetGpa}
            helperText="Mục tiêu GPA này sẽ áp dụng cho Dashboard và biểu đồ phân tích của học kỳ mới"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<ArrowRight className="h-4 w-4" />}
          >
            Khởi động học kỳ mới
          </Button>
        </div>
      </form>
    </Modal>
  );
};

