import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailyStats,
  calculateWeeklyStats,
  calculateStudyStreak,
  calculateCourseFocusBreakdown,
  calculateDailyFocusTrend,
} from './studyAnalytics.ts';
import type { StudySession, Course } from '../../../types/index.ts';

describe('Study Analytics & Statistics Tests', () => {
  const baseDate = new Date('2026-11-02T12:00:00.000Z');

  const mockCourses: Course[] = [
    {
      id: 'course-cs201',
      semesterId: 'sem-1',
      code: 'CS201',
      name: 'Data Structures',
      credits: 4,
      color: '#3B82F6',
      status: 'enrolled',
      totalLessons: 15,
      completedLessons: 6,
      lessons: [],
      attendanceRecords: [],
      gradingComponents: [],
    },
    {
      id: 'course-math205',
      semesterId: 'sem-1',
      code: 'MATH205',
      name: 'Linear Algebra',
      credits: 3,
      color: '#F59E0B',
      status: 'enrolled',
      totalLessons: 15,
      completedLessons: 8,
      lessons: [],
      attendanceRecords: [],
      gradingComponents: [],
    },
  ];

  const mockSessions: StudySession[] = [
    // Today (2026-11-02)
    {
      id: 's-1',
      courseId: 'course-cs201',
      startTime: '2026-11-02T09:00:00.000Z',
      endTime: '2026-11-02T09:50:00.000Z',
      durationMinutes: 50,
      sessionType: 'pomodoro',
      focusRating: 5,
    },
    {
      id: 's-2',
      courseId: 'course-math205',
      startTime: '2026-11-02T14:00:00.000Z',
      endTime: '2026-11-02T14:30:00.000Z',
      durationMinutes: 30,
      sessionType: 'pomodoro',
      focusRating: 4,
    },
    // Yesterday (2026-11-01)
    {
      id: 's-3',
      courseId: 'course-cs201',
      startTime: '2026-11-01T10:00:00.000Z',
      endTime: '2026-11-01T11:00:00.000Z',
      durationMinutes: 60,
      sessionType: 'pomodoro',
      focusRating: 4,
    },
    // 2 days ago (2026-10-31)
    {
      id: 's-4',
      courseId: null, // General
      startTime: '2026-10-31T15:00:00.000Z',
      endTime: '2026-10-31T15:45:00.000Z',
      durationMinutes: 45,
      sessionType: 'manual',
      focusRating: 3,
    },
    // 10 days ago (outside 7-day window)
    {
      id: 's-old',
      courseId: 'course-cs201',
      startTime: '2026-10-20T08:00:00.000Z',
      endTime: '2026-10-20T09:00:00.000Z',
      durationMinutes: 60,
      sessionType: 'pomodoro',
      focusRating: 5,
    },
  ];

  describe('calculateDailyStats', () => {
    it('aggregates total minutes, session count, and average rating for a target date', () => {
      const stats = calculateDailyStats(mockSessions, baseDate);
      assert.equal(stats.totalMinutes, 80);
      assert.equal(stats.totalHours, 1.3);
      assert.equal(stats.sessionCount, 2);
      assert.equal(stats.averageFocusRating, 4.5);
    });

    it('returns zero values when no sessions occurred on target date', () => {
      const stats = calculateDailyStats(mockSessions, new Date('2026-10-25T12:00:00.000Z'));
      assert.equal(stats.totalMinutes, 0);
      assert.equal(stats.totalHours, 0);
      assert.equal(stats.sessionCount, 0);
      assert.equal(stats.averageFocusRating, 0);
    });
  });

  describe('calculateWeeklyStats', () => {
    it('aggregates sessions within the 7-day trailing window', () => {
      const weekly = calculateWeeklyStats(mockSessions, baseDate, 10);
      // s-1 (50m) + s-2 (30m) + s-3 (60m) + s-4 (45m) = 185m
      assert.equal(weekly.totalMinutes, 185);
      assert.equal(weekly.completedSessions, 4);
      assert.equal(weekly.dailyAverageMinutes, Math.round(185 / 7));
      // target is 10 hours = 600m; 185/600 ~ 31%
      assert.equal(weekly.percentOfTarget, 31);
    });
  });

  describe('calculateStudyStreak', () => {
    it('accurately counts consecutive daily study streak', () => {
      // 2026-11-02, 2026-11-01, 2026-10-31 = 3 consecutive days
      const streak = calculateStudyStreak(mockSessions, baseDate);
      assert.equal(streak, 3);
    });

    it('maintains streak if user studied yesterday but has not yet completed a session today', () => {
      const yesterdayDate = new Date('2026-11-03T08:00:00.000Z');
      // On Nov 3, Nov 2 was studied. Streak should still be counted (3 days)
      const streak = calculateStudyStreak(mockSessions, yesterdayDate);
      assert.equal(streak, 3);
    });

    it('breaks streak when a gap of 2 or more days occurs', () => {
      const gapDate = new Date('2026-11-10T12:00:00.000Z');
      const streak = calculateStudyStreak(mockSessions, gapDate);
      assert.equal(streak, 0);
    });

    it('returns 0 for empty sessions list', () => {
      assert.equal(calculateStudyStreak([]), 0);
    });
  });

  describe('calculateCourseFocusBreakdown', () => {
    it('groups sessions by course and includes general uncategorized sessions', () => {
      const breakdown = calculateCourseFocusBreakdown(mockSessions, mockCourses);

      // CS201: s-1 (50) + s-3 (60) + s-old (60) = 170 min
      const cs201 = breakdown.find((b) => b.code === 'CS201');
      assert.ok(cs201);
      assert.equal(cs201.minutes, 170);
      assert.equal(cs201.sessionsCount, 3);
      assert.equal(cs201.color, '#3B82F6');

      // MATH205: s-2 (30) = 30 min
      const math205 = breakdown.find((b) => b.code === 'MATH205');
      assert.ok(math205);
      assert.equal(math205.minutes, 30);
      assert.equal(math205.sessionsCount, 1);

      // General: s-4 (45) = 45 min
      const general = breakdown.find((b) => b.code === 'General');
      assert.ok(general);
      assert.equal(general.minutes, 45);
    });
  });

  describe('calculateDailyFocusTrend', () => {
    it('produces array of trailing days for chart rendering', () => {
      const trend = calculateDailyFocusTrend(mockSessions, 7, baseDate);
      assert.equal(trend.length, 7);

      // Last item should be today (Nov 2) with 80 minutes
      const todayItem = trend[trend.length - 1];
      assert.equal(todayItem.date, '2026-11-02');
      assert.equal(todayItem.minutes, 80);
    });
  });
});

