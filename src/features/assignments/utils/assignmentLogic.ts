import type { Assignment, Course, PriorityLevel, AssignmentStatus } from '@/types';
import { parseISO, format, differenceInCalendarDays, isSameDay, formatDistance } from 'date-fns';

export interface AssignmentProgressStats {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionPercentage: number;
  totalWeight: number;
  completedWeight: number;
}

export type AssignmentSortOption =
  | 'dueDate_asc'
  | 'dueDate_desc'
  | 'priority_desc'
  | 'priority_asc'
  | 'title_asc'
  | 'title_desc';

export interface AssignmentFilterCriteria {
  courseId?: string | 'all';
  priority?: string | 'all';
  status?: string | 'all';
  search?: string;
}

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Check if a status represents completion
 */
export function isAssignmentCompleted(status: AssignmentStatus): boolean {
  return status === 'completed' || status === 'submitted' || status === 'graded';
}

/**
 * Check if an assignment is overdue relative to a given date (defaults to now)
 */
export function isAssignmentOverdue(assignment: Assignment, referenceDate: Date = new Date()): boolean {
  if (isAssignmentCompleted(assignment.status)) {
    return false;
  }
  try {
    const dueDate = parseISO(assignment.dueDate);
    if (isNaN(dueDate.getTime())) return false;
    return dueDate.getTime() < referenceDate.getTime() && !isSameDay(dueDate, referenceDate);
  } catch {
    return false;
  }
}

/**
 * Compute smart deadline information with overdue indicator
 */
export function getAssignmentDeadlineInfo(
  dueDateString: string,
  status: AssignmentStatus,
  referenceDate: Date = new Date()
): { label: string; isOverdue: boolean; daysRemaining: number } {
  try {
    const date = parseISO(dueDateString);
    if (isNaN(date.getTime())) {
      return { label: dueDateString, isOverdue: false, daysRemaining: 0 };
    }

    const completed = isAssignmentCompleted(status);
    const calDaysDiff = differenceInCalendarDays(date, referenceDate);
    const diffTime = date.getTime() - referenceDate.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (completed) {
      return {
        label: `Completed (${format(date, 'MMM d')})`,
        isOverdue: false,
        daysRemaining,
      };
    }

    if (isSameDay(date, referenceDate)) {
      return { label: `Today at ${format(date, 'HH:mm')}`, isOverdue: false, daysRemaining: 0 };
    }

    if (calDaysDiff === 1) {
      return { label: `Tomorrow at ${format(date, 'HH:mm')}`, isOverdue: false, daysRemaining: 1 };
    }

    if (date.getTime() < referenceDate.getTime()) {
      return {
        label: `Overdue by ${formatDistance(date, referenceDate)}`,
        isOverdue: true,
        daysRemaining,
      };
    }

    return {
      label: `Due in ${formatDistance(date, referenceDate)}`,
      isOverdue: false,
      daysRemaining,
    };
  } catch {
    return { label: dueDateString, isOverdue: false, daysRemaining: 0 };
  }
}

/**
 * Calculate full assignment progress metrics
 */
export function calculateAssignmentProgress(
  assignments: Assignment[],
  referenceDate: Date = new Date()
): AssignmentProgressStats {
  const total = assignments.length;
  if (total === 0) {
    return {
      total: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      completionPercentage: 0,
      totalWeight: 0,
      completedWeight: 0,
    };
  }

  let notStarted = 0;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;
  let totalWeight = 0;
  let completedWeight = 0;

  for (const item of assignments) {
    const weight = item.weight || 0;
    totalWeight += weight;

    if (isAssignmentCompleted(item.status)) {
      completed++;
      completedWeight += weight;
    } else {
      if (item.status === 'in_progress') {
        inProgress++;
      } else {
        notStarted++;
      }

      if (isAssignmentOverdue(item, referenceDate)) {
        overdue++;
      }
    }
  }

  const completionPercentage = Math.round((completed / total) * 100);

  return {
    total,
    notStarted,
    inProgress,
    completed,
    overdue,
    completionPercentage,
    totalWeight,
    completedWeight,
  };
}

/**
 * Filter and sort assignment list
 */
export function filterAndSortAssignments(
  assignments: Assignment[],
  criteria: AssignmentFilterCriteria,
  sortOption: AssignmentSortOption = 'dueDate_asc',
  courses: Course[] = []
): Assignment[] {
  const { courseId = 'all', priority = 'all', status = 'all', search = '' } = criteria;
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // 1. Filtering
  const filtered = assignments.filter((a) => {
    // Course match
    if (courseId !== 'all' && a.courseId !== courseId) {
      return false;
    }

    // Priority match
    if (priority !== 'all' && a.priority !== priority) {
      return false;
    }

    // Status match
    if (status !== 'all') {
      if (status === 'not_started' || status === 'todo') {
        if (a.status !== 'todo') return false;
      } else if (status === 'in_progress') {
        if (a.status !== 'in_progress') return false;
      } else if (status === 'completed') {
        if (!isAssignmentCompleted(a.status)) return false;
      } else if (a.status !== status) {
        return false;
      }
    }

    // Keyword search match
    if (search.trim()) {
      const q = search.toLowerCase();
      const course = courseMap.get(a.courseId);
      const titleMatch = a.title.toLowerCase().includes(q);
      const descMatch = (a.description || '').toLowerCase().includes(q);
      const courseMatch = course
        ? course.code.toLowerCase().includes(q) || course.name.toLowerCase().includes(q)
        : false;

      if (!titleMatch && !descMatch && !courseMatch) {
        return false;
      }
    }

    return true;
  });

  // 2. Sorting
  return [...filtered].sort((a, b) => {
    switch (sortOption) {
      case 'dueDate_asc':
        return a.dueDate.localeCompare(b.dueDate);
      case 'dueDate_desc':
        return b.dueDate.localeCompare(a.dueDate);
      case 'priority_desc':
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      case 'priority_asc':
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'title_desc':
        return b.title.localeCompare(a.title);
      default:
        return a.dueDate.localeCompare(b.dueDate);
    }
  });
}

/**
 * Group assignments by date string "YYYY-MM-DD" for calendar presentation
 */
export function groupAssignmentsByDate(assignments: Assignment[]): Record<string, Assignment[]> {
  const groups: Record<string, Assignment[]> = {};

  for (const item of assignments) {
    const dateKey = item.dueDate.slice(0, 10);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  }

  return groups;
}

/**
 * Format date to iCalendar UTC timestamp: YYYYMMDDTHHmmssZ
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
 * Generate iCalendar (.ics) string for assignments
 */
export function generateAssignmentsIcs(assignments: Assignment[], courses: Course[]): string {
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniHub//Student Productivity Suite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:UniHub Assignments',
  ];

  for (const a of assignments) {
    const course = courseMap.get(a.courseId);
    const summary = course ? `[${course.code}] ${a.title}` : a.title;
    const startStr = formatIcsDateTime(a.dueDate);
    const desc = (a.description || '').replace(/\n/g, '\\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:unihub-asg-${a.id}@unihub.local`,
      `DTSTAMP:${formatIcsDateTime(new Date().toISOString())}`,
      `DTSTART:${startStr}`,
      `DTEND:${startStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc} Priority: ${a.priority.toUpperCase()}`,
      `STATUS:${isAssignmentCompleted(a.status) ? 'COMPLETED' : 'CONFIRMED'}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger file download in browser
 */
export function downloadFile(filename: string, content: string, mimeType = 'text/calendar;charset=utf-8'): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// Selectors for Dashboard & Cross-module Use
// ==========================================

export interface DashboardUpcomingDeadline {
  id: string;
  courseId: string;
  courseCode?: string;
  courseColor?: string;
  title: string;
  dueDate: string;
  priority: PriorityLevel;
  status: AssignmentStatus;
  weight?: number;
  relativeLabel: string;
  isOverdue: boolean;
}

export function selectUpcomingDeadlines(
  assignments: Assignment[],
  courses: Course[],
  limit = 5,
  referenceDate: Date = new Date()
): DashboardUpcomingDeadline[] {
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // Filter out completed assignments
  const pending = assignments.filter((a) => !isAssignmentCompleted(a.status));

  // Sort by due date ascending
  const sorted = [...pending].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return sorted.slice(0, limit).map((a) => {
    const course = courseMap.get(a.courseId);
    const info = getAssignmentDeadlineInfo(a.dueDate, a.status, referenceDate);
    return {
      id: a.id,
      courseId: a.courseId,
      courseCode: course?.code,
      courseColor: course?.color,
      title: a.title,
      dueDate: a.dueDate,
      priority: a.priority,
      status: a.status,
      weight: a.weight,
      relativeLabel: info.label,
      isOverdue: info.isOverdue,
    };
  });
}

export function selectOverdueAssignments(
  assignments: Assignment[],
  referenceDate: Date = new Date()
): Assignment[] {
  return assignments.filter((a) => isAssignmentOverdue(a, referenceDate));
}
