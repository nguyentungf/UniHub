import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date for human display (e.g. "Nov 15, 2026")
 */
export function formatDate(dateString: string): string {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

/**
 * Format date with time (e.g. "Nov 15, 2026 · 14:00")
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy · HH:mm');
  } catch {
    return dateString;
  }
}

/**
 * Smart relative deadline label (e.g., "Today", "Tomorrow", "In 3 days", "Overdue by 2 days")
 */
export function formatDeadlineRelative(dateString: string): { label: string; isOverdue: boolean } {
  try {
    const date = parseISO(dateString);
    const now = new Date();

    if (isToday(date)) {
      return { label: `Today, ${format(date, 'HH:mm')}`, isOverdue: false };
    }
    if (isTomorrow(date)) {
      return { label: `Tomorrow, ${format(date, 'HH:mm')}`, isOverdue: false };
    }
    if (isPast(date) && !isToday(date)) {
      return { label: `${formatDistanceToNow(date)} ago`, isOverdue: true };
    }
    return { label: `In ${formatDistanceToNow(date)}`, isOverdue: false };
  } catch {
    return { label: dateString, isOverdue: false };
  }
}

/**
 * Format minutes into "2h 30m" or "45m"
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Grade point to Letter grade mapper for 4.0 scale
 */
export function gradePointToLetter(grade: number): string {
  if (grade >= 3.85) return 'A';
  if (grade >= 3.7) return 'A-';
  if (grade >= 3.3) return 'B+';
  if (grade >= 3.0) return 'B';
  if (grade >= 2.7) return 'B-';
  if (grade >= 2.3) return 'C+';
  if (grade >= 2.0) return 'C';
  if (grade >= 1.0) return 'D';
  return 'F';
}
