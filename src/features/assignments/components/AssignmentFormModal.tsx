import React, { useState, useEffect } from 'react';
import { Assignment, Course, PriorityLevel, AssignmentStatus } from '@/types';
import { AssignmentFormSchema } from '@/lib/validation/schemas';
import { Modal, Input, Select, Button, Textarea } from '@/components/ui';

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assignment: Assignment) => Promise<void>;
  initialData?: Assignment | null;
  courses: Course[];
  defaultCourseId?: string;
}

export const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({
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
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [status, setStatus] = useState<AssignmentStatus>('todo');
  const [weight, setWeight] = useState('10');
  const [maxScore, setMaxScore] = useState('100');
  const [earnedScore, setEarnedScore] = useState('');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format Date for datetime-local input: YYYY-MM-DDTHH:mm
  const formatForInput = (isoString?: string): string => {
    if (!isoString) {
      // Default to 7 days from now at 23:59
      const d = new Date();
      d.setDate(d.getDate() + 7);
      d.setHours(23, 59, 0, 0);
      return d.toISOString().slice(0, 16);
    }
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      // Format as local YYYY-MM-DDTHH:mm
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
      setDueDate(formatForInput(initialData.dueDate));
      setPriority(initialData.priority);
      setStatus(initialData.status);
      setWeight(initialData.weight !== undefined ? String(initialData.weight) : '10');
      setMaxScore(String(initialData.maxScore || 100));
      setEarnedScore(initialData.earnedScore !== undefined ? String(initialData.earnedScore) : '');
      setDescription(initialData.description || '');
    } else {
      setTitle('');
      setCourseId(defaultCourseId || courses[0]?.id || '');
      setDueDate(formatForInput());
      setPriority('medium');
      setStatus('todo');
      setWeight('10');
      setMaxScore('100');
      setEarnedScore('');
      setDescription('');
    }
    setErrors({});
  }, [initialData, isOpen, defaultCourseId, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate using Zod schema
    const rawData = {
      title,
      courseId,
      dueDate,
      priority,
      status,
      description: description.trim() || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      maxScore: maxScore ? parseFloat(maxScore) : 100,
      earnedScore: earnedScore ? parseFloat(earnedScore) : undefined,
      reminderBeforeHours: 24,
    };

    const parsed = AssignmentFormSchema.safeParse(rawData);
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

    // Convert local datetime to ISO string with timezone safety
    let normalizedDueDate = dueDate;
    try {
      const d = new Date(dueDate);
      if (!isNaN(d.getTime())) {
        normalizedDueDate = d.toISOString();
      }
    } catch {
      // Keep raw if conversion fails
    }

    setIsSubmitting(true);
    try {
      const assignmentToSave: Assignment = {
        id: initialData?.id || `asg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        courseId: parsed.data.courseId,
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: normalizedDueDate,
        priority: parsed.data.priority,
        status: parsed.data.status,
        weight: parsed.data.weight,
        maxScore: parsed.data.maxScore,
        earnedScore: parsed.data.earnedScore,
        reminderBeforeHours: parsed.data.reminderBeforeHours,
      };

      await onSubmit(assignmentToSave);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save assignment';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Assignment' : 'Add New Assignment'}
      description={
        isEditing
          ? 'Update deadline, course, status, or scoring weight'
          : 'Schedule a homework deadline, lab submission, or project milestone'
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
            label="Priority *"
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
            options={[
              { value: 'urgent', label: 'Urgent Priority' },
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' },
            ]}
            error={errors.priority}
          />
        </div>

        <Input
          label="Assignment Title *"
          placeholder="e.g. Red-Black Tree Implementation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Due Date & Time *"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            error={errors.dueDate}
            required
          />

          <Select
            label="Current Status *"
            value={status}
            onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
            options={[
              { value: 'todo', label: 'Not Started' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'graded', label: 'Graded' },
            ]}
            error={errors.status}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Grade Weight (%)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            placeholder="10"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            error={errors.weight}
          />

          <Input
            label="Max Points"
            type="number"
            min="1"
            placeholder="100"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            error={errors.maxScore}
          />

          <Input
            label="Earned Points (Optional)"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 95"
            value={earnedScore}
            onChange={(e) => setEarnedScore(e.target.value)}
            error={errors.earnedScore}
          />
        </div>

        <Textarea
          label="Description & Instructions"
          placeholder="Optional submission details, rubric, requirements, or link to problem specification..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
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
            {isEditing ? 'Update Assignment' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

