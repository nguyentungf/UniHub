/**
 * UniHub Zod Validation Schemas
 * Used for form input validation, mutation safety, and backup import/export verification.
 */

import { z } from 'zod';

// ==========================================
// 1. Primitive Reusable Schemas
// ==========================================

export const IdSchema = z.string().min(1, 'ID is required');
export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
export const DateTimeStringSchema = z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' });
export const TimeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm (24-hour)');

// ==========================================
// 2. Entity Schemas
// ==========================================

export const SemesterSchema = z.object({
  id: IdSchema,
  name: z.string().min(1, 'Semester name is required'),
  startDate: DateStringSchema,
  endDate: DateStringSchema,
  isCurrent: z.boolean().default(false),
  targetGpa: z.number().min(0).max(4.0).optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be after or on start date',
  path: ['endDate'],
});

export const SemesterFormSchema = z.object({
  name: z.string().trim().min(1, 'Tên học kỳ không được để trống'),
  startDate: DateStringSchema,
  endDate: DateStringSchema,
  isCurrent: z.boolean().default(false),
  targetGpa: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, 'Mục tiêu GPA không thể nhỏ hơn 0').max(4.0, 'Mục tiêu GPA tối đa là 4.0').optional()
  ),
}).refine(data => data.endDate >= data.startDate, {
  message: 'Ngày kết thúc phải diễn ra sau hoặc cùng ngày bắt đầu',
  path: ['endDate'],
});

export type SemesterFormData = z.infer<typeof SemesterFormSchema>;

export const CourseGradingComponentSchema = z.object({
  id: IdSchema,
  name: z.string().min(1, 'Component name is required'),
  weight: z.number().min(0).max(100, 'Weight must be between 0 and 100'),
  earnedScore: z.number().min(0).max(100).optional(),
});

export const AttendanceRecordSchema = z.object({
  id: IdSchema,
  date: DateStringSchema,
  status: z.enum(['present', 'absent', 'late', 'excused']).default('present'),
  note: z.string().optional(),
});

export const CourseLessonSchema = z.object({
  id: IdSchema,
  lessonNumber: z.number().int().min(1),
  title: z.string().min(1, 'Lesson title is required'),
  isCompleted: z.boolean().default(false),
  completedAt: z.string().optional(),
  description: z.string().optional(),
});

export const CourseSchema = z.object({
  id: IdSchema,
  semesterId: IdSchema,
  code: z.string().min(1, 'Course code is required').max(20),
  name: z.string().min(1, 'Course name is required'),
  credits: z.number().min(0, 'Credits cannot be negative').max(30),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color code'),
  instructor: z.string().optional(),
  location: z.string().optional(),
  syllabusUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  gradingComponents: z.array(CourseGradingComponentSchema).default([]),
  targetGrade: z.string().optional(),
  actualGrade: z.number().min(0).max(100).optional(),
  percentageScore: z.number().min(0).max(100).optional(),
  letterGrade: z.string().optional(),
  status: z.enum(['enrolled', 'completed', 'dropped']).default('enrolled'),
  notes: z.string().optional(),
  studyWeeks: z.string().optional(),
  totalLessons: z.number().min(0).default(15),
  completedLessons: z.number().min(0).default(0),
  lessons: z.array(CourseLessonSchema).default([]),
  attendanceRecords: z.array(AttendanceRecordSchema).default([]),
});

export const CourseFormSchema = z.object({
  code: z.string().min(1, 'Course code is required').max(20, 'Course code is too long'),
  name: z.string().min(1, 'Course name is required'),
  credits: z.number().min(0, 'Credits cannot be negative').max(30, 'Credits maximum is 30'),
  semesterId: z.string().min(1, 'Please select a semester'),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color code'),
  instructor: z.string().optional(),
  location: z.string().optional(),
  syllabusUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  targetGrade: z.string().optional(),
  status: z.enum(['enrolled', 'completed', 'dropped']).default('enrolled'),
  studyWeeks: z.string().optional(),
  totalLessons: z.number().min(0, 'Lessons cannot be negative').default(15),
  notes: z.string().optional(),
});

export const TimetableSlotSchema = z.object({
  id: IdSchema,
  courseId: IdSchema,
  dayOfWeek: z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4),
    z.literal(5), z.literal(6), z.literal(7)
  ]),
  startTime: TimeStringSchema,
  endTime: TimeStringSchema,
  location: z.string().min(1, 'Location is required'),
  room: z.string().optional(),
  instructor: z.string().optional(),
  type: z.enum(['lecture', 'lab', 'seminar', 'tutorial']).default('lecture'),
  recurrence: z.enum(['weekly', 'biweekly_odd', 'biweekly_even', 'course_weeks', 'custom']).default('weekly'),
  customWeeks: z.string().optional(),
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const TimetableSlotFormSchema = z.object({
  courseId: z.string().min(1, 'Please select a course'),
  dayOfWeek: z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4),
    z.literal(5), z.literal(6), z.literal(7)
  ]),
  startTime: TimeStringSchema,
  endTime: TimeStringSchema,
  location: z.string().min(1, 'Location/Building is required'),
  room: z.string().optional(),
  instructor: z.string().optional(),
  type: z.enum(['lecture', 'lab', 'seminar', 'tutorial']).default('lecture'),
  recurrence: z.enum(['weekly', 'biweekly_odd', 'biweekly_even', 'course_weeks', 'custom']).default('weekly'),
  customWeeks: z.string().optional(),
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export function isValidDateInput(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const parsed = Date.parse(value);
  if (isNaN(parsed)) return false;

  const d = new Date(parsed);
  const year = d.getFullYear();
  if (year < 2000 || year > 2100) return false;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    if (m < 1 || m > 12) return false;
    const daysInMonth = new Date(y, m, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;
  }
  return true;
}

export const AssignmentSchema = z.object({
  id: IdSchema,
  courseId: IdSchema,
  title: z.string().min(1, 'Assignment title is required'),
  description: z.string().optional(),
  dueDate: DateTimeStringSchema,
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'completed', 'submitted', 'graded']).default('todo'),
  weight: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(1).default(100),
  earnedScore: z.number().min(0).optional(),
  reminderBeforeHours: z.number().min(0).default(24),
});

export const AssignmentFormSchema = z.object({
  title: z.string().trim().min(1, 'Assignment title is required').max(120, 'Title cannot exceed 120 characters'),
  courseId: z.string().min(1, 'Please select a course'),
  dueDate: z.string().min(1, 'Due date is required').refine(isValidDateInput, {
    message: 'Please provide a valid due date and time',
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'completed', 'submitted', 'graded']).default('todo'),
  description: z.string().optional(),
  weight: z.number().min(0, 'Weight cannot be negative').max(100, 'Weight cannot exceed 100%').optional(),
  maxScore: z.number().min(1, 'Max score must be at least 1').default(100),
  earnedScore: z.number().min(0, 'Earned score cannot be negative').optional(),
  reminderBeforeHours: z.number().min(0).default(24),
});

export const ExamSchema = z.object({
  id: IdSchema,
  courseId: IdSchema,
  title: z.string().min(1, 'Exam title is required'),
  examType: z.enum(['quiz', 'midterm', 'final', 'practical']).default('midterm'),
  examDate: DateTimeStringSchema,
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  location: z.string().min(1, 'Exam room / location is required'),
  seatNumber: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
  topics: z.array(z.string()).default([]),
  targetScore: z.number().min(0).max(100).optional(),
  actualScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(1).default(100),
  notes: z.string().optional(),
  status: z.enum(['upcoming', 'completed', 'in_progress', 'cancelled']).default('upcoming').optional(),
});

export const ExamFormSchema = z.object({
  title: z.string().trim().min(1, 'Exam title is required').max(120, 'Title cannot exceed 120 characters'),
  courseId: z.string().min(1, 'Please select a course'),
  examType: z.enum(['quiz', 'midterm', 'final', 'practical']).default('midterm'),
  examDate: z.string().min(1, 'Exam date is required').refine(isValidDateInput, {
    message: 'Please provide a valid exam date and time',
  }),
  durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute').max(600, 'Duration cannot exceed 600 minutes'),
  location: z.string().trim().min(1, 'Exam room or location is required').max(100, 'Location is too long'),
  seatNumber: z.string().trim().optional(),
  weight: z.number().min(0, 'Weight cannot be negative').max(100, 'Weight cannot exceed 100%').optional(),
  topics: z.array(z.string().trim()).default([]),
  targetScore: z.number().min(0).max(100).optional(),
  actualScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(1).default(100),
  notes: z.string().optional(),
  status: z.enum(['upcoming', 'completed', 'in_progress', 'cancelled']).default('upcoming'),
});

export const StudySessionSchema = z.object({
  id: IdSchema,
  courseId: IdSchema.nullable().optional(),
  title: z.string().optional(),
  startTime: DateTimeStringSchema,
  endTime: DateTimeStringSchema,
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  sessionType: z.enum(['pomodoro', 'stopwatch', 'manual']).default('pomodoro'),
  focusRating: z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)
  ]).default(3),
  notes: z.string().optional(),
});

export const NoteSchema = z.object({
  id: IdSchema,
  courseId: IdSchema.nullable().optional(),
  title: z.string().min(1, 'Note title is required'),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
  createdAt: DateTimeStringSchema,
  updatedAt: DateTimeStringSchema,
});

export const PomodoroSettingsSchema = z.object({
  workDuration: z.number().min(1).max(180).default(25),
  shortBreak: z.number().min(1).max(60).default(5),
  longBreak: z.number().min(1).max(90).default(15),
  longBreakInterval: z.number().min(1).max(12).default(4),
  autoStartBreaks: z.boolean().default(false),
});

export const UserSettingsSchema = z.object({
  studentName: z.string().default('Student'),
  universityName: z.string().default('University'),
  major: z.string().default('Computer Science'),
  activeSemesterId: IdSchema.nullable().default(null),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  gradingScaleType: z.enum(['4.0', '10.0', 'letter']).default('4.0'),
  pomodoro: PomodoroSettingsSchema.default({
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
  }),
  assignmentReminderHours: z.number().min(1).default(24),
  examReminderDays: z.number().min(1).default(7),
});

// ==========================================
// 3. GPA & Grading Scale Schemas
// ==========================================

export const GradeRecordFormSchema = z.object({
  courseId: z.string().optional(),
  courseCode: z.string().trim().min(1, 'Course code is required').max(20, 'Code is too long'),
  courseName: z.string().trim().min(1, 'Course name is required').max(100, 'Name is too long'),
  semesterId: z.string().min(1, 'Please select a semester'),
  credits: z.number().min(0, 'Credits cannot be negative').max(30, 'Credits cannot exceed 30'),
  percentageScore: z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100').optional(),
  letterGrade: z.string().trim().optional(),
  gradePoint: z.number().min(0, 'Grade point cannot be negative').max(10, 'Grade point cannot exceed 10').optional(),
  status: z.enum(['enrolled', 'completed', 'dropped']).default('completed'),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color code').optional(),
  notes: z.string().optional(),
});

export const GradeScaleTierSchema = z.object({
  letter: z.string().trim().min(1, 'Letter label is required'),
  gradePoint: z.number().min(0, 'Grade point cannot be negative').max(10, 'Grade point cannot exceed 10'),
  minPercentage: z.number().min(0, 'Min percentage cannot be negative').max(100, 'Min percentage cannot exceed 100'),
  maxPercentage: z.number().min(0, 'Max percentage cannot be negative').max(100, 'Max percentage cannot exceed 100'),
  description: z.string().optional(),
}).refine((tier) => tier.maxPercentage >= tier.minPercentage, {
  message: 'Max percentage must be greater than or equal to min percentage',
  path: ['maxPercentage'],
});

export const GradingScaleSchema = z.object({
  id: z.string().min(1, 'Scale ID is required'),
  name: z.string().trim().min(1, 'Scale name is required').max(60, 'Scale name is too long'),
  scaleType: z.enum(['4.0', '4.33', '10.0', 'custom']),
  maxGpa: z.number().positive('Max GPA must be positive').max(10, 'Max GPA cannot exceed 10'),
  isCustom: z.boolean().optional(),
  tiers: z.array(GradeScaleTierSchema).min(1, 'Scale must have at least one tier'),
});

// ==========================================
// 4. Backup Envelope Schema for Import/Export
// ==========================================

export const UniHubBackupDataSchema = z.object({
  version: z.number().int().min(1),
  exportedAt: DateTimeStringSchema,
  appName: z.literal('UniHub'),
  data: z.object({
    semesters: z.array(SemesterSchema).default([]),
    courses: z.array(CourseSchema).default([]),
    timetable: z.array(TimetableSlotSchema).default([]),
    assignments: z.array(AssignmentSchema).default([]),
    exams: z.array(ExamSchema).default([]),
    studySessions: z.array(StudySessionSchema).default([]),
    notes: z.array(NoteSchema).default([]),
    settings: UserSettingsSchema,
    gradingScales: z.array(GradingScaleSchema).optional(),
    activeScaleId: z.string().optional(),
  }),
});
