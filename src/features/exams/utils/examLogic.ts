import type { Exam, Course, ExamType, ExamStatus } from '@/types';
import { differenceInDays, differenceInHours, parseISO, isToday, isTomorrow, isPast, format } from 'date-fns';

export interface ExamCountdownInfo {
  daysLeft: number;
  hoursLeft: number;
  isToday: boolean;
  isTomorrow: boolean;
  isPast: boolean;
  label: string;
  badgeVariant: 'amber' | 'rose' | 'emerald' | 'slate';
}

export interface ExamOverviewStats {
  totalExams: number;
  upcomingCount: number;
  completedCount: number;
  nearestExamDays: number | null;
  overallReadinessPercentage: number;
  totalExamWeight: number;
}

export type ExamSortOption =
  | 'examDate_asc'
  | 'examDate_desc'
  | 'weight_desc'
  | 'title_asc'
  | 'title_desc';

export interface ExamFilterCriteria {
  courseId?: string | 'all';
  type?: string | 'all';
  status?: string | 'all';
  search?: string;
}

/**
 * Check if exam is marked or considered completed
 */
export function isExamCompleted(exam: Exam, referenceDate: Date = new Date()): boolean {
  if (exam.status === 'completed') return true;
  if (exam.actualScore !== undefined && exam.actualScore !== null) return true;
  try {
    const examDate = parseISO(exam.examDate);
    if (isNaN(examDate.getTime())) return false;
    // An exam that ended more than 24 hours ago without special status is treated as past/completed
    return isPast(examDate) && differenceInHours(referenceDate, examDate) > 24;
  } catch {
    return false;
  }
}

/**
 * Compute countdown statistics for an exam date
 */
export function getExamCountdown(
  examDateString: string,
  referenceDate: Date = new Date()
): ExamCountdownInfo {
  try {
    const date = parseISO(examDateString);
    if (isNaN(date.getTime())) {
      return {
        daysLeft: 0,
        hoursLeft: 0,
        isToday: false,
        isTomorrow: false,
        isPast: false,
        label: examDateString,
        badgeVariant: 'slate',
      };
    }

    const diffHours = differenceInHours(date, referenceDate);
    const diffDays = differenceInDays(date, referenceDate);
    const today = isToday(date);
    const tomorrow = isTomorrow(date);
    const past = isPast(date) && !today;

    if (past) {
      return {
        daysLeft: diffDays,
        hoursLeft: diffHours,
        isToday: false,
        isTomorrow: false,
        isPast: true,
        label: 'Exam Concluded',
        badgeVariant: 'slate',
      };
    }

    if (today) {
      return {
        daysLeft: 0,
        hoursLeft: Math.max(0, diffHours),
        isToday: true,
        isTomorrow: false,
        isPast: false,
        label: diffHours > 0 ? `Today (${diffHours}h left)` : 'Exam Today!',
        badgeVariant: 'rose',
      };
    }

    if (tomorrow) {
      return {
        daysLeft: 1,
        hoursLeft: diffHours,
        isToday: false,
        isTomorrow: true,
        isPast: false,
        label: 'Tomorrow',
        badgeVariant: 'rose',
      };
    }

    if (diffDays <= 3) {
      return {
        daysLeft: diffDays,
        hoursLeft: diffHours,
        isToday: false,
        isTomorrow: false,
        isPast: false,
        label: `${diffDays} Days Left`,
        badgeVariant: 'amber',
      };
    }

    return {
      daysLeft: diffDays,
      hoursLeft: diffHours,
      isToday: false,
      isTomorrow: false,
      isPast: false,
      label: `${diffDays} Days Remaining`,
      badgeVariant: 'emerald',
    };
  } catch {
    return {
      daysLeft: 0,
      hoursLeft: 0,
      isToday: false,
      isTomorrow: false,
      isPast: false,
      label: examDateString,
      badgeVariant: 'slate',
    };
  }
}

/**
 * Calculate topic revision progress for an exam
 */
export function calculateTopicProgress(
  topics: string[],
  completedKeys: Record<string, boolean>,
  examKeyPrefix: string
): { total: number; completed: number; percentage: number } {
  const total = topics.length;
  if (total === 0) {
    return { total: 0, completed: 0, percentage: 100 };
  }

  let completed = 0;
  topics.forEach((_, idx) => {
    if (completedKeys[`${examKeyPrefix}-${idx}`]) {
      completed++;
    }
  });

  const percentage = Math.round((completed / total) * 100);
  return { total, completed, percentage };
}

/**
 * Calculate aggregate overview statistics across all exams
 */
export function calculateExamOverviewStats(
  exams: Exam[],
  completedKeys: Record<string, boolean> = {},
  courses: Course[] = [],
  referenceDate: Date = new Date()
): ExamOverviewStats {
  const totalExams = exams.length;
  if (totalExams === 0) {
    return {
      totalExams: 0,
      upcomingCount: 0,
      completedCount: 0,
      nearestExamDays: null,
      overallReadinessPercentage: 0,
      totalExamWeight: 0,
    };
  }

  let completedCount = 0;
  let upcomingCount = 0;
  let nearestExamDays: number | null = null;
  let totalWeight = 0;
  let totalTopics = 0;
  let finishedTopics = 0;

  const courseMap = new Map(courses.map((c) => [c.id, c]));

  for (const exam of exams) {
    const isComp = isExamCompleted(exam, referenceDate);
    const weight = exam.weight || 0;
    totalWeight += weight;

    if (isComp) {
      completedCount++;
    } else {
      upcomingCount++;
      const countdown = getExamCountdown(exam.examDate, referenceDate);
      if (!countdown.isPast) {
        if (nearestExamDays === null || countdown.daysLeft < nearestExamDays) {
          nearestExamDays = Math.max(0, countdown.daysLeft);
        }
      }
    }

    const course = courseMap.get(exam.courseId);
    const prefix = course?.code || exam.id;
    const progress = calculateTopicProgress(exam.topics, completedKeys, prefix);
    totalTopics += progress.total;
    finishedTopics += progress.completed;
  }

  const overallReadinessPercentage =
    totalTopics > 0 ? Math.round((finishedTopics / totalTopics) * 100) : 100;

  return {
    totalExams,
    upcomingCount,
    completedCount,
    nearestExamDays,
    overallReadinessPercentage,
    totalExamWeight: totalWeight,
  };
}

/**
 * Filter and sort exam items
 */
export function filterAndSortExams(
  exams: Exam[],
  criteria: ExamFilterCriteria,
  sortOption: ExamSortOption = 'examDate_asc',
  courses: Course[] = [],
  referenceDate: Date = new Date()
): Exam[] {
  const { courseId = 'all', type = 'all', status = 'all', search = '' } = criteria;
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // 1. Filter
  const filtered = exams.filter((exam) => {
    if (courseId !== 'all' && exam.courseId !== courseId) {
      return false;
    }

    if (type !== 'all' && exam.examType !== type) {
      return false;
    }

    if (status !== 'all') {
      const isComp = isExamCompleted(exam, referenceDate);
      if (status === 'completed' && !isComp) return false;
      if (status === 'upcoming' && isComp) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const course = courseMap.get(exam.courseId);
      const titleMatch = exam.title.toLowerCase().includes(q);
      const locMatch = exam.location.toLowerCase().includes(q);
      const courseMatch = course
        ? course.code.toLowerCase().includes(q) || course.name.toLowerCase().includes(q)
        : false;
      const topicMatch = exam.topics.some((t) => t.toLowerCase().includes(q));

      if (!titleMatch && !locMatch && !courseMatch && !topicMatch) {
        return false;
      }
    }

    return true;
  });

  // 2. Sort
  return [...filtered].sort((a, b) => {
    switch (sortOption) {
      case 'examDate_asc':
        return a.examDate.localeCompare(b.examDate);
      case 'examDate_desc':
        return b.examDate.localeCompare(a.examDate);
      case 'weight_desc':
        return (b.weight || 0) - (a.weight || 0);
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'title_desc':
        return b.title.localeCompare(a.title);
      default:
        return a.examDate.localeCompare(b.examDate);
    }
  });
}

/**
 * Group exams by calendar date string "YYYY-MM-DD"
 */
export function groupExamsByDate(exams: Exam[]): Record<string, Exam[]> {
  const groups: Record<string, Exam[]> = {};
  for (const item of exams) {
    const key = item.examDate.slice(0, 10);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }
  return groups;
}

/**
 * Format ISO datetime for iCalendar RFC 5545
 */
function formatIcsDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  } catch {
    return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }
}

/**
 * Generate iCalendar (.ics) export payload for exams
 */
export function generateExamsIcs(exams: Exam[], courses: Course[]): string {
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniHub//Student Productivity Suite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:UniHub Exam Schedule',
  ];

  for (const exam of exams) {
    const course = courseMap.get(exam.courseId);
    const summary = course ? `[EXAM] ${course.code} - ${exam.title}` : `[EXAM] ${exam.title}`;
    const startStr = formatIcsDateTime(exam.examDate);
    const startDate = new Date(exam.examDate);
    const endDate = new Date(startDate.getTime() + (exam.durationMinutes || 90) * 60000);
    const endStr = formatIcsDateTime(endDate.toISOString());

    const description = `Exam Type: ${exam.examType.toUpperCase()}\\nLocation: ${exam.location}\\nSeat: ${exam.seatNumber || 'N/A'}\\nWeight: ${exam.weight || 0}%\\nTopics: ${exam.topics.join(', ')}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:unihub-exam-${exam.id}@unihub.local`,
      `DTSTAMP:${formatIcsDateTime(new Date().toISOString())}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${summary}`,
      `LOCATION:${exam.location}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ==========================================
// Selectors for Dashboard & Cross-module Use
// ==========================================

export interface DashboardUpcomingExam {
  id: string;
  courseId: string;
  courseCode?: string;
  courseName?: string;
  courseColor?: string;
  title: string;
  examType: ExamType;
  examDate: string;
  durationMinutes: number;
  location: string;
  seatNumber?: string;
  weight?: number;
  daysRemaining: number;
  countdownLabel: string;
  badgeVariant: 'amber' | 'rose' | 'emerald' | 'slate';
  isToday: boolean;
}

export function selectUpcomingExams(
  exams: Exam[],
  courses: Course[],
  limit = 3,
  referenceDate: Date = new Date()
): DashboardUpcomingExam[] {
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // Filter exams that are not completed
  const upcoming = exams.filter((e) => !isExamCompleted(e, referenceDate));

  // Sort chronologically
  const sorted = [...upcoming].sort((a, b) => a.examDate.localeCompare(b.examDate));

  return sorted.slice(0, limit).map((e) => {
    const course = courseMap.get(e.courseId);
    const countdown = getExamCountdown(e.examDate, referenceDate);
    return {
      id: e.id,
      courseId: e.courseId,
      courseCode: course?.code,
      courseName: course?.name,
      courseColor: course?.color,
      title: e.title,
      examType: e.examType,
      examDate: e.examDate,
      durationMinutes: e.durationMinutes,
      location: e.location,
      seatNumber: e.seatNumber,
      weight: e.weight,
      daysRemaining: countdown.daysLeft,
      countdownLabel: countdown.label,
      badgeVariant: countdown.badgeVariant,
      isToday: countdown.isToday,
    };
  });
}

export function selectNextExam(
  exams: Exam[],
  courses: Course[],
  referenceDate: Date = new Date()
): DashboardUpcomingExam | null {
  const upcoming = selectUpcomingExams(exams, courses, 1, referenceDate);
  return upcoming.length > 0 ? upcoming[0] : null;
}
