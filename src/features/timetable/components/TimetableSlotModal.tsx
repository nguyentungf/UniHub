import React, { useState, useEffect, useMemo } from 'react';
import { Course, TimetableSlot, DayOfWeek, RecurrenceType } from '@/types';
import { TimetableSlotFormSchema } from '@/lib/validation/schemas';
import { findConflictingSlots, parseStudyWeeks } from '../utils/timetableConflict';
import { Modal, Input, Select, Button } from '@/components/ui';
import { AlertTriangle, Clock, MapPin, User, Calendar, Check, Sparkles } from 'lucide-react';

interface TimetableSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (slot: TimetableSlot) => Promise<void>;
  initialData?: TimetableSlot | null;
  courses: Course[];
  existingSlots: TimetableSlot[];
  defaultDay?: DayOfWeek;
}

const DAYS: { day: DayOfWeek; name: string }[] = [
  { day: 1, name: 'Thứ Hai' },
  { day: 2, name: 'Thứ Ba' },
  { day: 3, name: 'Thứ Tư' },
  { day: 4, name: 'Thứ Năm' },
  { day: 5, name: 'Thứ Sáu' },
  { day: 6, name: 'Thứ Bảy' },
  { day: 7, name: 'Chủ Nhật' },
];

const getDayNameVi = (day: DayOfWeek): string => {
  const map: Record<DayOfWeek, string> = {
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

interface StandardPeriodPreset {
  label: string;
  sub: string;
  start: string;
  end: string;
  session: 'morning' | 'afternoon' | 'evening';
}

const STANDARD_PERIODS: StandardPeriodPreset[] = [
  // Ca sáng (06:45 - 11:50)
  { label: 'Tiết 1 - 3', sub: '06:45 - 09:15', start: '06:45', end: '09:15', session: 'morning' },
  { label: 'Tiết 1 - 4', sub: '06:45 - 10:05', start: '06:45', end: '10:05', session: 'morning' },
  { label: 'Tiết 1 - 5', sub: '06:45 - 11:00', start: '06:45', end: '11:00', session: 'morning' },
  { label: 'Tiết 1 - 6', sub: '06:45 - 11:50', start: '06:45', end: '11:50', session: 'morning' },
  { label: 'Tiết 4 - 6', sub: '09:20 - 11:50', start: '09:20', end: '11:50', session: 'morning' },

  // Ca chiều (12:30 - 17:30)
  { label: 'Tiết 7 - 9', sub: '12:30 - 15:00', start: '12:30', end: '15:00', session: 'afternoon' },
  { label: 'Tiết 7 - 10', sub: '12:30 - 15:50', start: '12:30', end: '15:50', session: 'afternoon' },
  { label: 'Tiết 7 - 11', sub: '12:30 - 16:45', start: '12:30', end: '16:45', session: 'afternoon' },
  { label: 'Tiết 7 - 12', sub: '12:30 - 17:30', start: '12:30', end: '17:30', session: 'afternoon' },
  { label: 'Tiết 10 - 12', sub: '15:05 - 17:30', start: '15:05', end: '17:30', session: 'afternoon' },

  // Ca tối
  { label: 'Tiết 13 - 15', sub: '18:00 - 20:30', start: '18:00', end: '20:30', session: 'evening' },
];

export const TimetableSlotModal: React.FC<TimetableSlotModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  courses,
  existingSlots,
  defaultDay = 1,
}) => {
  const isEditing = !!initialData;

  const [courseId, setCourseId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(defaultDay);
  const [startTime, setStartTime] = useState('06:45');
  const [endTime, setEndTime] = useState('09:15');
  const [location, setLocation] = useState('Turing Hall');
  const [room, setRoom] = useState('Room 302');
  const [instructor, setInstructor] = useState('');
  const [type, setType] = useState<TimetableSlot['type']>('lecture');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('course_weeks');
  const [customWeeks, setCustomWeeks] = useState('2-19');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCourse = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);

  useEffect(() => {
    if (initialData) {
      setCourseId(initialData.courseId);
      setDayOfWeek(initialData.dayOfWeek);
      setStartTime(initialData.startTime);
      setEndTime(initialData.endTime);
      setLocation(initialData.location);
      setRoom(initialData.room || '');
      setInstructor(initialData.instructor || '');
      setType(initialData.type);
      setRecurrence(initialData.recurrence);
      setCustomWeeks(initialData.customWeeks || '');
    } else {
      const firstCourse = courses[0];
      setCourseId(firstCourse?.id || '');
      setDayOfWeek(defaultDay);
      // Standard university curriculum starts at 06:45
      setStartTime('06:45');
      setEndTime('09:15');
      setLocation(firstCourse?.location?.split('-')[0]?.trim() || 'Nhà B1');
      setRoom(
        firstCourse?.location?.includes('Room')
          ? firstCourse.location.split('Room')[1]?.trim() || 'Phòng 302'
          : 'Phòng 302'
      );
      setInstructor(firstCourse?.instructor || '');
      setType('lecture');
      // Default to repeating by registered course studyWeeks
      setRecurrence('course_weeks');
      setCustomWeeks(firstCourse?.studyWeeks || '2-19');
    }
    setErrors({});
  }, [initialData, isOpen, courses, defaultDay]);

  // When course selection changes, update customWeeks and auto-fill details
  const handleCourseChange = (newCourseId: string) => {
    setCourseId(newCourseId);
    const foundCourse = courses.find((c) => c.id === newCourseId);
    if (foundCourse) {
      if (foundCourse.instructor && !instructor) {
        setInstructor(foundCourse.instructor);
      }
      if (foundCourse.location && !location) {
        setLocation(foundCourse.location);
      }
      if (foundCourse.studyWeeks && (!customWeeks || recurrence === 'course_weeks')) {
        setCustomWeeks(foundCourse.studyWeeks);
      }
    }
  };

  // Compute effective weeks string
  const effectiveWeeks = useMemo(() => {
    if (recurrence === 'course_weeks') {
      return selectedCourse?.studyWeeks || customWeeks || '2-19';
    }
    if (recurrence === 'custom') {
      return customWeeks;
    }
    return undefined;
  }, [recurrence, selectedCourse, customWeeks]);

  const parsedCustomWeeks = useMemo(() => {
    return parseStudyWeeks(effectiveWeeks || '');
  }, [effectiveWeeks]);

  // Live conflict detection against all other slots
  const detectedConflicts = useMemo(() => {
    if (!startTime || !endTime || endTime <= startTime) return [];
    return findConflictingSlots(
      {
        id: initialData?.id,
        dayOfWeek,
        startTime,
        endTime,
        recurrence,
        customWeeks: effectiveWeeks,
      },
      existingSlots
    );
  }, [initialData, dayOfWeek, startTime, endTime, recurrence, effectiveWeeks, existingSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      courseId,
      dayOfWeek,
      startTime,
      endTime,
      location: location.trim(),
      room: room.trim() || undefined,
      instructor: instructor.trim() || undefined,
      type,
      recurrence,
      customWeeks: recurrence === 'custom' || recurrence === 'course_weeks' ? effectiveWeeks : undefined,
    };

    const validationResult = TimetableSlotFormSchema.safeParse(formData);
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
      const slotToSave: TimetableSlot = {
        id: initialData?.id || `tt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        courseId: formData.courseId,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        room: formData.room,
        instructor: formData.instructor,
        type: formData.type,
        recurrence: formData.recurrence,
        customWeeks: formData.customWeeks,
      };

      await onSubmit(slotToSave);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save timetable slot';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa tiết học' : 'Xếp lịch tiết học mới'}
      description="Thêm bài giảng, thực hành hoặc chuyên đề vào thời khóa biểu (Chuẩn ca học 06:45 - 17:30, thang 24h)"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300">
            {errors.form}
          </div>
        )}

        {/* Real-time scheduling conflict alert */}
        {detectedConflicts.length > 0 && (
          <div className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200 space-y-1 animate-fade-in">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Phát hiện xung đột lịch học!</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Tiết học này trùng giờ với {detectedConflicts.length} tiết học khác vào {getDayNameVi(dayOfWeek)}:
            </p>
            <ul className="list-disc list-inside text-[11px] font-medium space-y-0.5">
              {detectedConflicts.map((c) => {
                const confCourse = courses.find((course) => course.id === c.courseId);
                return (
                  <li key={c.id}>
                    <strong>{confCourse?.code || 'Môn học'}</strong> ({c.startTime} - {c.endTime}) tại {c.location}{' '}
                    {c.room ? `(${c.room})` : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Select
          label="Môn học đăng ký *"
          value={courseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          error={errors.courseId}
          options={courses.map((c) => ({
            value: c.id,
            label: `${c.code} · ${c.name} ${c.studyWeeks ? `(Tuần: ${c.studyWeeks})` : ''}`,
          }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Thứ trong tuần *"
            value={String(dayOfWeek)}
            onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10) as DayOfWeek)}
            error={errors.dayOfWeek}
            options={DAYS.map((d) => ({
              value: String(d.day),
              label: d.name,
            }))}
          />

          <Select
            label="Loại tiết học *"
            value={type}
            onChange={(e) => setType(e.target.value as TimetableSlot['type'])}
            options={[
              { value: 'lecture', label: 'Lý thuyết' },
              { value: 'lab', label: 'Thực hành' },
              { value: 'seminar', label: 'Chuyên đề / Seminar' },
              { value: 'tutorial', label: 'Bài tập / Thảo luận' },
            ]}
          />

          <Select
            label="Tần suất lặp lịch học *"
            value={recurrence}
            onChange={(e) => {
              const val = e.target.value as RecurrenceType;
              setRecurrence(val);
              if (val === 'course_weeks' && selectedCourse?.studyWeeks) {
                setCustomWeeks(selectedCourse.studyWeeks);
              }
            }}
            options={[
              {
                value: 'course_weeks',
                label: `Theo tuần môn học (${selectedCourse?.studyWeeks || '2-19'})`,
              },
              { value: 'custom', label: 'Tùy chỉnh các tuần học...' },
              { value: 'weekly', label: 'Hàng tuần (Tất cả tuần)' },
              { value: 'biweekly_odd', label: 'Định kỳ (Tuần lẻ)' },
              { value: 'biweekly_even', label: 'Định kỳ (Tuần chẵn)' },
            ]}
          />
        </div>

        {/* Dynamic Recurrence Helper: Course Weeks or Custom Weeks */}
        {recurrence === 'course_weeks' && (
          <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-200 text-xs text-brand-900 dark:bg-brand-950/30 dark:border-brand-900 dark:text-brand-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span>
                Tuân theo lịch đã đăng ký của môn <strong>{selectedCourse?.code}</strong>: Tuần{' '}
                <strong>{selectedCourse?.studyWeeks || '2-19'}</strong>
              </span>
            </div>
            <span className="text-[11px] font-semibold bg-white/80 dark:bg-brand-900 px-2 py-0.5 rounded-lg border border-brand-200 dark:border-brand-800">
              {parsedCustomWeeks.length} buổi học
            </span>
          </div>
        )}

        {recurrence === 'custom' && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 space-y-2">
            <Input
              label="Danh sách tuần học tùy chỉnh *"
              placeholder="VD: 2-9, 11-18 hoặc 1, 3, 5-8"
              value={customWeeks}
              onChange={(e) => setCustomWeeks(e.target.value)}
              error={errors.customWeeks}
              required
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400">Gợi ý nhanh:</span>
                <button
                  type="button"
                  onClick={() => setCustomWeeks('1-8')}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-brand-600 transition-colors"
                >
                  Tuần 1-8
                </button>
                <button
                  type="button"
                  onClick={() => setCustomWeeks('9-16')}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-brand-600 transition-colors"
                >
                  Tuần 9-16
                </button>
                <button
                  type="button"
                  onClick={() => setCustomWeeks('2-19')}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-brand-600 transition-colors"
                >
                  Tuần 2-19
                </button>
                {selectedCourse?.studyWeeks && (
                  <button
                    type="button"
                    onClick={() => setCustomWeeks(selectedCourse.studyWeeks || '')}
                    className="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-semibold"
                  >
                    Môn học ({selectedCourse.studyWeeks})
                  </button>
                )}
              </div>
              {parsedCustomWeeks.length > 0 && (
                <span className="font-semibold text-brand-600 dark:text-brand-400">
                  {parsedCustomWeeks.length} buổi
                </span>
              )}
            </div>
          </div>
        )}

        {/* Vietnamese Standard University Periods Presets (06:45 - 17:30) */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-500" />
              Chọn nhanh theo tiết học chuẩn (06:45 - 17:30, Thang 24h)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Bách Khoa / ĐHQG chuẩn</span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {/* Morning sessions (06:45 - 11:50) */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Ca sáng (06:45 - 11:50):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STANDARD_PERIODS.filter((p) => p.session === 'morning').map((p) => {
                  const isSelected = startTime === p.start && endTime === p.end;
                  return (
                    <button
                      type="button"
                      key={p.label}
                      onClick={() => {
                        setStartTime(p.start);
                        setEndTime(p.end);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{p.label}</span>
                      <span className="opacity-75 font-mono text-[10px]">({p.sub})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Afternoon sessions (12:30 - 17:30) */}
            <div className="pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Ca chiều (12:30 - 17:30):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STANDARD_PERIODS.filter((p) => p.session === 'afternoon').map((p) => {
                  const isSelected = startTime === p.start && endTime === p.end;
                  return (
                    <button
                      type="button"
                      key={p.label}
                      onClick={() => {
                        setStartTime(p.start);
                        setEndTime(p.end);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{p.label}</span>
                      <span className="opacity-75 font-mono text-[10px]">({p.sub})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 24-Hour Time Inputs (thang giờ 24h) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="Giờ bắt đầu (Thang 24h: HH:mm) *"
              type="time"
              step="300"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              error={errors.startTime}
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">VD: 06:45 (Tiết 1), 12:30 (Tiết 7)</p>
          </div>
          <div>
            <Input
              label="Giờ kết thúc (Thang 24h: HH:mm) *"
              type="time"
              step="300"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              error={errors.endTime}
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">VD: 09:15, 11:50, 17:30 (Tiết 12)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Tòa nhà / Giảng đường / Cơ sở *"
              placeholder="VD: Nhà B1, Giảng đường D9"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              error={errors.location}
              required
            />
          </div>
          <div>
            <Input
              label="Số phòng"
              placeholder="VD: Phòng 302"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
        </div>

        <Input
          label="Mã lớp"
          placeholder="VD: 173808"
          value={instructor}
          onChange={(e) => setInstructor(e.target.value)}
        />

        <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 z-10">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {isEditing ? 'Cập nhật tiết học' : 'Thêm vào thời khóa biểu'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
