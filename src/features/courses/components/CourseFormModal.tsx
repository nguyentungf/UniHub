import React, { useState, useEffect } from 'react';
import { Course, Semester } from '@/types';
import { CourseFormSchema } from '@/lib/validation/schemas';
import { Modal, Input, Select, Button, Textarea } from '@/components/ui';
import { useSettingsStore } from '@/stores';
import { parseStudyWeeks } from '../utils/courseProgress';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (course: Course) => Promise<void>;
  initialData?: Course | null;
  semesters: Semester[];
  activeSemesterId?: string;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
];

function getTargetGradeOptions(scaleType: '4.0' | '10.0' | 'letter') {
  if (scaleType === '10.0') {
    return [
      { value: '10.0', label: '10.0 (Xuất sắc)' },
      { value: '9.5', label: '9.5 (Xuất sắc)' },
      { value: '9.0', label: '9.0 (Xuất sắc)' },
      { value: '8.5', label: '8.5 (Giỏi)' },
      { value: '8.0', label: '8.0 (Giỏi)' },
      { value: '7.5', label: '7.5 (Khá)' },
      { value: '7.0', label: '7.0 (Khá)' },
      { value: '6.5', label: '6.5 (Trung bình khá)' },
      { value: '6.0', label: '6.0 (Trung bình)' },
      { value: '5.5', label: '5.5 (Trung bình)' },
      { value: '5.0', label: '5.0 (Trung bình yếu)' },
      { value: '4.0', label: '4.0 (Đạt tối thiểu)' },
    ];
  }

  if (scaleType === 'letter') {
    return [
      { value: 'A+', label: 'Điểm A+ (Xuất sắc)' },
      { value: 'A', label: 'Điểm A (Giỏi)' },
      { value: 'B+', label: 'Điểm B+ (Khá giỏi)' },
      { value: 'B', label: 'Điểm B (Khá)' },
      { value: 'C+', label: 'Điểm C+ (Trung bình khá)' },
      { value: 'C', label: 'Điểm C (Trung bình)' },
      { value: 'D+', label: 'Điểm D+ (Trung bình yếu)' },
      { value: 'D', label: 'Điểm D (Đạt tối thiểu)' },
    ];
  }

  // scaleType === '4.0'
  return [
    { value: 'A+', label: 'A+ (4.0 - Xuất sắc)' },
    { value: 'A', label: 'A (4.0 - Giỏi)' },
    { value: 'A-', label: 'A- (3.7 - Giỏi)' },
    { value: 'B+', label: 'B+ (3.3 - Khá)' },
    { value: 'B', label: 'B (3.0 - Khá)' },
    { value: 'B-', label: 'B- (2.7 - Khá)' },
    { value: 'C+', label: 'C+ (2.3 - TB khá)' },
    { value: 'C', label: 'C (2.0 - Trung bình)' },
    { value: 'D+', label: 'D+ (1.3 - TB yếu)' },
    { value: 'D', label: 'D (1.0 - Đạt)' },
  ];
}

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  semesters,
  activeSemesterId,
}) => {
  const isEditing = !!initialData;
  const gradingScaleType = useSettingsStore((state) => state.settings.gradingScaleType);
  const targetGradeOptions = getTargetGradeOptions(gradingScaleType);
  const defaultTargetGrade = gradingScaleType === '10.0' ? '8.5' : 'A';

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('3');
  const [semesterId, setSemesterId] = useState('');
  const [instructor, setInstructor] = useState('');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [targetGrade, setTargetGrade] = useState(defaultTargetGrade);
  const [status, setStatus] = useState<Course['status']>('enrolled');
  const [studyWeeks, setStudyWeeks] = useState('2-19');
  const [syllabusUrl, setSyllabusUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setCredits(String(initialData.credits));
      setSemesterId(initialData.semesterId);
      setInstructor(initialData.instructor || '');
      setLocation(initialData.location || '');
      setColor(initialData.color);
      setTargetGrade(initialData.targetGrade || defaultTargetGrade);
      setStatus(initialData.status);
      setStudyWeeks(
        initialData.studyWeeks ||
        (initialData.totalLessons ? `1-${initialData.totalLessons}` : '2-19')
      );
      setSyllabusUrl(initialData.syllabusUrl || '');
      setNotes(initialData.notes || '');
    } else {
      setCode('');
      setName('');
      setCredits('3');
      setSemesterId(activeSemesterId || semesters[0]?.id || 'sem-fall-2026');
      setInstructor('');
      setLocation('');
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
      setTargetGrade(defaultTargetGrade);
      setStatus('enrolled');
      setStudyWeeks('2-19');
      setSyllabusUrl('');
      setNotes('');
    }
    setErrors({});
  }, [initialData, isOpen, semesters, activeSemesterId, defaultTargetGrade]);

  const parsedWeeks = parseStudyWeeks(studyWeeks);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const calculatedLessons = parsedWeeks.length > 0 ? parsedWeeks.length : 16;
    const parsedCredits = parseInt(credits, 10);
    const effectiveCredits = isNaN(parsedCredits) ? 0 : parsedCredits;

    const formData = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      credits: effectiveCredits,
      semesterId,
      instructor: instructor.trim() || undefined,
      location: location.trim() || undefined,
      color,
      targetGrade: targetGrade.trim() || undefined,
      status,
      studyWeeks: studyWeeks.trim() || undefined,
      totalLessons: calculatedLessons,
      syllabusUrl: syllabusUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const validationResult = CourseFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        if (issue.path[0]) {
          fieldErrors[String(issue.path[0])] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const courseToSave: Course = {
        id: initialData?.id || `course-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        semesterId: formData.semesterId,
        code: formData.code,
        name: formData.name,
        credits: formData.credits,
        color: formData.color,
        instructor: formData.instructor,
        location: formData.location,
        syllabusUrl: formData.syllabusUrl,
        targetGrade: formData.targetGrade,
        status: formData.status,
        studyWeeks: formData.studyWeeks,
        totalLessons: formData.totalLessons,
        completedLessons: initialData?.completedLessons ?? 0,
        lessons: initialData?.lessons ?? [],
        attendanceRecords: initialData?.attendanceRecords ?? [],
        gradingComponents: initialData?.gradingComponents ?? [
          { id: `c-${Date.now()}-1`, name: 'Assignments & Labs', weight: 30 },
          { id: `c-${Date.now()}-2`, name: 'Midterm Examination', weight: 30 },
          { id: `c-${Date.now()}-3`, name: 'Final Examination', weight: 40 },
        ],
        notes: formData.notes,
      };

      await onSubmit(courseToSave);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save course';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Cập nhật môn học · ${initialData.code}` : 'Đăng ký môn học mới'}
      description={
        isEditing
          ? 'Cập nhật thông tin môn học, giảng viên, phòng học, tuần học và điểm mục tiêu'
          : 'Thêm môn học mới, số tín chỉ, màu sắc nhận diện, tuần học và đề cương'
      }
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300">
            {errors.form}
          </div>
        )}

        {/* Row 1: Course Code & Course Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Input
              label="Mã môn học *"
              placeholder="vd: CS201"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={errors.code}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Tên môn học *"
              placeholder="vd: Cấu trúc dữ liệu & Giải thuật"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />
          </div>
        </div>

        {/* Row 2: Semester, Credits, Study Weeks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Học kỳ *"
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            error={errors.semesterId}
            options={semesters.map((s) => ({
              value: s.id,
              label: `${s.name} ${s.isCurrent ? '(Hiện tại)' : ''}`,
            }))}
          />
          <Select
            label="Số tín chỉ *"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            error={errors.credits}
            options={[
              { value: '0', label: '0 Tín chỉ (Không tính GPA/CPA)' },
              { value: '1', label: '1 Tín chỉ' },
              { value: '2', label: '2 Tín chỉ' },
              { value: '3', label: '3 Tín chỉ' },
              { value: '4', label: '4 Tín chỉ' },
              { value: '5', label: '5 Tín chỉ' },
              { value: '6', label: '6 Tín chỉ' },
            ]}
          />
          <div>
            <Input
              label="Tuần học*"
              placeholder="vd: 2-19 hoặc 2-9, 11-18"
              value={studyWeeks}
              onChange={(e) => setStudyWeeks(e.target.value)}
              error={errors.studyWeeks}
              required
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {parsedWeeks.length > 0 ? (
                <span className="font-medium text-brand-600 dark:text-brand-400">
                  Quy đổi: {parsedWeeks.length} buổi học (Tuần {parsedWeeks[0]} → {parsedWeeks[parsedWeeks.length - 1]})
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">
                  Vui lòng nhập định dạng tuần hợp lệ
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Row 3: Instructor & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Mã lớp học phần"
            placeholder="vd: 173808"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
          />
          <Input
            label="Phòng học / Địa điểm"
            placeholder="vd: Nhà A - Phòng 302"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Row 4: Color Picker (Left) & Target Grade + Status (Right) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          {/* Color coding picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Màu nhận diện môn học *
            </label>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {PRESET_COLORS.map((hex) => (
                <button
                  type="button"
                  key={hex}
                  onClick={() => setColor(hex)}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    color === hex
                      ? 'scale-110 border-slate-900 dark:border-white ring-2 ring-brand-500 shadow-sm'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-8 cursor-pointer rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                title="Tùy chọn màu khác"
              />
            </div>
            {errors.color && <p className="text-[11px] text-rose-500 mt-1">{errors.color}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              label={`Điểm mục tiêu`}
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
              options={targetGradeOptions}
            />
            <Select
              label="Trạng thái học phần"
              value={status}
              onChange={(e) => setStatus(e.target.value as Course['status'])}
              options={[
                { value: 'enrolled', label: 'Đang theo học' },
                { value: 'completed', label: 'Đã hoàn thành' },
                { value: 'dropped', label: 'Đã hủy môn' },
              ]}
            />
          </div>
        </div>

        {/* Row 5: Syllabus URL */}
        <Input
          label="Đường dẫn đề cương môn học (Tùy chọn)"
          placeholder="https://example.edu/syllabus"
          type="url"
          value={syllabusUrl}
          onChange={(e) => setSyllabusUrl(e.target.value)}
          error={errors.syllabusUrl}
        />

        {/* Row 6: Notes */}
        <Textarea
          label="Ghi chú môn học & Giờ tiếp sinh viên"
          placeholder="vd: Giờ tiếp SV Thứ 3 lúc 14:00 - 16:00. Nhớ mang laptop đã cài môi trường thực hành."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 z-10">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {isEditing ? 'Lưu thay đổi' : 'Đăng ký môn'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
