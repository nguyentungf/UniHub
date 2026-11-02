import React, { useState, useEffect } from 'react';
import { Exam, Course, ExamType, ExamStatus } from '@/types';
import { ExamFormSchema } from '@/lib/validation/schemas';
import { Modal, Input, Select, Button, Textarea } from '@/components/ui';
import { Plus, X } from 'lucide-react';

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exam: Exam) => Promise<void>;
  initialData?: Exam | null;
  courses: Course[];
  defaultCourseId?: string;
}

export const ExamFormModal: React.FC<ExamFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  courses,
  defaultCourseId,
}) => {
  const isEditing = !!initialData;

  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [examType, setExamType] = useState<ExamType>('midterm');
  const [examDate, setExamDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('90');
  const [location, setLocation] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [weight, setWeight] = useState('30');
  const [targetScore, setTargetScore] = useState('90');
  const [actualScore, setActualScore] = useState('');
  const [status, setStatus] = useState<ExamStatus>('upcoming');
  const [notes, setNotes] = useState('');

  // Dynamic topics list
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatForInput = (isoString?: string): string => {
    if (!isoString) {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      d.setHours(9, 0, 0, 0);
      return d.toISOString().slice(0, 16);
    }
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCourseId(initialData.courseId);
      setExamType(initialData.examType);
      setExamDate(formatForInput(initialData.examDate));
      setDurationMinutes(String(initialData.durationMinutes || 90));
      setLocation(initialData.location);
      setSeatNumber(initialData.seatNumber || '');
      setWeight(initialData.weight !== undefined ? String(initialData.weight) : '30');
      setTargetScore(initialData.targetScore !== undefined ? String(initialData.targetScore) : '90');
      setActualScore(initialData.actualScore !== undefined ? String(initialData.actualScore) : '');
      setStatus(initialData.status || 'upcoming');
      setNotes(initialData.notes || '');
      setTopics(initialData.topics || []);
    } else {
      setTitle('');
      setCourseId(defaultCourseId || courses[0]?.id || '');
      setExamType('midterm');
      setExamDate(formatForInput());
      setDurationMinutes('90');
      setLocation('Turing Hall - Room 302');
      setSeatNumber('');
      setWeight('30');
      setTargetScore('90');
      setActualScore('');
      setStatus('upcoming');
      setNotes('');
      setTopics(['Topic 1', 'Topic 2']);
    }
    setErrors({});
  }, [initialData, isOpen, defaultCourseId, courses]);

  const handleAddTopic = () => {
    const trimmed = newTopicInput.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setNewTopicInput('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const rawData = {
      title,
      courseId,
      examType,
      examDate,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 90,
      location,
      seatNumber: seatNumber.trim() || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      topics,
      targetScore: targetScore ? parseFloat(targetScore) : undefined,
      actualScore: actualScore ? parseFloat(actualScore) : undefined,
      maxScore: 100,
      notes: notes.trim() || undefined,
      status,
    };

    const parsed = ExamFormSchema.safeParse(rawData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    let normalizedDate = examDate;
    try {
      const d = new Date(examDate);
      if (!isNaN(d.getTime())) {
        normalizedDate = d.toISOString();
      }
    } catch {
      // Keep raw
    }

    setIsSubmitting(true);
    try {
      const examToSave: Exam = {
        id: initialData?.id || `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        courseId: parsed.data.courseId,
        title: parsed.data.title,
        examType: parsed.data.examType,
        examDate: normalizedDate,
        durationMinutes: parsed.data.durationMinutes,
        location: parsed.data.location,
        seatNumber: parsed.data.seatNumber,
        weight: parsed.data.weight,
        topics: parsed.data.topics,
        targetScore: parsed.data.targetScore,
        actualScore: parsed.data.actualScore,
        maxScore: parsed.data.maxScore,
        notes: parsed.data.notes,
        status: parsed.data.status,
      };

      await onSubmit(examToSave);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save exam';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Examination' : 'Schedule New Examination'}
      description={
        isEditing
          ? 'Update exam date, hall location, seat allocation, and syllabus checklist'
          : 'Register a midterm, final exam, lab practical, or quiz'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Course *"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            options={courses.map((c) => ({
              value: c.id,
              label: `${c.code} · ${c.name}`,
            }))}
            error={errors.courseId}
            required
          />

          <Select
            label="Exam Type *"
            value={examType}
            onChange={(e) => setExamType(e.target.value as ExamType)}
            options={[
              { value: 'midterm', label: 'Midterm Exam' },
              { value: 'final', label: 'Final Exam' },
              { value: 'quiz', label: 'Quiz' },
              { value: 'practical', label: 'Lab Practical' },
            ]}
            error={errors.examType}
          />
        </div>

        <Input
          label="Exam Title *"
          placeholder="e.g. Midterm Examination - Algorithms & Graphs"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Date & Time *"
            type="datetime-local"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            error={errors.examDate}
            required
          />

          <Input
            label="Duration (Minutes) *"
            type="number"
            min="1"
            max="600"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            error={errors.durationMinutes}
            required
          />

          <Select
            label="Status *"
            value={status}
            onChange={(e) => setStatus(e.target.value as ExamStatus)}
            options={[
              { value: 'upcoming', label: 'Upcoming / Scheduled' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            error={errors.status}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Exam Location / Room *"
            placeholder="e.g. Science Complex - Hall A"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            error={errors.location}
            required
          />

          <Input
            label="Allocated Seat Number"
            placeholder="e.g. Row 3, Seat 14"
            value={seatNumber}
            onChange={(e) => setSeatNumber(e.target.value)}
            error={errors.seatNumber}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Grade Weight (%)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            placeholder="30"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            error={errors.weight}
          />

          <Input
            label="Target Score (0-100)"
            type="number"
            min="0"
            max="100"
            placeholder="90"
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value)}
            error={errors.targetScore}
          />

          <Input
            label="Actual Score (If completed)"
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 92"
            value={actualScore}
            onChange={(e) => setActualScore(e.target.value)}
            error={errors.actualScore}
          />
        </div>

        {/* Dynamic Revision Topics Checklist Editor */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Revision Checklist Topics
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Add revision topic or chapter..."
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTopic();
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleAddTopic}
            >
              Add
            </Button>
          </div>

          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {topics.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(idx)}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Textarea
          label="Preparation Notes & Permitted Materials"
          placeholder="e.g. Permitted 1 double-sided A4 formula cheat sheet, non-programmable calculator..."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={errors.notes}
        />

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {isEditing ? 'Update Examination' : 'Schedule Exam'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

