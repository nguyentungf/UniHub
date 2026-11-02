import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCreditAnalytics,
  calculateCourseCompletionStats,
  calculateStudyTimeAnalytics,
  calculateAssignmentAnalytics,
  calculateAcademicPeriodSummaries,
} from './analyticsLogic.ts';
import type { Course, StudySession, Assignment, Exam } from '../../../types/index.ts';

describe('Academic Analytics Logic Tests', () => {
  const mockCourses: Course[] = [
    {
      id: 'c1',
      semesterId: 'sem1',
      code: 'CS101',
      name: 'Intro CS',
      credits: 4,
      color: '#3B82F6',
      status: 'completed',
      actualGrade: 4.0,
      letterGrade: 'A',
      gradingComponents: [],
    },
    {
      id: 'c2',
      semesterId: 'sem1',
      code: 'MATH101',
      name: 'Calculus',
      credits: 4,
      color: '#F59E0B',
      status: 'completed',
      actualGrade: 3.7,
      letterGrade: 'A-',
      gradingComponents: [],
    },
    {
      id: 'c3',
      semesterId: 'sem2',
      code: 'CS201',
      name: 'Data Structures',
      credits: 4,
      color: '#10B981',
      status: 'enrolled',
      gradingComponents: [],
    },
    {
      id: 'c4',
      semesterId: 'sem2',
      code: 'PHYS101',
      name: 'Physics',
      credits: 3,
      color: '#EC4899',
      status: 'dropped',
      gradingComponents: [],
    },
  ];

  describe('calculateCreditAnalytics', () => {
    it('aggregates earned and enrolled credits against degree target', () => {
      const stats = calculateCreditAnalytics(mockCourses, 120);
      assert.equal(stats.totalEarnedCredits, 8); // c1 + c2
      assert.equal(stats.totalEnrolledCredits, 4); // c3
      assert.equal(stats.totalAttemptedCredits, 12);
      assert.equal(stats.degreeTargetCredits, 120);
      assert.equal(stats.completionRate, 6.7); // (8 / 120) * 100 = 6.666 -> 6.7
      assert.equal(stats.creditsRemaining, 112);
    });

    it('safely handles empty course list', () => {
      const stats = calculateCreditAnalytics([], 120);
      assert.equal(stats.totalEarnedCredits, 0);
      assert.equal(stats.totalEnrolledCredits, 0);
      assert.equal(stats.completionRate, 0);
      assert.equal(stats.creditsRemaining, 120);
    });
  });

  describe('calculateCourseCompletionStats', () => {
    it('counts completed, enrolled, dropped and calculates grade distribution', () => {
      const stats = calculateCourseCompletionStats(mockCourses);
      assert.equal(stats.totalCourses, 4);
      assert.equal(stats.completedCourses, 2);
      assert.equal(stats.enrolledCourses, 1);
      assert.equal(stats.droppedCourses, 1);
      assert.equal(stats.completionRate, 50.0);

      const aTier = stats.gradeDistribution.find((g) => g.letter === 'A');
      assert.equal(aTier?.count, 1);
      assert.equal(aTier?.percentage, 50.0);

      const aMinusTier = stats.gradeDistribution.find((g) => g.letter === 'A-');
      assert.equal(aMinusTier?.count, 1);
      assert.equal(aMinusTier?.percentage, 50.0);
    });
  });

  describe('calculateStudyTimeAnalytics', () => {
    const mockSessions: StudySession[] = [
      {
        id: 's1',
        courseId: 'c1',
        startTime: '2026-11-01T10:00:00Z',
        endTime: '2026-11-01T11:30:00Z',
        durationMinutes: 90,
        sessionType: 'pomodoro',
        focusRating: 5,
      },
      {
        id: 's2',
        courseId: 'c2',
        startTime: '2026-11-01T14:00:00Z',
        endTime: '2026-11-01T15:00:00Z',
        durationMinutes: 60,
        sessionType: 'stopwatch',
        focusRating: 4,
      },
    ];

    it('calculates total hours, average session, and breakdown by course', () => {
      const stats = calculateStudyTimeAnalytics(
        mockSessions,
        mockCourses,
        new Date('2026-11-01T18:00:00Z')
      );
      assert.equal(stats.totalMinutes, 150);
      assert.equal(stats.totalHours, 2.5);
      assert.equal(stats.totalSessions, 2);
      assert.equal(stats.averageSessionMinutes, 75);
      assert.equal(stats.averageFocusRating, 4.5);
      assert.equal(stats.studyTimeByCourse.length, 2);
      assert.equal(stats.studyTimeByCourse[0].courseCode, 'CS101');
      assert.equal(stats.studyTimeByCourse[0].hours, 1.5);
      assert.equal(stats.studyTimeByCourse[1].courseCode, 'MATH101');
      assert.equal(stats.studyTimeByCourse[1].hours, 1.0);
    });
  });

  describe('calculateAssignmentAnalytics', () => {
    const mockAssignments: Assignment[] = [
      {
        id: 'a1',
        courseId: 'c1',
        title: 'Project 1',
        dueDate: '2026-11-05T23:59:00Z',
        priority: 'urgent',
        status: 'graded',
        maxScore: 100,
        earnedScore: 95,
      },
      {
        id: 'a2',
        courseId: 'c1',
        title: 'Homework 2',
        dueDate: '2026-11-10T23:59:00Z',
        priority: 'high',
        status: 'completed',
        maxScore: 100,
      },
      {
        id: 'a3',
        courseId: 'c2',
        title: 'Quiz 3',
        dueDate: '2026-11-15T23:59:00Z',
        priority: 'medium',
        status: 'in_progress',
        maxScore: 100,
      },
    ];

    it('calculates completion rate and average earned score', () => {
      const stats = calculateAssignmentAnalytics(mockAssignments);
      assert.equal(stats.total, 3);
      assert.equal(stats.completedCount, 2);
      assert.equal(stats.pendingCount, 1);
      assert.equal(stats.completionRate, 66.7);
      assert.equal(stats.gradedCount, 1);
      assert.equal(stats.averageScore, 95.0);
      assert.equal(stats.urgentCount, 1);
      assert.equal(stats.highCount, 1);
    });
  });

  describe('calculateAcademicPeriodSummaries', () => {
    it('generates period summaries for weekly and monthly windows', () => {
      const summaries = calculateAcademicPeriodSummaries(
        [],
        [],
        [],
        mockCourses,
        new Date('2026-11-01T12:00:00Z')
      );
      assert.ok(summaries.weekly);
      assert.ok(summaries.monthly);
      assert.equal(summaries.weekly.periodLabel, 'This Week');
      assert.equal(summaries.monthly.periodLabel, 'This Month');
      assert.ok(summaries.weekly.momentumScore > 0);
    });
  });
});

