import React, { useState, useEffect } from 'react';
import { Course, Semester } from '@/types';
import { CourseFormSchema } from '@/lib/validation/schemas';
import { Modal, Input, Select, Button, Textarea } from '@/components/ui';

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

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  semesters,
  activeSemesterId,
}) => {
  const isEditing = !!initialData;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('3');
  const [semesterId, setSemesterId] = useState('');
  const [instructor, setInstructor] = useState('');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [targetGrade, setTargetGrade] = useState('A');
  const [status, setStatus] = useState<Course['status']>('enrolled');
  const [totalLessons, setTotalLessons] = useState('20');
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
      setTargetGrade(initialData.targetGrade || 'A');
      setStatus(initialData.status);
      setTotalLessons(String(initialData.totalLessons ?? 20));
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
      setTargetGrade('A');
      setStatus('enrolled');
      setTotalLessons('20');
      setSyllabusUrl('');
      setNotes('');
    }
    setErrors({});
  }, [initialData, isOpen, semesters, activeSemesterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      credits: parseInt(credits, 10) || 3,
      semesterId,
      instructor: instructor.trim() || undefined,
      location: location.trim() || undefined,
      color,
      targetGrade: targetGrade.trim() || undefined,
      status,
      totalLessons: parseInt(totalLessons, 10) || 20,
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
      title={isEditing ? `Edit Course · ${initialData.code}` : 'Enroll in New Course'}
      description={
        isEditing
          ? 'Update course metadata, instructor, classroom, and credit weighting'
          : 'Add a new academic course, syllabus, credit weight, and color tag'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Input
              label="Course Code *"
              placeholder="e.g. CS201"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={errors.code}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Course Title *"
              placeholder="e.g. Data Structures & Algorithms"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Semester *"
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            error={errors.semesterId}
            options={semesters.map((s) => ({
              value: s.id,
              label: `${s.name} ${s.isCurrent ? '(Current)' : ''}`,
            }))}
          />
          <Select
            label="Credits *"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            error={errors.credits}
            options={[
              { value: '1', label: '1 Credit' },
              { value: '2', label: '2 Credits' },
              { value: '3', label: '3 Credits' },
              { value: '4', label: '4 Credits' },
              { value: '5', label: '5 Credits' },
              { value: '6', label: '6 Credits' },
            ]}
          />
          <Input
            label="Planned Total Lessons"
            type="number"
            min={1}
            max={100}
            value={totalLessons}
            onChange={(e) => setTotalLessons(e.target.value)}
            error={errors.totalLessons}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Professor / Instructor"
            placeholder="e.g. Dr. Sarah Mitchell"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
          />
          <Input
            label="Classroom / Location"
            placeholder="e.g. Turing Hall - Room 302"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Color coding picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Course Color Tag *
            </label>
            <div className="flex items-center gap-2 flex-wrap">
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
                title="Custom Color"
              />
            </div>
            {errors.color && <p className="text-[11px] text-rose-500 mt-1">{errors.color}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Target Grade"
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
              options={[
                { value: 'A+', label: 'A+ (4.0)' },
                { value: 'A', label: 'A (4.0)' },
                { value: 'A-', label: 'A- (3.7)' },
                { value: 'B+', label: 'B+ (3.3)' },
                { value: 'B', label: 'B (3.0)' },
                { value: 'C+', label: 'C+ (2.3)' },
                { value: 'C', label: 'C (2.0)' },
              ]}
            />
            <Select
              label="Enrollment Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Course['status'])}
              options={[
                { value: 'enrolled', label: 'Enrolled' },
                { value: 'completed', label: 'Completed' },
                { value: 'dropped', label: 'Dropped' },
              ]}
            />
          </div>
        </div>

        <Input
          label="Syllabus URL (Optional)"
          placeholder="https://example.edu/syllabus"
          type="url"
          value={syllabusUrl}
          onChange={(e) => setSyllabusUrl(e.target.value)}
          error={errors.syllabusUrl}
        />

        <Textarea
          label="Course Notes & Office Hours"
          placeholder="e.g. Office hours on Tuesdays 14:00 - 16:00. Bring laptop with compiler installed."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Enroll Course'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
