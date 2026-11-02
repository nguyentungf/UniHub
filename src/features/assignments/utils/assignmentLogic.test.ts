import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAssignmentCompleted,
  isAssignmentOverdue,
  getAssignmentDeadlineInfo,
  calculateAssignmentProgress,
  filterAndSortAssignments,
  groupAssignmentsByDate,
  generateAssignmentsIcs,
  selectUpcomingDeadlines,
  selectOverdueAssignments,
} from './assignmentLogic.ts';
import type { Assignment, Course } from '../../../types/index.ts';

describe('Assignment Business Logic & Selectors', () => {
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

  const fixedNow = new Date('2026-11-05T12:00:00Z');

  const mockAssignments: Assignment[] = [
    {
      id: 'asg-1',
      courseId: 'course-cs201',
      title: 'Red-Black Trees Implementation',
      description: 'Implement rotations and balancing',
      dueDate: '2026-11-08T23:59:00Z',
      priority: 'high',
      status: 'in_progress',
      weight: 15,
      maxScore: 100,
    },
    {
      id: 'asg-2',
      courseId: 'course-cs201',
      title: 'Graph BFS/DFS Lab',
      description: 'Matrix and list traversal algorithms',
      dueDate: '2026-11-02T23:59:00Z', // Past / Overdue
      priority: 'urgent',
      status: 'todo',
      weight: 10,
      maxScore: 100,
    },
    {
      id: 'asg-3',
      courseId: 'course-math205',
      title: 'Matrix Diagonalization Problem Set',
      description: 'Exercises from Strang Chapter 5',
      dueDate: '2026-11-12T18:00:00Z',
      priority: 'medium',
      status: 'todo',
      weight: 10,
      maxScore: 100,
    },
    {
      id: 'asg-4',
      courseId: 'course-math205',
      title: 'Eigenvalues Written Assignment',
      description: 'Proof of spectral theorem',
      dueDate: '2026-10-28T23:59:00Z', // Past but completed
      priority: 'low',
      status: 'completed',
      weight: 10,
      maxScore: 100,
      earnedScore: 98,
    },
  ];

  describe('isAssignmentCompleted', () => {
    it('identifies completed, submitted, and graded as completed', () => {
      assert.equal(isAssignmentCompleted('completed'), true);
      assert.equal(isAssignmentCompleted('submitted'), true);
      assert.equal(isAssignmentCompleted('graded'), true);
      assert.equal(isAssignmentCompleted('todo'), false);
      assert.equal(isAssignmentCompleted('in_progress'), false);
    });
  });

  describe('isAssignmentOverdue', () => {
    it('returns true for past due tasks that are not completed', () => {
      const overdueTask = mockAssignments.find((a) => a.id === 'asg-2')!;
      assert.equal(isAssignmentOverdue(overdueTask, fixedNow), true);
    });

    it('returns false for past due tasks that are already completed', () => {
      const completedTask = mockAssignments.find((a) => a.id === 'asg-4')!;
      assert.equal(isAssignmentOverdue(completedTask, fixedNow), false);
    });

    it('returns false for future tasks', () => {
      const futureTask = mockAssignments.find((a) => a.id === 'asg-1')!;
      assert.equal(isAssignmentOverdue(futureTask, fixedNow), false);
    });
  });

  describe('getAssignmentDeadlineInfo', () => {
    it('indicates overdue tasks with overdue label and flag', () => {
      const info = getAssignmentDeadlineInfo('2026-11-02T23:59:00Z', 'todo', fixedNow);
      assert.equal(info.isOverdue, true);
      assert.ok(info.label.includes('Overdue'));
    });

    it('handles completed tasks gracefully without overdue flag', () => {
      const info = getAssignmentDeadlineInfo('2026-10-28T23:59:00Z', 'completed', fixedNow);
      assert.equal(info.isOverdue, false);
      assert.ok(info.label.includes('Completed'));
    });
  });

  describe('calculateAssignmentProgress', () => {
    it('correctly aggregates counts, percentages, and weights', () => {
      const stats = calculateAssignmentProgress(mockAssignments, fixedNow);
      assert.equal(stats.total, 4);
      assert.equal(stats.completed, 1);
      assert.equal(stats.inProgress, 1);
      assert.equal(stats.notStarted, 2);
      assert.equal(stats.overdue, 1); // asg-2
      assert.equal(stats.completionPercentage, 25);
      assert.equal(stats.totalWeight, 45);
      assert.equal(stats.completedWeight, 10);
    });

    it('returns zero metrics when list is empty', () => {
      const empty = calculateAssignmentProgress([]);
      assert.equal(empty.total, 0);
      assert.equal(empty.completionPercentage, 0);
    });
  });

  describe('filterAndSortAssignments', () => {
    it('filters by courseId correctly', () => {
      const result = filterAndSortAssignments(
        mockAssignments,
        { courseId: 'course-cs201' },
        'dueDate_asc',
        mockCourses
      );
      assert.equal(result.length, 2);
      assert.ok(result.every((a) => a.courseId === 'course-cs201'));
    });

    it('filters by priority correctly', () => {
      const result = filterAndSortAssignments(
        mockAssignments,
        { priority: 'urgent' },
        'dueDate_asc',
        mockCourses
      );
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'asg-2');
    });

    it('filters by status correctly (completed vs in_progress)', () => {
      const completed = filterAndSortAssignments(
        mockAssignments,
        { status: 'completed' },
        'dueDate_asc',
        mockCourses
      );
      assert.equal(completed.length, 1);
      assert.equal(completed[0].id, 'asg-4');

      const inProgress = filterAndSortAssignments(
        mockAssignments,
        { status: 'in_progress' },
        'dueDate_asc',
        mockCourses
      );
      assert.equal(inProgress.length, 1);
      assert.equal(inProgress[0].id, 'asg-1');
    });

    it('filters by search keyword against title and description', () => {
      const searchResult = filterAndSortAssignments(
        mockAssignments,
        { search: 'rotation' },
        'dueDate_asc',
        mockCourses
      );
      assert.equal(searchResult.length, 1);
      assert.equal(searchResult[0].id, 'asg-1');
    });

    it('sorts by priority descending (urgent first)', () => {
      const sorted = filterAndSortAssignments(
        mockAssignments,
        {},
        'priority_desc',
        mockCourses
      );
      assert.equal(sorted[0].priority, 'urgent');
      assert.equal(sorted[1].priority, 'high');
      assert.equal(sorted[2].priority, 'medium');
      assert.equal(sorted[3].priority, 'low');
    });

    it('sorts by due date ascending and descending', () => {
      const asc = filterAndSortAssignments(mockAssignments, {}, 'dueDate_asc', mockCourses);
      assert.equal(asc[0].id, 'asg-4'); // Oct 28
      assert.equal(asc[asc.length - 1].id, 'asg-3'); // Nov 12

      const desc = filterAndSortAssignments(mockAssignments, {}, 'dueDate_desc', mockCourses);
      assert.equal(desc[0].id, 'asg-3');
      assert.equal(desc[desc.length - 1].id, 'asg-4');
    });
  });

  describe('groupAssignmentsByDate', () => {
    it('groups assignments by their YYYY-MM-DD date prefix', () => {
      const groups = groupAssignmentsByDate(mockAssignments);
      assert.ok(groups['2026-11-08']);
      assert.equal(groups['2026-11-08'].length, 1);
      assert.equal(groups['2026-11-08'][0].id, 'asg-1');
    });
  });

  describe('generateAssignmentsIcs', () => {
    it('generates valid VCALENDAR payload with VEVENT components', () => {
      const ics = generateAssignmentsIcs(mockAssignments, mockCourses);
      assert.ok(ics.includes('BEGIN:VCALENDAR'));
      assert.ok(ics.includes('END:VCALENDAR'));
      assert.ok(ics.includes('BEGIN:VEVENT'));
      assert.ok(ics.includes('[CS201] Red-Black Trees Implementation'));
    });
  });

  describe('Dashboard Selectors', () => {
    it('selectUpcomingDeadlines excludes completed and limits to N items', () => {
      const upcoming = selectUpcomingDeadlines(mockAssignments, mockCourses, 2, fixedNow);
      assert.equal(upcoming.length, 2);
      // Completed asg-4 must not be in upcoming
      assert.ok(upcoming.every((item) => item.id !== 'asg-4'));
      assert.ok(upcoming[0].courseCode);
      assert.ok(upcoming[0].relativeLabel);
    });

    it('selectOverdueAssignments retrieves all overdue tasks', () => {
      const overdue = selectOverdueAssignments(mockAssignments, fixedNow);
      assert.equal(overdue.length, 1);
      assert.equal(overdue[0].id, 'asg-2');
    });
  });
});

