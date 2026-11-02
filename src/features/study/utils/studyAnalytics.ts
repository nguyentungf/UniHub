import { parseISO, isSameDay, subDays, startOfDay, endOfDay, format, isWithinInterval, differenceInCalendarDays } from 'date-fns';
import type { StudySession, Course } from '../../../types/index.ts';

export interface DailyStudyStats {
  date: string;
  totalMinutes: number;
  totalHours: number;
  sessionCount: number;
  averageFocusRating: number;
}

export interface WeeklyStudyStats {
  startDate: string;
  endDate: string;
  totalMinutes: number;
  totalHours: number;
  dailyAverageMinutes: number;
  completedSessions: number;
  targetMinutes: number;
  percentOfTarget: number;
}

export interface CourseFocusBreakdown {
  courseId: string;
  code: string;
  name: string;
  color: string;
  minutes: number;
  hours: number;
  percentage: number;
  sessionsCount: number;
}

export interface DailyFocusTrendItem {
  date: string;
  dayLabel: string;
  formattedDate: string;
  minutes: number;
  hours: number;
  sessionCount: number;
}

/**
 * Calculate study metrics for a single specific day
 */
export function calculateDailyStats(
  sessions: StudySession[],
  targetDate: Date | string = new Date()
): DailyStudyStats {
  const refDate = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  const targetDayStr = format(refDate, 'yyyy-MM-dd');

  const daysSessions = sessions.filter((s) => {
    try {
      const sessionDate = parseISO(s.startTime);
      return isSameDay(sessionDate, refDate);
    } catch {
      return false;
    }
  });

  const totalMinutes = daysSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const ratingSum = daysSessions.reduce((acc, curr) => acc + (curr.focusRating || 3), 0);
  const averageFocusRating = daysSessions.length > 0
    ? Math.round((ratingSum / daysSessions.length) * 10) / 10
    : 0;

  return {
    date: targetDayStr,
    totalMinutes,
    totalHours,
    sessionCount: daysSessions.length,
    averageFocusRating,
  };
}

/**
 * Calculate study metrics for a 7-day period ending on refDate
 */
export function calculateWeeklyStats(
  sessions: StudySession[],
  refDate: Date | string = new Date(),
  targetHoursWeekly = 20
): WeeklyStudyStats {
  const ref = typeof refDate === 'string' ? parseISO(refDate) : refDate;
  const end = endOfDay(ref);
  const start = startOfDay(subDays(ref, 6));

  const weekSessions = sessions.filter((s) => {
    try {
      const sessionDate = parseISO(s.startTime);
      return isWithinInterval(sessionDate, { start, end });
    } catch {
      return false;
    }
  });

  const totalMinutes = weekSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const dailyAverageMinutes = Math.round(totalMinutes / 7);
  const targetMinutes = targetHoursWeekly * 60;
  const percentOfTarget = targetMinutes > 0
    ? Math.min(200, Math.round((totalMinutes / targetMinutes) * 100))
    : 100;

  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    totalMinutes,
    totalHours,
    dailyAverageMinutes,
    completedSessions: weekSessions.length,
    targetMinutes,
    percentOfTarget,
  };
}

/**
 * Calculate study streak: consecutive days with at least 1 study session
 */
export function calculateStudyStreak(
  sessions: StudySession[],
  refDate: Date | string = new Date()
): number {
  if (sessions.length === 0) return 0;

  const today = startOfDay(typeof refDate === 'string' ? parseISO(refDate) : refDate);

  // Collect unique study days formatted as yyyy-MM-dd sorted descending
  const uniqueDays = new Set<string>();
  for (const s of sessions) {
    try {
      const d = parseISO(s.startTime);
      uniqueDays.add(format(d, 'yyyy-MM-dd'));
    } catch {
      // Ignore unparseable dates
    }
  }

  const sortedDays = Array.from(uniqueDays).sort((a, b) => b.localeCompare(a));
  if (sortedDays.length === 0) return 0;

  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  // If there are no sessions today and no sessions yesterday, streak is broken
  const hasStudiedToday = sortedDays.includes(todayStr);
  const hasStudiedYesterday = sortedDays.includes(yesterdayStr);

  if (!hasStudiedToday && !hasStudiedYesterday) {
    return 0;
  }

  let streak = 0;
  let checkDate = hasStudiedToday ? today : subDays(today, 1);

  while (true) {
    const checkStr = format(checkDate, 'yyyy-MM-dd');
    if (uniqueDays.has(checkStr)) {
      streak += 1;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate focus distribution breakdown grouped by Course
 */
export function calculateCourseFocusBreakdown(
  sessions: StudySession[],
  courses: Course[]
): CourseFocusBreakdown[] {
  const courseMap = new Map<string, Course>();
  for (const c of courses) {
    courseMap.set(c.id, c);
  }

  const aggregated = new Map<string, { minutes: number; sessionsCount: number }>();

  let totalMinutes = 0;

  for (const s of sessions) {
    const courseId = s.courseId || 'general';
    const minutes = s.durationMinutes || 0;
    totalMinutes += minutes;

    const existing = aggregated.get(courseId) || { minutes: 0, sessionsCount: 0 };
    existing.minutes += minutes;
    existing.sessionsCount += 1;
    aggregated.set(courseId, existing);
  }

  const result: CourseFocusBreakdown[] = [];

  for (const [courseId, stats] of aggregated.entries()) {
    const course = courseMap.get(courseId);
    const code = course ? course.code : 'General';
    const name = course ? course.name : 'General Focus & Revisions';
    const color = course ? course.color : '#64748B';
    const hours = Math.round((stats.minutes / 60) * 10) / 10;
    const percentage = totalMinutes > 0 ? Math.round((stats.minutes / totalMinutes) * 100) : 0;

    result.push({
      courseId,
      code,
      name,
      color,
      minutes: stats.minutes,
      hours,
      percentage,
      sessionsCount: stats.sessionsCount,
    });
  }

  return result.sort((a, b) => b.minutes - a.minutes);
}

/**
 * Generate daily focus progression for charts (e.g. 7 days or 14 days)
 */
export function calculateDailyFocusTrend(
  sessions: StudySession[],
  numDays = 7,
  refDate: Date | string = new Date()
): DailyFocusTrendItem[] {
  const end = typeof refDate === 'string' ? parseISO(refDate) : refDate;
  const items: DailyFocusTrendItem[] = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = subDays(end, i);
    const stats = calculateDailyStats(sessions, d);
    items.push({
      date: stats.date,
      dayLabel: format(d, 'EEE'),
      formattedDate: format(d, 'MMM d'),
      minutes: stats.totalMinutes,
      hours: stats.totalHours,
      sessionCount: stats.sessionCount,
    });
  }

  return items;
}
