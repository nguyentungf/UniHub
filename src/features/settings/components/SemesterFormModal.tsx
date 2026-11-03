import React, { useState, useEffect } from 'react';
import { Semester } from '@/types';
import { SemesterFormSchema, SemesterFormData } from '@/lib/validation/schemas';
import { Modal, Input, Button } from '@/components/ui';
import { Calendar, Sparkles } from 'lucide-react';

export interface SemesterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SemesterFormData, id?: string) => Promise<void>;
  initialData?: Semester | null;
  isOnlySemester?: boolean;
}

export const SemesterFormModal: React.FC<SemesterFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isOnlySemester = false,
}) => {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetGpa, setTargetGpa] = useState<string>('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setStartDate(initialData.startDate || '');
      setEndDate(initialData.endDate || '');
      setTargetGpa(
        initialData.targetGpa !== undefined && initialData.targetGpa !== null
          ? String(initialData.targetGpa)
          : ''
      );
      setIsCurrent(Boolean(initialData.isCurrent));
    } else {
      // Defaults for new semester
      const now = new Date();
      const currentYear = now.getFullYear();
      const nextYear = currentYear + 1;
      setName(`Học kỳ mới (${currentYear} - ${nextYear})`);
      setStartDate(now.toISOString().split('T')[0]);
      const end = new Date(now);
      end.setMonth(end.getMonth() + 4);
      setEndDate(end.toISOString().split('T')[0]);
      setTargetGpa('3.80');
      setIsCurrent(false);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});

    const rawPayload = {
      name,
      startDate,
      endDate,
      targetGpa: targetGpa.trim() === '' ? undefined : targetGpa,
      isCurrent: isOnlySemester ? true : isCurrent,
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
      await onSave(validation.data, initialData?.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu học kỳ';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEditing ? 'Chỉnh sửa thông tin học kỳ' : 'Tạo học kỳ mới'}
      description="Quản lý thời gian, tên gọi và mục tiêu GPA riêng cho học kỳ"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {errors.form && (
          <div className="p-3 rounded-xl text-xs bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {errors.form}
          </div>
        )}

        <Input
          label="Tên học kỳ *"
          placeholder="Ví dụ: Học kỳ 1 (2026 - 2027)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Ngày bắt đầu *"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.startDate}
            required
          />
          <Input
            label="Ngày kết thúc *"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={errors.endDate}
            required
          />
        </div>

        <Input
          label="Mục tiêu GPA (Thang 4.0)"
          type="number"
          step="0.01"
          min="0"
          max="4.0"
          placeholder="Ví dụ: 3.80"
          value={targetGpa}
          onChange={(e) => setTargetGpa(e.target.value)}
          error={errors.targetGpa}
          helperText="Mục tiêu GPA được lưu trữ riêng cho từng học kỳ"
        />

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isCurrent}
              disabled={isEditing && initialData?.isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Đặt làm học kỳ hiện tại (Active Semester)
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                {isEditing && initialData?.isCurrent
                  ? 'Đây đang là học kỳ hiện tại của hệ thống.'
                  : 'Hệ thống sẽ cập nhật Dashboard, Thời khóa biểu và Navbar sang học kỳ này.'}
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
          >
            {isEditing ? 'Lưu thay đổi' : 'Tạo học kỳ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

