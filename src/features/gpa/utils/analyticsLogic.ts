import type {
  Course,
  StudySession,
  Assignment,
  Exam,
} from '../../../types/index.ts';

export interface CreditAnalytics {
  totalEarnedCredits: number;
  totalEnrolledCredits: number;
  totalAttemptedCredits: number;
  degreeTargetCredits: number;
  completionRate: number; // 0 - 100%
  creditsRemaining: number;
}

export interface GradeDistributionItem {
  letter: string;
  count: number;
  percentage: number; // 0 - 100%
}

export interface CourseCompletionStats {
  totalCourses: number;
  completedCourses: number;
  enrolledCourses: number;
  droppedCourses: number;
  completionRate: number; // 0 - 100%
  gradeDistribution: GradeDistributionItem[];
}

export interface CourseStudyTimeItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  color: string;
  minutes: number;
  hours: number;
  percentage: number;
}

export interface DailyStudyTrendItem {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  hours: number;
}

export interface StudyTimeAnalytics {
  totalMinutes: number;
  totalHours: number;
  totalSessions: number;
  averageSessionMinutes: number;
  averageFocusRating: number;
  studyTimeByCourse: CourseStudyTimeItem[];
  dailyTrend: DailyStudyTrendItem[];
}

export interface AssignmentAnalytics {
  total: number;
  completedCount: number;
  pendingCount: number;
  completionRate: number; // 0 - 100%
  gradedCount: number;
  averageScore: number | null; // 0 - 100
  urgentCount: number;
  highCount: number;
}

export interface PeriodSummaryItem {
  periodLabel: string; // "This Week" or "This Month"
  studyHours: number;
  assignmentsCompleted: number;
  examsHandled: number;
  momentumScore: number; // 0 - 100 composite indicator
  summaryHighlight: string;
}

export interface AcademicSummaries {
  weekly: PeriodSummaryItem;
  monthly: PeriodSummaryItem;
}

/**
 * Calculates credit completion stats against degree target.
 */
export function calculateCreditAnalytics(
  courses: Course[],
  degreeTargetCredits: number = 120
): CreditAnalytics {
  let totalEarnedCredits = 0;
  let totalEnrolledCredits = 0;

  for (const c of courses) {
    if (c.status === 'completed') {
      const isPassing = c.actualGrade === undefined || c.actualGrade > 0;
      if (isPassing) {
        totalEarnedCredits += c.credits;
      }
    } else if (c.status === 'enrolled') {
      totalEnrolledCredits += c.credits;
    }
  }

  const totalAttemptedCredits = totalEarnedCredits + totalEnrolledCredits;
  const completionRate =
    degreeTargetCredits > 0
      ? parseFloat(
          Math.min(100, (totalEarnedCredits / degreeTargetCredits) * 100).toFixed(1)
        )
      : 0;

  const creditsRemaining = Math.max(0, degreeTargetCredits - totalEarnedCredits);

  return {
    totalEarnedCredits,
    totalEnrolledCredits,
    totalAttemptedCredits,
    degreeTargetCredits,
    completionRate,
    creditsRemaining,
  };
}

/**
 * Calculates course completion rates and grade distribution breakdown.
 */
export function calculateCourseCompletionStats(courses: Course[]): CourseCompletionStats {
  const totalCourses = courses.length;
  let completedCourses = 0;
  let enrolledCourses = 0;
  let droppedCourses = 0;

  const letterCounts: Record<string, number> = {
    A: 0,
    'A-': 0,
    'B+': 0,
    B: 0,
    'B-': 0,
    'C+': 0,
    C: 0,
    D: 0,
    F: 0,
  };

  let gradedTotal = 0;

  for (const c of courses) {
    if (c.status === 'completed') {
      completedCourses++;
      const letter = c.letterGrade?.trim().toUpperCase();
      if (letter) {
        if (letterCounts[letter] !== undefined) {
          letterCounts[letter]++;
        } else if (letter === 'A+') {
          letterCounts['A']++;
        } else if (letter === 'C-') {
          letterCounts['C']++;
        } else if (letter === 'D+') {
          letterCounts['D']++;
        } else {
          letterCounts['B']++;
        }
        gradedTotal++;
      } else if (c.actualGrade !== undefined) {
        // Derive approximate letter if letterGrade not set directly
        if (c.actualGrade >= 3.85) letterCounts['A']++;
        else if (c.actualGrade >= 3.5) letterCounts['A-']++;
        else if (c.actualGrade >= 3.15) letterCounts['B+']++;
        else if (c.actualGrade >= 2.85) letterCounts['B']++;
        else if (c.actualGrade >= 2.5) letterCounts['B-']++;
        else if (c.actualGrade >= 2.15) letterCounts['C+']++;
        else if (c.actualGrade >= 1.85) letterCounts['C']++;
        else if (c.actualGrade >= 1.0) letterCounts['D']++;
        else letterCounts['F']++;
        gradedTotal++;
      }
    } else if (c.status === 'enrolled') {
      enrolledCourses++;
    } else if (c.status === 'dropped') {
      droppedCourses++;
    }
  }

  const completionRate =
    totalCourses > 0
      ? parseFloat(((completedCourses / totalCourses) * 100).toFixed(1))
      : 0;

  const gradeDistribution: GradeDistributionItem[] = Object.entries(letterCounts).map(
    ([letter, count]) => ({
      letter,
      count,
      percentage:
        gradedTotal > 0 ? parseFloat(((count / gradedTotal) * 100).toFixed(1)) : 0,
    })
  );

  return {
    totalCourses,
    completedCourses,
    enrolledCourses,
    droppedCourses,
    completionRate,
    gradeDistribution,
  };
}

/**
 * Calculates study time distribution by course and daily trends.
 */
export function calculateStudyTimeAnalytics(
  sessions: StudySession[],
  courses: Course[],
  referenceDate: Date = new Date()
): StudyTimeAnalytics {
  const courseMap = new Map<string, Course>();
  courses.forEach((c) => courseMap.set(c.id, c));

  let totalMinutes = 0;
  let focusSum = 0;

  const minutesByCourse = new Map<string, number>();

  for (const s of sessions) {
    totalMinutes += s.durationMinutes;
    focusSum += s.focusRating;

    const cid = s.courseId || 'general';
    minutesByCourse.set(cid, (minutesByCourse.get(cid) || 0) + s.durationMinutes);
  }

  const totalHours = parseFloat((totalMinutes / 60).toFixed(1));
  const totalSessions = sessions.length;
  const averageSessionMinutes =
    totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
  const averageFocusRating =
    totalSessions > 0 ? parseFloat((focusSum / totalSessions).toFixed(1)) : 0;

  const studyTimeByCourse: CourseStudyTimeItem[] = [];

  for (const [cid, mins] of minutesByCourse.entries()) {
    const course = courseMap.get(cid);
    const hrs = parseFloat((mins / 60).toFixed(1));
    studyTimeByCourse.push({
      courseId: cid,
      courseCode: course ? course.code : 'GEN',
      courseName: course ? course.name : 'General Study & Research',
      color: course ? course.color : '#64748B',
      minutes: mins,
      hours: hrs,
      percentage: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0,
    });
  }

  // Sort by hours descending
  studyTimeByCourse.sort((a, b) => b.minutes - a.minutes);

  // Daily trend for the past 7 days up to referenceDate
  const dailyTrend: DailyStudyTrendItem[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);

    // Unify both dateStr and dayLabel in the EXACT SAME local timezone
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayLabel = dayNames[d.getDay()];

    const minsOnDay = sessions
      .filter((s) => {
        try {
          const sDate = new Date(s.startTime);
          if (isNaN(sDate.getTime())) return false;
          const sYear = sDate.getFullYear();
          const sMonth = String(sDate.getMonth() + 1).padStart(2, '0');
          const sDay = String(sDate.getDate()).padStart(2, '0');
          return `${sYear}-${sMonth}-${sDay}` === dateStr;
        } catch {
          return false;
        }
      })
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    dailyTrend.push({
      date: dateStr,
      dayLabel,
      hours: parseFloat((minsOnDay / 60).toFixed(1)),
    });
  }

  return {
    totalMinutes,
    totalHours,
    totalSessions,
    averageSessionMinutes,
    averageFocusRating,
    studyTimeByCourse,
    dailyTrend,
  };
}

/**
 * Calculates assignment performance and completion rates.
 */
export function calculateAssignmentAnalytics(
  assignments: Assignment[]
): AssignmentAnalytics {
  const total = assignments.length;
  let completedCount = 0;
  let pendingCount = 0;
  let gradedCount = 0;
  let earnedScoreSum = 0;
  let urgentCount = 0;
  let highCount = 0;

  for (const a of assignments) {
    if (a.status === 'completed' || a.status === 'submitted' || a.status === 'graded') {
      completedCount++;
    } else {
      pendingCount++;
    }

    if (a.priority === 'urgent') urgentCount++;
    if (a.priority === 'high') highCount++;

    if (typeof a.earnedScore === 'number' && !isNaN(a.earnedScore)) {
      gradedCount++;
      earnedScoreSum += a.earnedScore;
    }
  }

  const completionRate =
    total > 0 ? parseFloat(((completedCount / total) * 100).toFixed(1)) : 0;
  const averageScore =
    gradedCount > 0 ? parseFloat((earnedScoreSum / gradedCount).toFixed(1)) : null;

  return {
    total,
    completedCount,
    pendingCount,
    completionRate,
    gradedCount,
    averageScore,
    urgentCount,
    highCount,
  };
}

/**
 * Generates Weekly and Monthly academic progress summaries.
 */
export function calculateAcademicPeriodSummaries(
  sessions: StudySession[],
  assignments: Assignment[],
  exams: Exam[],
  courses: Course[],
  referenceDate: Date = new Date()
): AcademicSummaries {
  const nowMs = referenceDate.getTime();
  const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

  // Weekly metrics: bound strictly between sevenDaysAgoMs and referenceDate (nowMs)
  const weekSessions = sessions.filter((s) => {
    const sessionTime = new Date(s.startTime).getTime();
    return sessionTime >= sevenDaysAgoMs && sessionTime <= nowMs;
  });
  const weekStudyMinutes = weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const weekStudyHours = parseFloat((weekStudyMinutes / 60).toFixed(1));

  const weekAssignments = assignments.filter((a) => {
    const isCompleted = a.status === 'completed' || a.status === 'submitted' || a.status === 'graded';
    const dueTime = new Date(a.dueDate).getTime();
    return isCompleted && dueTime >= sevenDaysAgoMs && dueTime <= nowMs;
  });

  const weekExams = exams.filter(
    (e) => Math.abs(new Date(e.examDate).getTime() - nowMs) <= 7 * 24 * 60 * 60 * 1000
  );

  // Weekly momentum score: 0-100 composite index
  // 15 hours study = 50 pts, 2 assignments = 30 pts, 1 exam = 20 pts
  const weekMomentum = Math.min(
    100,
    Math.round(
      Math.min(50, (weekStudyHours / 15) * 50) +
        Math.min(30, weekAssignments.length * 15) +
        Math.min(20, weekExams.length * 10)
    )
  );

  // Monthly metrics: bound strictly between thirtyDaysAgoMs and referenceDate (nowMs)
  const monthSessions = sessions.filter((s) => {
    const sessionTime = new Date(s.startTime).getTime();
    return sessionTime >= thirtyDaysAgoMs && sessionTime <= nowMs;
  });
  const monthStudyMinutes = monthSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const monthStudyHours = parseFloat((monthStudyMinutes / 60).toFixed(1));

  const monthAssignments = assignments.filter((a) => {
    const isCompleted = a.status === 'completed' || a.status === 'submitted' || a.status === 'graded';
    const dueTime = new Date(a.dueDate).getTime();
    return isCompleted && dueTime >= thirtyDaysAgoMs && dueTime <= nowMs;
  });

  const monthExams = exams.filter(
    (e) => Math.abs(new Date(e.examDate).getTime() - nowMs) <= 30 * 24 * 60 * 60 * 1000
  );

  const monthMomentum = Math.min(
    100,
    Math.round(
      Math.min(50, (monthStudyHours / 60) * 50) +
        Math.min(30, monthAssignments.length * 5) +
        Math.min(20, monthExams.length * 10)
    )
  );

  return {
    weekly: {
      periodLabel: 'This Week',
      studyHours: weekStudyHours,
      assignmentsCompleted: weekAssignments.length,
      examsHandled: weekExams.length,
      momentumScore: weekMomentum,
      summaryHighlight:
        weekStudyHours > 0 || weekAssignments.length > 0
          ? `${weekStudyHours}h học tập tập trung với ${weekAssignments.length} bài tập đã hoàn thành`
          : 'Chưa có hoạt động học tập nào trong tuần này',
    },
    monthly: {
      periodLabel: 'This Month',
      studyHours: monthStudyHours,
      assignmentsCompleted: monthAssignments.length,
      examsHandled: monthExams.length,
      momentumScore: monthMomentum,
      summaryHighlight:
        monthStudyHours > 0 || monthAssignments.length > 0
          ? `Ghi nhận ${monthStudyHours}h học tập và ${monthAssignments.length} bài tập hoàn thành`
          : 'Chưa có hoạt động học tập nào trong 30 ngày qua',
    },
  };
}

