import type {
  Course,
  Semester,
  GradeRecord,
  GradingScale,
  CourseGpaItem,
  SemesterGpaSummary,
  CumulativeGpaSummary,
  GpaHistoryPoint,
} from '../../../types/index.ts';
import { findTierForPercentage } from './gradingScales.ts';

/**
 * Normalizes a Course entity into a standardized GradeRecord.
 */
export function normalizeCourseToGradeRecord(
  course: Course,
  semesterName?: string
): GradeRecord {
  return {
    id: course.id,
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    semesterId: course.semesterId,
    semesterName: semesterName || 'Current Semester',
    credits: course.credits,
    gradePoint: course.actualGrade,
    letterGrade: course.letterGrade,
    percentageScore: course.percentageScore,
    status: course.status,
    color: course.color,
    notes: course.notes,
  };
}

/**
 * Calculates Quality Points for a given course.
 * Quality Points = Credits * Grade Point
 */
export function calculateQualityPoints(gradePoint: number, credits: number): number {
  if (isNaN(gradePoint) || isNaN(credits) || credits <= 0) return 0;
  return parseFloat((gradePoint * credits).toFixed(4));
}

/**
 * Determines whether a record has an active, valid recorded grade.
 */
export function isGradeRecordGraded(record: GradeRecord): boolean {
  if (record.status === 'dropped') return false;
  return (
    (typeof record.gradePoint === 'number' && !isNaN(record.gradePoint)) ||
    (typeof record.percentageScore === 'number' && !isNaN(record.percentageScore))
  );
}

/**
 * Resolves the effective grade point for a record against the active scale.
 */
export function resolveEffectiveGradePoint(
  record: GradeRecord,
  scale: GradingScale
): number | undefined {
  if (record.status === 'dropped') return undefined;

  // If explicit gradePoint is assigned
  if (typeof record.gradePoint === 'number' && !isNaN(record.gradePoint)) {
    return Math.min(record.gradePoint, scale.maxGpa);
  }

  // If percentage score is assigned, resolve via scale tier
  if (typeof record.percentageScore === 'number' && !isNaN(record.percentageScore)) {
    const tier = findTierForPercentage(record.percentageScore, scale);
    return tier.gradePoint;
  }

  return undefined;
}

/**
 * Calculates GPA and summary metrics for a list of course grade records in a semester.
 * CRITICAL RULE: Missing/ungraded courses must NEVER be counted as 0.0.
 */
export function calculateSemesterGpa(
  records: GradeRecord[],
  scale: GradingScale,
  semesterId: string = 'unknown',
  semesterName: string = 'Semester'
): SemesterGpaSummary {
  const activeRecords = records.filter((r) => r.status !== 'dropped');

  let totalCredits = 0;
  let earnedCredits = 0;
  let attemptedCredits = 0;
  let qualityPoints = 0;
  let percentageSumWeighted = 0;
  let percentageCreditsCount = 0;
  let gradedCount = 0;
  let ungradedCount = 0;

  const courseItems: CourseGpaItem[] = [];

  for (const record of activeRecords) {
    totalCredits += record.credits;
    const effectiveGp = resolveEffectiveGradePoint(record, scale);

    if (effectiveGp !== undefined) {
      gradedCount++;
      attemptedCredits += record.credits;
      const qp = calculateQualityPoints(effectiveGp, record.credits);
      qualityPoints += qp;

      const isPassing = effectiveGp > 0;
      if (isPassing) {
        earnedCredits += record.credits;
      }

      if (typeof record.percentageScore === 'number' && !isNaN(record.percentageScore)) {
        percentageSumWeighted += record.percentageScore * record.credits;
        percentageCreditsCount += record.credits;
      }

      courseItems.push({
        courseId: record.courseId,
        courseCode: record.courseCode,
        courseName: record.courseName,
        credits: record.credits,
        gradePoint: effectiveGp,
        letterGrade: record.letterGrade,
        percentageScore: record.percentageScore,
        isPassing,
      });
    } else {
      ungradedCount++;
    }
  }

  const gpa = attemptedCredits > 0 ? parseFloat((qualityPoints / attemptedCredits).toFixed(2)) : 0;
  const weightedPercentage =
    percentageCreditsCount > 0
      ? parseFloat((percentageSumWeighted / percentageCreditsCount).toFixed(1))
      : null;

  return {
    semesterId,
    semesterName,
    totalCredits,
    earnedCredits,
    attemptedCredits,
    qualityPoints: parseFloat(qualityPoints.toFixed(2)),
    gpa,
    weightedPercentage,
    coursesCount: activeRecords.length,
    gradedCoursesCount: gradedCount,
    ungradedCoursesCount: ungradedCount,
    courses: courseItems,
  };
}

/**
 * Evaluates academic honors & standing based on GPA ratio against maximum GPA.
 */
export function getAcademicStanding(
  gpa: number,
  maxGpa: number
): { title: string; honors: string; color: string } {
  if (maxGpa <= 0 || gpa <= 0) {
    return { title: 'No GPA Recorded', honors: 'Not Applicable', color: 'slate' };
  }

  const ratio = gpa / maxGpa;

  if (ratio >= 0.925) {
    return {
      title: 'Summa Cum Laude',
      honors: "Dean's Highest Honors",
      color: 'emerald',
    };
  }
  if (ratio >= 0.85) {
    return {
      title: 'Magna Cum Laude',
      honors: "Dean's Honor List",
      color: 'indigo',
    };
  }
  if (ratio >= 0.75) {
    return {
      title: 'Cum Laude',
      honors: 'Honor Roll Standing',
      color: 'cyan',
    };
  }
  if (ratio >= 0.625) {
    return {
      title: 'Good Academic Standing',
      honors: 'Satisfactory Progress',
      color: 'blue',
    };
  }
  if (ratio >= 0.5) {
    return {
      title: 'Academic Warning',
      honors: 'Needs Improvement',
      color: 'amber',
    };
  }
  return {
    title: 'Academic Probation',
    honors: 'Critical Standing',
    color: 'rose',
  };
}

/**
 * Calculates Cumulative GPA across all semesters.
 */
export function calculateCumulativeGpa(
  records: GradeRecord[],
  semesters: Semester[],
  scale: GradingScale
): CumulativeGpaSummary {
  const semesterMap = new Map<string, Semester>();
  semesters.forEach((s) => semesterMap.set(s.id, s));

  // Group records by semesterId
  const recordsBySemester = new Map<string, GradeRecord[]>();
  for (const r of records) {
    const list = recordsBySemester.get(r.semesterId) || [];
    list.push(r);
    recordsBySemester.set(r.semesterId, list);
  }

  const semesterSummaries: SemesterGpaSummary[] = [];
  let totalQualityPoints = 0;
  let totalCreditsAttempted = 0;
  let totalCreditsEarned = 0;
  let totalCreditsInProgress = 0;
  let totalPercentageSum = 0;
  let totalPercentageCredits = 0;
  let totalCoursesCount = 0;
  let totalGradedCount = 0;
  let totalUngradedCount = 0;

  for (const semester of semesters) {
    const semRecords = recordsBySemester.get(semester.id) || [];
    const summary = calculateSemesterGpa(semRecords, scale, semester.id, semester.name);
    semesterSummaries.push(summary);

    totalQualityPoints += summary.qualityPoints;
    totalCreditsAttempted += summary.attemptedCredits;
    totalCreditsEarned += summary.earnedCredits;
    totalCreditsInProgress += summary.totalCredits - summary.attemptedCredits;
    totalCoursesCount += summary.coursesCount;
    totalGradedCount += summary.gradedCoursesCount;
    totalUngradedCount += summary.ungradedCoursesCount;

    if (summary.weightedPercentage !== null) {
      totalPercentageSum += summary.weightedPercentage * summary.attemptedCredits;
      totalPercentageCredits += summary.attemptedCredits;
    }
  }

  // Any orphaned records not belonging to known semesters
  for (const [semId, semRecords] of recordsBySemester.entries()) {
    if (!semesterMap.has(semId)) {
      const summary = calculateSemesterGpa(semRecords, scale, semId, 'Other Term');
      semesterSummaries.push(summary);

      totalQualityPoints += summary.qualityPoints;
      totalCreditsAttempted += summary.attemptedCredits;
      totalCreditsEarned += summary.earnedCredits;
      totalCreditsInProgress += summary.totalCredits - summary.attemptedCredits;
      totalCoursesCount += summary.coursesCount;
      totalGradedCount += summary.gradedCoursesCount;
      totalUngradedCount += summary.ungradedCoursesCount;
    }
  }

  const cumulativeGpa =
    totalCreditsAttempted > 0
      ? parseFloat((totalQualityPoints / totalCreditsAttempted).toFixed(2))
      : 0;

  const overallWeightedPercentage =
    totalPercentageCredits > 0
      ? parseFloat((totalPercentageSum / totalPercentageCredits).toFixed(1))
      : null;

  const academicStanding = getAcademicStanding(cumulativeGpa, scale.maxGpa);

  return {
    cumulativeGpa,
    totalQualityPoints: parseFloat(totalQualityPoints.toFixed(2)),
    totalCreditsAttempted,
    totalCreditsEarned,
    totalCreditsInProgress,
    overallWeightedPercentage,
    totalCoursesCount,
    gradedCoursesCount: totalGradedCount,
    ungradedCoursesCount: totalUngradedCount,
    academicStanding,
    semesters: semesterSummaries,
  };
}

/**
 * Builds chronological GPA history data points for Recharts.
 */
export function getGpaProgressionHistory(
  semesters: Semester[],
  records: GradeRecord[],
  scale: GradingScale
): GpaHistoryPoint[] {
  // Sort semesters chronologically by startDate
  const sortedSemesters = [...semesters].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  const historyPoints: GpaHistoryPoint[] = [];
  let rollingQualityPoints = 0;
  let rollingAttemptedCredits = 0;
  let rollingEarnedCredits = 0;

  for (const sem of sortedSemesters) {
    const semRecords = records.filter((r) => r.semesterId === sem.id);
    const summary = calculateSemesterGpa(semRecords, scale, sem.id, sem.name);

    rollingQualityPoints += summary.qualityPoints;
    rollingAttemptedCredits += summary.attemptedCredits;
    rollingEarnedCredits += summary.earnedCredits;

    const cumulativeGpaAtPoint =
      rollingAttemptedCredits > 0
        ? parseFloat((rollingQualityPoints / rollingAttemptedCredits).toFixed(2))
        : summary.gpa;

    historyPoints.push({
      semesterId: sem.id,
      semesterName: sem.name,
      semesterGpa: summary.gpa,
      cumulativeGpa: cumulativeGpaAtPoint,
      creditsEarned: summary.earnedCredits,
      cumulativeCredits: rollingEarnedCredits,
      targetGpa: sem.targetGpa,
    });
  }

  return historyPoints;
}

/**
 * Simulates GPA with hypothetical grades for in-progress or ungraded courses.
 */
export function simulateProjectedGpa(
  records: GradeRecord[],
  semesters: Semester[],
  simulatedGrades: Record<string, number>, // courseId -> simulated grade point
  scale: GradingScale
): {
  projectedSemesterGpa: number;
  projectedCumulativeGpa: number;
  simulatedQualityPoints: number;
  totalSimulatedCredits: number;
} {
  // Clone records and inject simulated grade point for ungraded/enrolled courses
  const simulatedRecords = records.map((record) => {
    if (simulatedGrades[record.courseId] !== undefined) {
      return {
        ...record,
        gradePoint: simulatedGrades[record.courseId],
      };
    }
    return record;
  });

  const cumulativeSummary = calculateCumulativeGpa(simulatedRecords, semesters, scale);

  // Active semester summary
  const currentSemester = semesters.find((s) => s.isCurrent) || semesters[semesters.length - 1];
  const currentSemRecords = currentSemester
    ? simulatedRecords.filter((r) => r.semesterId === currentSemester.id)
    : [];

  const semesterSummary = calculateSemesterGpa(
    currentSemRecords,
    scale,
    currentSemester?.id,
    currentSemester?.name
  );

  return {
    projectedSemesterGpa: semesterSummary.gpa,
    projectedCumulativeGpa: cumulativeSummary.cumulativeGpa,
    simulatedQualityPoints: cumulativeSummary.totalQualityPoints,
    totalSimulatedCredits: cumulativeSummary.totalCreditsAttempted,
  };
}
