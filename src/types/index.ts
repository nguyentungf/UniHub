/**
 * UniHub Core TypeScript Type Definitions
 * Centralized schema interfaces for all domain entities, UI state, and storage envelopes.
 */

// ==========================================
// 1. Common & Utility Types
// ==========================================

export type ID = string;
export type ISODateString = string; // e.g. "2026-11-01"
export type ISODateTimeString = string; // e.g. "2026-11-01T08:30:00Z"
export type TimeString = string; // e.g. "08:30", "14:15" (24-hour HH:mm)

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Monday, 7 = Sunday
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

// ==========================================
// 2. Domain Entities
// ==========================================

/**
 * Academic Semester (e.g., Fall 2026, Spring 2027)
 */
export interface Semester {
  id: ID;
  name: string;
  startDate: ISODateString;
  endDate: ISODateString;
  isCurrent: boolean;
  targetGpa?: number;
}

/**
 * Course Grading Component Breakdown (e.g. Midterm 30%, Lab 20%, Final 50%)
 */
export interface CourseGradingComponent {
  id: ID;
  name: string;
  weight: number; // Percentage, sum of weights usually equals 100
  earnedScore?: number; // Optional actual score received (0-100)
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: ID;
  date: ISODateString;
  status: AttendanceStatus;
  note?: string;
}

export interface CourseLesson {
  id: ID;
  lessonNumber: number;
  title: string;
  isCompleted: boolean;
  completedAt?: ISODateTimeString;
  description?: string;
}

/**
 * University Course (e.g. CS101, Data Structures)
 */
export interface Course {
  id: ID;
  semesterId: ID;
  code: string; // e.g. "CS201"
  name: string; // e.g. "Data Structures & Algorithms"
  credits: number; // e.g. 3 or 4
  color: string; // Hex color code for UI cards and calendar badges (e.g. "#3B82F6")
  instructor?: string;
  location?: string;
  syllabusUrl?: string;
  gradingComponents: CourseGradingComponent[];
  targetGrade?: string; // e.g. "A", "3.7"
  actualGrade?: number; // Final calculated grade (0 - 4.0 or 0 - 100)
  percentageScore?: number; // Raw percentage score (0 - 100)
  letterGrade?: string; // Letter grade representation (e.g. "A", "B+")
  status: 'enrolled' | 'completed' | 'dropped';
  notes?: string;
  totalLessons?: number;
  completedLessons?: number;
  lessons?: CourseLesson[];
  attendanceRecords?: AttendanceRecord[];
}

/**
 * Weekly Recurring Timetable Slot (Class Schedule)
 */
export interface TimetableSlot {
  id: ID;
  courseId: ID;
  dayOfWeek: DayOfWeek;
  startTime: TimeString; // "HH:mm"
  endTime: TimeString;   // "HH:mm"
  location: string;
  room?: string;
  instructor?: string;
  type: 'lecture' | 'lab' | 'seminar' | 'tutorial';
  recurrence: 'weekly' | 'biweekly_odd' | 'biweekly_even';
}

export interface TimetableConflict {
  slotA: TimetableSlot;
  slotB: TimetableSlot;
  reason: string;
}

export type AssignmentStatus = 'todo' | 'in_progress' | 'completed' | 'submitted' | 'graded';

/**
 * Course Assignment / Homework
 */
export interface Assignment {
  id: ID;
  courseId: ID;
  title: string;
  description?: string;
  dueDate: ISODateTimeString;
  priority: PriorityLevel;
  status: AssignmentStatus;
  weight?: number; // Contribution percentage to course grade
  maxScore: number; // Default: 100
  earnedScore?: number;
  reminderBeforeHours?: number; // e.g., 24
}

export type ExamType = 'quiz' | 'midterm' | 'final' | 'practical';
export type ExamStatus = 'upcoming' | 'completed' | 'in_progress' | 'cancelled';

/**
 * Course Exam (Midterm, Final, Quiz, Lab Practical)
 */
export interface Exam {
  id: ID;
  courseId: ID;
  title: string;
  examType: ExamType;
  examDate: ISODateTimeString;
  durationMinutes: number;
  location: string;
  seatNumber?: string;
  weight?: number; // Percentage of course grade
  topics: string[];
  targetScore?: number;
  actualScore?: number;
  maxScore: number;
  notes?: string;
  status?: ExamStatus;
}

/**
 * Study Tracker Log / Pomodoro Session
 */
export interface StudySession {
  id: ID;
  courseId?: ID | null; // Optional: can be null for general study
  title?: string;
  startTime: ISODateTimeString;
  endTime: ISODateTimeString;
  durationMinutes: number;
  sessionType: 'pomodoro' | 'stopwatch' | 'manual';
  focusRating: 1 | 2 | 3 | 4 | 5; // 1 = Very Distracted, 5 = Deep Flow
  notes?: string;
}

/**
 * Study Note (Markdown with Tags)
 */
export interface Note {
  id: ID;
  courseId?: ID | null;
  title: string;
  content: string; // Markdown formatted text
  tags: string[];
  isPinned: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

/**
 * Student & Application Settings (Stored in LocalStorage)
 */
export interface PomodoroSettings {
  workDuration: number;      // in minutes (default 25)
  shortBreak: number;        // in minutes (default 5)
  longBreak: number;         // in minutes (default 15)
  longBreakInterval: number; // every N work cycles (default 4)
  autoStartBreaks: boolean;
}

export type GradingScaleType = '4.0' | '10.0' | 'letter';

export interface UserSettings {
  studentName: string;
  universityName: string;
  major: string;
  activeSemesterId: ID | null;
  theme: 'light' | 'dark' | 'system';
  gradingScaleType: GradingScaleType;
  pomodoro: PomodoroSettings;
  assignmentReminderHours: number;
  examReminderDays: number;
}

// ==========================================
// 3. Backup Envelope & Import/Export
// ==========================================

export interface UniHubBackupData {
  version: number;
  exportedAt: ISODateTimeString;
  appName: 'UniHub';
  data: {
    semesters: Semester[];
    courses: Course[];
    timetable: TimetableSlot[];
    assignments: Assignment[];
    exams: Exam[];
    studySessions: StudySession[];
    notes: Note[];
    settings: UserSettings;
  };
}

// ==========================================
// 4. GPA Calculation & Analytical Types
// ==========================================

export interface GradeScaleTier {
  letter: string;
  gradePoint: number;
  minPercentage: number;
  maxPercentage: number;
  description?: string;
}

export type ScaleSystemType = '4.0' | '4.33' | '10.0' | 'custom';

export interface GradingScale {
  id: string;
  name: string;
  scaleType: ScaleSystemType;
  maxGpa: number;
  isCustom?: boolean;
  tiers: GradeScaleTier[];
}

export interface GradeRecord {
  id: ID;
  courseId: ID;
  courseCode: string;
  courseName: string;
  semesterId: ID;
  semesterName?: string;
  credits: number;
  gradePoint?: number;
  letterGrade?: string;
  percentageScore?: number;
  status: 'enrolled' | 'completed' | 'dropped';
  color?: string;
  notes?: string;
}

export interface CourseGpaItem {
  courseId: ID;
  courseCode: string;
  courseName: string;
  credits: number;
  gradePoint: number; // Scaled grade point (e.g. 4.0, 3.7)
  letterGrade?: string;
  percentageScore?: number;
  isPassing: boolean;
}

export interface SemesterGpaSummary {
  semesterId: ID;
  semesterName: string;
  totalCredits: number;
  earnedCredits: number;
  attemptedCredits: number;
  qualityPoints: number;
  gpa: number;
  weightedPercentage: number | null;
  coursesCount: number;
  gradedCoursesCount: number;
  ungradedCoursesCount: number;
  courses: CourseGpaItem[];
}

export interface CumulativeGpaSummary {
  cumulativeGpa: number;
  totalQualityPoints: number;
  totalCreditsAttempted: number;
  totalCreditsEarned: number;
  totalCreditsInProgress: number;
  overallWeightedPercentage: number | null;
  totalCoursesCount: number;
  gradedCoursesCount: number;
  ungradedCoursesCount: number;
  academicStanding: {
    title: string;
    honors: string;
    color: string;
  };
  semesters: SemesterGpaSummary[];
}

export interface GpaHistoryPoint {
  semesterId: ID;
  semesterName: string;
  semesterGpa: number;
  cumulativeGpa: number;
  creditsEarned: number;
  cumulativeCredits: number;
  targetGpa?: number;
}
