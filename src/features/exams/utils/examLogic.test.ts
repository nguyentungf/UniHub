import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isExamCompleted,
  getExamCountdown,
  calculateTopicProgress,
  calculateExamOverviewStats,
  filterAndSortExams,
  groupExamsByDate,
  generateExamsIcs,
  selectUpcomingExams,
  selectNextExam,
} from './examLogic.ts';
import type { Exam, Course } from '../../../types/index.ts';

describe('Exam Business Logic & Selectors', () => {
  const mockCourses: Course[] = [
    {
      id: 'course-cs201',
      semesterId: 'sem-1',
      code: 'CS201',
      name: 'Data Structures',
      credits: 4,
      color: '#3B82F6',
      status: 'enrolled',
      gradingComponents: [],
    },
    {
      id: 'course-math205',
      semesterId: 'sem-1',
      code: 'MATH205',
      name: 'Linear Algebra',
      credits: 3,
      color: '#10B981',
      status: 'enrolled',
      gradingComponents: [],
    },
  ];

  const fixedNow = new Date('2026-11-05T09:00:00Z');

  const mockExams: Exam[] = [
    {
      id: 'exam-1',
      courseId: 'course-cs201',
      title: 'Midterm Examination',
      examType: 'midterm',
      examDate: '2026-11-07T09:00:00Z', // 2 days away (<= 3 days)
      durationMinutes: 120,
      location: 'Turing Hall 302',
      seatNumber: 'A-12',
      weight: 30,
      topics: ['Trees', 'Heaps', 'Graphs', 'Hashing'],
      targetScore: 90,
      maxScore: 100,
    },
    {
      id: 'exam-2',
      courseId: 'course-math205',
      title: 'Final Examination',
      examType: 'final',
      examDate: '2026-11-20T14:00:00Z', // 15 days away
      durationMinutes: 180,
      location: 'Science Auditorium',
      seatNumber: 'B-04',
      weight: 40,
      topics: ['Vector Spaces', 'Eigenvalues', 'SVD'],
      targetScore: 85,
      maxScore: 100,
    },
    {
      id: 'exam-3',
      courseId: 'course-cs201',
      title: 'Quiz 1 - Complexity',
      examType: 'quiz',
      examDate: '2026-10-15T10:00:00Z', // Past, completed
      durationMinutes: 45,
      location: 'Room 101',
      weight: 10,
      topics: ['Big-O', 'Recurrences'],
      actualScore: 95,
      maxScore: 100,
      status: 'completed',
    },
  ];

  const completedTopicKeys: Record<string, boolean> = {
    'CS201-0': true,
    'CS201-1': true,
    'MATH205-0': true,
  };

  describe('isExamCompleted', () => {
    it('returns true if status is completed or actualScore is present', () => {
      assert.equal(isExamCompleted(mockExams[2], fixedNow), true);
      assert.equal(isExamCompleted(mockExams[0], fixedNow), false);
    });
  });

  describe('getExamCountdown', () => {
    it('detects upcoming exam within 3 days with amber badge', () => {
      const countdown = getExamCountdown('2026-11-07T09:00:00Z', fixedNow);
      assert.equal(countdown.isPast, false);
      assert.equal(countdown.daysLeft, 2);
      assert.equal(countdown.badgeVariant, 'amber');
    });

    it('detects distant upcoming exam with emerald badge', () => {
      const countdown = getExamCountdown('2026-11-20T14:00:00Z', fixedNow);
      assert.equal(countdown.isPast, false);
      assert.equal(countdown.badgeVariant, 'emerald');
    });

    it('detects past exam correctly', () => {
      const countdown = getExamCountdown('2026-10-15T10:00:00Z', fixedNow);
      assert.equal(countdown.isPast, true);
      assert.equal(countdown.label, 'Exam Concluded');
    });
  });

  describe('calculateTopicProgress', () => {
    it('computes completion percentage accurately', () => {
      const progress = calculateTopicProgress(
        mockExams[0].topics, // 4 topics
        completedTopicKeys,
        'CS201'
      );
      assert.equal(progress.total, 4);
      assert.equal(progress.completed, 2);
      assert.equal(progress.percentage, 50);
    });

    it('handles empty topic list safely', () => {
      const progress = calculateTopicProgress([], {}, 'CS201');
      assert.equal(progress.percentage, 100);
    });
  });

  describe('calculateExamOverviewStats', () => {
    it('aggregates total, upcoming, completed counts, nearest exam and total weight', () => {
      const stats = calculateExamOverviewStats(
        mockExams,
        completedTopicKeys,
        mockCourses,
        fixedNow
      );
      assert.equal(stats.totalExams, 3);
      assert.equal(stats.upcomingCount, 2);
      assert.equal(stats.completedCount, 1);
      assert.equal(stats.nearestExamDays, 2);
      assert.equal(stats.totalExamWeight, 80);
      assert.ok(stats.overallReadinessPercentage > 0);
    });
  });

  describe('filterAndSortExams', () => {
    it('filters by courseId', () => {
      const csExams = filterAndSortExams(
        mockExams,
        { courseId: 'course-cs201' },
        'examDate_asc',
        mockCourses,
        fixedNow
      );
      assert.equal(csExams.length, 2);
      assert.ok(csExams.every((e) => e.courseId === 'course-cs201'));
    });

    it('filters by examType (final)', () => {
      const finals = filterAndSortExams(
        mockExams,
        { type: 'final' },
        'examDate_asc',
        mockCourses,
        fixedNow
      );
      assert.equal(finals.length, 1);
      assert.equal(finals[0].id, 'exam-2');
    });

    it('filters by status (upcoming vs completed)', () => {
      const upcoming = filterAndSortExams(
        mockExams,
        { status: 'upcoming' },
        'examDate_asc',
        mockCourses,
        fixedNow
      );
      assert.equal(upcoming.length, 2);

      const completed = filterAndSortExams(
        mockExams,
        { status: 'completed' },
        'examDate_asc',
        mockCourses,
        fixedNow
      );
      assert.equal(completed.length, 1);
      assert.equal(completed[0].id, 'exam-3');
    });

    it('sorts by grade weight descending', () => {
      const sorted = filterAndSortExams(
        mockExams,
        {},
        'weight_desc',
        mockCourses,
        fixedNow
      );
      assert.equal(sorted[0].weight, 40); // exam-2
      assert.equal(sorted[1].weight, 30); // exam-1
      assert.equal(sorted[2].weight, 10); // exam-3
    });
  });

  describe('generateExamsIcs', () => {
    it('generates valid VCALENDAR with VEVENT including duration and location', () => {
      const ics = generateExamsIcs(mockExams, mockCourses);
      assert.ok(ics.includes('BEGIN:VCALENDAR'));
      assert.ok(ics.includes('X-WR-CALNAME:UniHub Exam Schedule'));
      assert.ok(ics.includes('LOCATION:Turing Hall 302'));
    });
  });

  describe('Dashboard Selectors', () => {
    it('selectNextExam returns the closest upcoming exam', () => {
      const next = selectNextExam(mockExams, mockCourses, fixedNow);
      assert.ok(next);
      assert.equal(next?.id, 'exam-1');
      assert.equal(next?.daysRemaining, 2);
      assert.equal(next?.courseCode, 'CS201');
    });

    it('selectUpcomingExams returns only upcoming exams sorted chronologically', () => {
      const upcoming = selectUpcomingExams(mockExams, mockCourses, 5, fixedNow);
      assert.equal(upcoming.length, 2);
      assert.equal(upcoming[0].id, 'exam-1');
      assert.equal(upcoming[1].id, 'exam-2');
    });
  });
});

