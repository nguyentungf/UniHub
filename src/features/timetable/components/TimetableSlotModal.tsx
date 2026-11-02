import React, { useState, useEffect, useMemo } from 'react';
import { Course, TimetableSlot, DayOfWeek } from '@/types';
import { TimetableSlotFormSchema } from '@/lib/validation/schemas';
import { findConflictingSlots, getDayName } from '../utils/timetableConflict';
import { Modal, Input, Select, Button } from '@/components/ui';
import { AlertTriangle, Clock, MapPin, User, Calendar } from 'lucide-react';

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
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
  { day: 6, name: 'Saturday' },
  { day: 7, name: 'Sunday' },
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
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('Turing Hall');
  const [room, setRoom] = useState('Room 302');
  const [instructor, setInstructor] = useState('');
  const [type, setType] = useState<TimetableSlot['type']>('lecture');
  const [recurrence, setRecurrence] = useState<TimetableSlot['recurrence']>('weekly');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } else {
      const firstCourse = courses[0];
      setCourseId(firstCourse?.id || '');
      setDayOfWeek(defaultDay);
      setStartTime('08:30');
      setEndTime('10:00');
      setLocation(firstCourse?.location?.split('-')[0]?.trim() || 'Turing Hall');
      setRoom(firstCourse?.location?.includes('Room') ? firstCourse.location.split('Room')[1]?.trim() || 'Room 302' : 'Room 101');
      setInstructor(firstCourse?.instructor || '');
      setType('lecture');
      setRecurrence('weekly');
    }
    setErrors({});
  }, [initialData, isOpen, courses, defaultDay]);

  // When course selection changes, auto-fill instructor and location if empty
  const handleCourseChange = (newCourseId: string) => {
    setCourseId(newCourseId);
    const selectedCourse = courses.find((c) => c.id === newCourseId);
    if (selectedCourse) {
      if (selectedCourse.instructor && !instructor) {
        setInstructor(selectedCourse.instructor);
      }
      if (selectedCourse.location && !location) {
        setLocation(selectedCourse.location);
      }
    }
  };

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
      },
      existingSlots
    );
  }, [initialData, dayOfWeek, startTime, endTime, recurrence, existingSlots]);

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
      title={isEditing ? 'Edit Class Session' : 'Schedule New Class Session'}
      description="Add a recurring lecture, lab, seminar, or tutorial to your weekly academic calendar"
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
              <span>Scheduling Conflict Detected!</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This session overlaps with {detectedConflicts.length} existing class(es) on {getDayName(dayOfWeek)}:
            </p>
            <ul className="list-disc list-inside text-[11px] font-medium space-y-0.5">
              {detectedConflicts.map((c) => {
                const confCourse = courses.find((course) => course.id === c.courseId);
                return (
                  <li key={c.id}>
                    <strong>{confCourse?.code || 'Course'}</strong> ({c.startTime} - {c.endTime}) in {c.location} {c.room ? `(${c.room})` : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Select
          label="Enrolled Course *"
          value={courseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          error={errors.courseId}
          options={courses.map((c) => ({
            value: c.id,
            label: `${c.code} · ${c.name}`,
          }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Day of Week *"
            value={String(dayOfWeek)}
            onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10) as DayOfWeek)}
            error={errors.dayOfWeek}
            options={DAYS.map((d) => ({
              value: String(d.day),
              label: d.name,
            }))}
          />

          <Select
            label="Class Type *"
            value={type}
            onChange={(e) => setType(e.target.value as TimetableSlot['type'])}
            options={[
              { value: 'lecture', label: 'Lecture' },
              { value: 'lab', label: 'Laboratory' },
              { value: 'seminar', label: 'Seminar' },
              { value: 'tutorial', label: 'Tutorial / Recitation' },
            ]}
          />

          <Select
            label="Recurrence *"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as TimetableSlot['recurrence'])}
            options={[
              { value: 'weekly', label: 'Every Week' },
              { value: 'biweekly_odd', label: 'Bi-weekly (Odd Weeks)' },
              { value: 'biweekly_even', label: 'Bi-weekly (Even Weeks)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Time (HH:mm) *"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            error={errors.startTime}
            required
          />
          <Input
            label="End Time (HH:mm) *"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            error={errors.endTime}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Building / Hall / Campus *"
              placeholder="e.g. Turing Hall"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              error={errors.location}
              required
            />
          </div>
          <div>
            <Input
              label="Room Number"
              placeholder="e.g. Room 302"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
        </div>

        <Input
          label="Instructor / Lecturer (Optional)"
          placeholder="e.g. Dr. Sarah Mitchell"
          value={instructor}
          onChange={(e) => setInstructor(e.target.value)}
        />

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {isEditing ? 'Update Session' : 'Add to Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
