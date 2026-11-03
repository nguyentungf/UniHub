import type { Course, CourseLesson, AttendanceRecord } from '@/types';

export interface LessonProgressResult {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
}

export interface AttendanceStatsResult {
  totalSessions: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendanceRate: number; // 0 - 100
  isAtRisk: boolean;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  statusLabel: string;
}

/**
 * Calculates completed lesson progress metrics for a given course.
 */
export function calculateLessonProgress(course: Course): LessonProgressResult {
  const lessons = course.lessons || [];
  const lessonsCompletedCount = lessons.filter((l) => l.isCompleted).length;

  const total = Math.max(
    course.totalLessons ?? 0,
    lessons.length,
    course.completedLessons ?? 0,
    1
  );

  const completed = Math.min(
    total,
    course.completedLessons !== undefined && course.completedLessons > lessonsCompletedCount
      ? course.completedLessons
      : lessonsCompletedCount
  );

  const remaining = Math.max(0, total - completed);
  const percentage = Math.min(100, Math.max(0, Math.round((completed / total) * 100)));

  return {
    total,
    completed,
    remaining,
    percentage,
  };
}

/**
 * Calculates manual attendance statistics and eligibility standing for a course.
 * Uses standard academic weighting: Present = 1.0, Late = 0.5, Excused is deducted from total.
 * Minimum threshold for university exam eligibility is typically 80%.
 */
export function calculateAttendanceStats(course: Course): AttendanceStatsResult {
  const records = course.attendanceRecords || [];
  let present = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;

  for (const r of records) {
    if (r.status === 'present') present++;
    else if (r.status === 'late') late++;
    else if (r.status === 'absent') absent++;
    else if (r.status === 'excused') excused++;
  }

  const totalSessions = records.length;
  const eligibleSessions = totalSessions - excused;

  let attendanceRate = 100;
  if (eligibleSessions > 0) {
    const weighted = present + late * 0.5;
    attendanceRate = Math.min(100, Math.max(0, Math.round((weighted / eligibleSessions) * 100)));
  }

  const isAtRisk = attendanceRate < 80 && eligibleSessions >= 3;

  let status: AttendanceStatsResult['status'] = 'excellent';
  let statusLabel = 'Excellent (≥90%)';

  if (attendanceRate < 75) {
    status = 'critical';
    statusLabel = 'Critical (<75%)';
  } else if (attendanceRate < 80) {
    status = 'warning';
    statusLabel = 'At Risk (<80%)';
  } else if (attendanceRate < 90) {
    status = 'good';
    statusLabel = 'Good Standing (80-89%)';
  }

  return {
    totalSessions,
    present,
    late,
    absent,
    excused,
    attendanceRate,
    isAtRisk,
    status,
    statusLabel,
  };
}

/**
 * Computes an overall course health summary score between 0 and 100.
 */
export function calculateCourseHealth(course: Course): {
  healthScore: number;
  label: string;
  badgeVariant: 'emerald' | 'amber' | 'rose' | 'brand';
} {
  const lessonProgress = calculateLessonProgress(course);
  const attendance = calculateAttendanceStats(course);

  // Health is a blend of attendance standing (50%) and lesson progress (50%)
  const healthScore = Math.round(attendance.attendanceRate * 0.5 + lessonProgress.percentage * 0.5);

  if (attendance.isAtRisk) {
    return {
      healthScore,
      label: 'Attendance Warning',
      badgeVariant: 'rose',
    };
  }

  if (healthScore >= 80) {
    return {
      healthScore,
      label: 'On Track',
      badgeVariant: 'emerald',
    };
  }

  if (healthScore >= 50) {
    return {
      healthScore,
      label: 'In Progress',
      badgeVariant: 'amber',
    };
  }

  return {
    healthScore,
    label: 'Needs Attention',
    badgeVariant: 'rose',
  };
}

/**
 * Parses study week expressions like "2-19" or "2-9, 11-18" or "2-9; 11-18" or "1, 3, 5-10"
 * Returns array of sorted unique week numbers.
 */
export function parseStudyWeeks(input: string): number[] {
  if (!input || !input.trim()) return [];
  const weeks = new Set<number>();
  const tokens = input.split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean);

  for (const token of tokens) {
    if (token.includes('-')) {
      const parts = token.split('-');
      if (parts.length === 2) {
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
          for (let w = start; w <= end; w++) {
            weeks.add(w);
          }
        }
      }
    } else {
      const num = parseInt(token, 10);
      if (!isNaN(num) && num > 0) {
        weeks.add(num);
      }
    }
  }

  return Array.from(weeks).sort((a, b) => a - b);
}

/**
 * Returns a human-friendly summary of the parsed study weeks.
 */
export function formatStudyWeeksSummary(input: string): string {
  const weeks = parseStudyWeeks(input);
  if (weeks.length === 0) return '';
  return `${weeks.length} buổi học`;
}
