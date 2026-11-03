import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLessonProgress,
  calculateAttendanceStats,
  calculateCourseHealth,
  parseStudyWeeks,
  formatStudyWeeksSummary,
} from './courseProgress.ts';
import type { Course } from '../../../types/index.ts';

describe('Course Progress Business Logic', () => {
  const baseCourse: Course = {
    id: 'course-test-1',
    semesterId: 'sem-fall-2026',
    code: 'CS201',
    name: 'Data Structures',
    credits: 4,
    color: '#3B82F6',
    status: 'enrolled',
    totalLessons: 20,
    completedLessons: 10,
    lessons: [
      { id: 'l1', lessonNumber: 1, title: 'Intro', isCompleted: true },
      { id: 'l2', lessonNumber: 2, title: 'Arrays', isCompleted: true },
      { id: 'l3', lessonNumber: 3, title: 'Linked Lists', isCompleted: false },
    ],
    attendanceRecords: [
      { id: 'a1', date: '2026-10-01', status: 'present' },
      { id: 'a2', date: '2026-10-08', status: 'present' },
      { id: 'a3', date: '2026-10-15', status: 'late' },
      { id: 'a4', date: '2026-10-22', status: 'absent' },
    ],
    gradingComponents: [],
  };

  describe('calculateLessonProgress', () => {
    it('correctly calculates completed lessons and percentage', () => {
      const progress = calculateLessonProgress(baseCourse);
      assert.equal(progress.total, 20);
      assert.equal(progress.completed, 10);
      assert.equal(progress.remaining, 10);
      assert.equal(progress.percentage, 50);
    });

    it('falls back to lessons array count if completedLessons is not set', () => {
      const courseWithoutCount: Course = {
        ...baseCourse,
        completedLessons: undefined,
        totalLessons: 10,
      };
      const progress = calculateLessonProgress(courseWithoutCount);
      assert.equal(progress.completed, 2); // 2 completed in array
      assert.equal(progress.percentage, 20);
    });

    it('handles 100% completion correctly', () => {
      const finishedCourse: Course = {
        ...baseCourse,
        totalLessons: 15,
        completedLessons: 15,
      };
      const progress = calculateLessonProgress(finishedCourse);
      assert.equal(progress.percentage, 100);
      assert.equal(progress.remaining, 0);
    });

    it('safely handles zero total lessons without dividing by zero', () => {
      const emptyCourse: Course = {
        ...baseCourse,
        totalLessons: 0,
        completedLessons: 0,
        lessons: [],
      };
      const progress = calculateLessonProgress(emptyCourse);
      assert.equal(progress.percentage, 0);
    });
  });

  describe('calculateAttendanceStats', () => {
    it('calculates weighted attendance: present=1.0, late=0.5', () => {
      // Records: 2 present (2.0), 1 late (0.5), 1 absent (0.0). Total: 4.
      // Weighted: 2.5 / 4 = 62.5% -> rounded to 63%
      const stats = calculateAttendanceStats(baseCourse);
      assert.equal(stats.totalSessions, 4);
      assert.equal(stats.present, 2);
      assert.equal(stats.late, 1);
      assert.equal(stats.absent, 1);
      assert.equal(stats.excused, 0);
      assert.equal(stats.attendanceRate, 63);
      assert.equal(stats.isAtRisk, true); // < 80% with >= 3 sessions
      assert.equal(stats.status, 'critical');
    });

    it('deducts excused sessions from total eligible count', () => {
      const courseWithExcused: Course = {
        ...baseCourse,
        attendanceRecords: [
          { id: 'a1', date: '2026-10-01', status: 'present' },
          { id: 'a2', date: '2026-10-08', status: 'present' },
          { id: 'a3', date: '2026-10-15', status: 'excused' },
        ],
      };
      // 2 present out of (3 - 1 excused) = 2/2 = 100%
      const stats = calculateAttendanceStats(courseWithExcused);
      assert.equal(stats.totalSessions, 3);
      assert.equal(stats.excused, 1);
      assert.equal(stats.attendanceRate, 100);
      assert.equal(stats.isAtRisk, false);
      assert.equal(stats.status, 'excellent');
    });

    it('returns 100% attendance if no sessions have been held yet', () => {
      const newCourse: Course = {
        ...baseCourse,
        attendanceRecords: [],
      };
      const stats = calculateAttendanceStats(newCourse);
      assert.equal(stats.attendanceRate, 100);
      assert.equal(stats.isAtRisk, false);
    });
  });

  describe('calculateCourseHealth', () => {
    it('returns at-risk health when attendance is below threshold', () => {
      const health = calculateCourseHealth(baseCourse);
      assert.equal(health.badgeVariant, 'rose');
      assert.equal(health.label, 'Attendance Warning');
    });

    it('returns on-track health when attendance and lessons are in good standing', () => {
      const goodCourse: Course = {
        ...baseCourse,
        totalLessons: 20,
        completedLessons: 18, // 90%
        attendanceRecords: [
          { id: 'a1', date: '2026-10-01', status: 'present' },
          { id: 'a2', date: '2026-10-08', status: 'present' },
          { id: 'a3', date: '2026-10-15', status: 'present' },
          { id: 'a4', date: '2026-10-22', status: 'present' },
        ],
      };
      const health = calculateCourseHealth(goodCourse);
      assert.equal(health.badgeVariant, 'emerald');
      assert.equal(health.label, 'On Track');
      assert.ok(health.healthScore >= 80);
    });
  });

  describe('parseStudyWeeks & formatStudyWeeksSummary', () => {
    it('correctly parses single range e.g. "2-19"', () => {
      const weeks = parseStudyWeeks('2-19');
      assert.equal(weeks.length, 18);
      assert.equal(weeks[0], 2);
      assert.equal(weeks[weeks.length - 1], 19);
      assert.equal(formatStudyWeeksSummary('2-19'), '18 buổi học');
    });

    it('correctly parses multiple discontinuous ranges e.g. "2-9, 11-18"', () => {
      const weeks = parseStudyWeeks('2-9, 11-18');
      assert.equal(weeks.length, 16);
      assert.equal(weeks[0], 2);
      assert.equal(weeks[7], 9);
      assert.equal(weeks[8], 11);
      assert.equal(weeks[15], 18);
      assert.equal(formatStudyWeeksSummary('2-9, 11-18'), '16 buổi học');
    });

    it('handles semicolon separator and spaces e.g. "2-9; 11-18"', () => {
      const weeks = parseStudyWeeks('2-9; 11-18');
      assert.equal(weeks.length, 16);
    });

    it('handles discrete numbers mixed with ranges e.g. "1, 3, 5-8"', () => {
      const weeks = parseStudyWeeks('1, 3, 5-8');
      assert.deepEqual(weeks, [1, 3, 5, 6, 7, 8]);
    });

    it('returns empty array for blank or invalid inputs', () => {
      assert.deepEqual(parseStudyWeeks(''), []);
      assert.deepEqual(parseStudyWeeks('   '), []);
      assert.equal(formatStudyWeeksSummary(''), '');
    });
  });
});
