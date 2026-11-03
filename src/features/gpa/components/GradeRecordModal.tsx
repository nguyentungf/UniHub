import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Badge } from '@/components/ui';
import { GradeRecord, Semester, Course, GradingScale } from '@/types';
import { GradeRecordFormSchema } from '@/lib/validation/schemas';
import { findTierForPercentage, findTierForLetter } from '../utils/gradingScales';
import { Award, Percent, BookOpen, AlertCircle } from 'lucide-react';

interface GradeRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: GradeRecord | null;
  courses: Course[];
  semesters: Semester[];
  scale: GradingScale;
  onSave: (payload: {
    courseId?: string;
    courseCode: string;
    courseName: string;
    semesterId: string;
    credits: number;
    gradePoint?: number;
    letterGrade?: string;
    percentageScore?: number;
    status: 'enrolled' | 'completed' | 'dropped';
    notes?: string;
  }) => Promise<void>;
}

export const GradeRecordModal: React.FC<GradeRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  courses,
  semesters,
  scale,
  onSave,
}) => {
  const isEditing = Boolean(record);

  // Form states
  const [selectedCourseId, setSelectedCourseId] = useState<string>('custom');
  const [courseCode, setCourseCode] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [semesterId, setSemesterId] = useState<string>('');
  const [credits, setCredits] = useState<number>(3);
  const [percentageScore, setPercentageScore] = useState<string>('');
  const [letterGrade, setLetterGrade] = useState<string>('');
  const [gradePoint, setGradePoint] = useState<string>('');
  const [status, setStatus] = useState<'completed' | 'enrolled' | 'dropped'>('completed');
  const [notes, setNotes] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset or prefill form when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (record) {
        setSelectedCourseId(record.courseId || 'custom');
        setCourseCode(record.courseCode || '');
        setCourseName(record.courseName || '');
        setSemesterId(record.semesterId || semesters[0]?.id || '');
        setCredits(record.credits || 3);
        setPercentageScore(
          record.percentageScore !== undefined ? String(record.percentageScore) : ''
        );
        setLetterGrade(record.letterGrade || '');
        setGradePoint(record.gradePoint !== undefined ? String(record.gradePoint) : '');
        setStatus(record.status || 'completed');
        setNotes(record.notes || '');
      } else {
        const activeSem = semesters.find((s) => s.isCurrent) || semesters[0];
        setSelectedCourseId('custom');
        setCourseCode('');
        setCourseName('');
        setSemesterId(activeSem ? activeSem.id : '');
        setCredits(3);
        setPercentageScore('92');
        const defaultTier = findTierForPercentage(92, scale);
        setLetterGrade(defaultTier.letter);
        setGradePoint(String(defaultTier.gradePoint));
        setStatus('completed');
        setNotes('');
      }
    }
  }, [isOpen, record, semesters, scale]);

  // When user selects an existing course from dropdown
  const handleCourseSelect = (courseIdVal: string) => {
    setSelectedCourseId(courseIdVal);
    if (courseIdVal !== 'custom') {
      const match = courses.find((c) => c.id === courseIdVal);
      if (match) {
        setCourseCode(match.code);
        setCourseName(match.name);
        setSemesterId(match.semesterId);
        setCredits(match.credits);
        setStatus(match.status);
        if (match.actualGrade !== undefined) {
          setGradePoint(String(match.actualGrade));
        }
        if (match.percentageScore !== undefined) {
          setPercentageScore(String(match.percentageScore));
        }
        if (match.letterGrade) {
          setLetterGrade(match.letterGrade);
        }
      }
    }
  };

  // When percentage score changes, automatically compute letter & grade point
  const handlePercentageChange = (valStr: string) => {
    setPercentageScore(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      const tier = findTierForPercentage(num, scale);
      setLetterGrade(tier.letter);
      setGradePoint(String(tier.gradePoint));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.percentageScore;
        delete copy.gradePoint;
        return copy;
      });
    }
  };

  // When letter grade changes, automatically fill grade points
  const handleLetterChange = (letterVal: string) => {
    setLetterGrade(letterVal);
    const tier = findTierForLetter(letterVal, scale);
    if (tier) {
      setGradePoint(String(tier.gradePoint));
      // Set midpoint percentage
      const midPct = ((tier.minPercentage + tier.maxPercentage) / 2).toFixed(1);
      setPercentageScore(midPct);
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.letterGrade;
        delete copy.gradePoint;
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsedCredits = Number(credits);
    const parsedPercentage =
      percentageScore.trim() !== '' ? Number(percentageScore) : undefined;
    const parsedGradePoint =
      gradePoint.trim() !== '' ? Number(gradePoint) : undefined;

    const payload = {
      courseId: selectedCourseId !== 'custom' ? selectedCourseId : undefined,
      courseCode: courseCode.trim(),
      courseName: courseName.trim(),
      semesterId,
      credits: parsedCredits,
      percentageScore: parsedPercentage,
      letterGrade: letterGrade.trim() || undefined,
      gradePoint: parsedGradePoint,
      status,
      notes: notes.trim() || undefined,
    };

    // Zod Validation
    const validation = GradeRecordFormSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save grade record';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa bản ghi điểm' : 'Nhập điểm môn học'}
      description="Ghi nhận điểm số, điểm phần trăm và số tín chỉ tích lũy"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {errors.form && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Existing Course Selector */}
        {!isEditing && courses.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Chọn môn học đã đăng ký hoặc nhập môn mới
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseSelect(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="custom">✏️ Nhập môn học mới / Môn từ kỳ trước</option>
              <optgroup label="Các môn học hiện tại của bạn">
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.credits} TC) [{c.status === 'enrolled' ? 'Đang học' : c.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}]
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        )}

        {/* Course Code & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Input
              label="Mã môn học *"
              placeholder="VD: CS201"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              error={errors.courseCode}
              disabled={selectedCourseId !== 'custom' && !isEditing}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Tên môn học *"
              placeholder="VD: Cấu trúc dữ liệu & Giải thuật"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              error={errors.courseName}
              disabled={selectedCourseId !== 'custom' && !isEditing}
            />
          </div>
        </div>

        {/* Semester & Credits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Học kỳ *
            </label>
            <select
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? '(Hiện tại)' : ''}
                </option>
              ))}
            </select>
            {errors.semesterId && (
              <p className="mt-1 text-[11px] text-rose-500 font-medium">
                {errors.semesterId}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Số tín chỉ *"
              type="number"
              step="0.5"
              min="0"
              max="30"
              value={credits}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setCredits(isNaN(v) ? 0 : v);
              }}
              error={errors.credits}
            />
          </div>
        </div>

        {/* Grade Information Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Award className="h-4 w-4 text-brand-600" />
              <span>Đánh giá điểm số</span>
            </div>
            <Badge variant="brand" size="sm">
              Thang điểm hiện tại: {scale.name}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Raw Percentage Score */}
            <div>
              <Input
                label="Điểm hệ 100 (%)"
                placeholder="0 - 100"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={percentageScore}
                onChange={(e) => handlePercentageChange(e.target.value)}
                error={errors.percentageScore}
                helperText="Tự động tính điểm chữ & GPA"
              />
            </div>

            {/* Letter Grade */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Điểm chữ
              </label>
              <select
                value={letterGrade}
                onChange={(e) => handleLetterChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-600 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-brand-400"
              >
                <option value="">-- Chọn điểm --</option>
                {scale.tiers.map((t) => (
                  <option key={t.letter} value={t.letter}>
                    {t.letter} ({t.gradePoint.toFixed(2)})
                  </option>
                ))}
              </select>
              {errors.letterGrade && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium">
                  {errors.letterGrade}
                </p>
              )}
            </div>

            {/* Grade Point (Direct) */}
            <div>
              <Input
                label={`Điểm hệ số (0 - ${scale.maxGpa})`}
                placeholder={`Tối đa: ${scale.maxGpa}`}
                type="number"
                step="0.01"
                min="0"
                max={scale.maxGpa}
                value={gradePoint}
                onChange={(e) => setGradePoint(e.target.value)}
                error={errors.gradePoint}
                helperText="Điểm chất lượng tính trực tiếp"
              />
            </div>
          </div>

          {/* Quality Point Preview */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500">Điểm chất lượng tính được (QP):</span>
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">
              {((parseFloat(gradePoint) || 0) * (Number(credits) || 0)).toFixed(2)} QP
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Trạng thái môn học
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'completed' | 'enrolled' | 'dropped')
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="completed">Hoàn thành (Tính vào tín chỉ tích lũy & GPA)</option>
              <option value="enrolled">Đang học (Chưa có điểm / Tạm tính)</option>
              <option value="dropped">Đã hủy (Không tính vào GPA)</option>
            </select>
          </div>

          <div>
            <Input
              label="Ghi chú (Tùy chọn)"
              placeholder="VD: Chuyển đổi tín chỉ, Khen thưởng..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 z-10">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Lưu thay đổi' : 'Nhập điểm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

