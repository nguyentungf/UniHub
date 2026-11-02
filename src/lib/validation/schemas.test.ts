import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CourseFormSchema,
  TimetableSlotFormSchema,
  CourseSchema,
  AssignmentFormSchema,
  ExamFormSchema,
  isValidDateInput,
} from './schemas.ts';

describe('Validation Schemas Tests', () => {
  describe('CourseFormSchema', () => {
    it('validates a correct course input', () => {
      const validCourse = {
        code: 'CS201',
        name: 'Data Structures & Algorithms',
        credits: 4,
        semesterId: 'sem-fall-2026',
        color: '#3B82F6',
        instructor: 'Dr. Sarah Mitchell',
        location: 'Turing Hall',
        status: 'enrolled',
        targetGrade: 'A',
        totalLessons: 24,
      };

      const result = CourseFormSchema.safeParse(validCourse);
      assert.equal(result.success, true);
    });

    it('rejects missing course code or name', () => {
      const invalid = {
        code: '',
        name: '',
        credits: 3,
        semesterId: 'sem-fall-2026',
        color: '#3B82F6',
      };
      const result = CourseFormSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        assert.ok(issues.includes('code'));
        assert.ok(issues.includes('name'));
      }
    });

    it('rejects invalid hex color format', () => {
      const invalidColor = {
        code: 'MATH101',
        name: 'Calculus',
        credits: 3,
        semesterId: 'sem-1',
        color: 'not-a-hex-color',
      };
      const result = CourseFormSchema.safeParse(invalidColor);
      assert.equal(result.success, false);
    });
  });

  describe('TimetableSlotFormSchema', () => {
    it('validates a standard timetable slot', () => {
      const validSlot = {
        courseId: 'course-1',
        dayOfWeek: 1,
        startTime: '08:30',
        endTime: '10:00',
        location: 'Science Complex',
        room: 'Room 201',
        type: 'lecture',
        recurrence: 'weekly',
      };
      const result = TimetableSlotFormSchema.safeParse(validSlot);
      assert.equal(result.success, true);
    });

    it('rejects when end time is before or equal to start time', () => {
      const invertedTimes = {
        courseId: 'course-1',
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '08:30', // invalid: end before start
        location: 'Hall A',
      };
      const result = TimetableSlotFormSchema.safeParse(invertedTimes);
      assert.equal(result.success, false);
      if (!result.success) {
        const errorPath = result.error.issues[0]?.path[0];
        assert.equal(errorPath, 'endTime');
      }
    });
  });

  describe('Date Validation & Invalid Date Prevention', () => {
    it('accepts valid ISO and local datetime strings', () => {
      assert.equal(isValidDateInput('2026-11-15T14:00'), true);
      assert.equal(isValidDateInput('2026-11-15T14:00:00Z'), true);
      assert.equal(isValidDateInput('2026-12-31'), true);
    });

    it('rejects nonexistent calendar dates (e.g. Feb 30 or Nov 31)', () => {
      assert.equal(isValidDateInput('2026-02-30T10:00'), false);
      assert.equal(isValidDateInput('2026-11-31T23:59'), false);
      assert.equal(isValidDateInput('2026-04-31'), false);
    });

    it('rejects garbage, empty, and out-of-range dates', () => {
      assert.equal(isValidDateInput(''), false);
      assert.equal(isValidDateInput('not-a-date'), false);
      assert.equal(isValidDateInput('1980-05-12'), false); // below 2000
      assert.equal(isValidDateInput('2150-01-01'), false); // above 2100
    });
  });

  describe('AssignmentFormSchema', () => {
    it('validates a complete assignment payload', () => {
      const validAssignment = {
        title: 'Red-Black Tree Insertion',
        courseId: 'course-cs201',
        dueDate: '2026-11-20T23:59',
        priority: 'high',
        status: 'in_progress',
        weight: 15,
        maxScore: 100,
        description: 'Implement rotation cases',
      };
      const result = AssignmentFormSchema.safeParse(validAssignment);
      assert.equal(result.success, true);
    });

    it('rejects blank title and missing courseId', () => {
      const invalid = {
        title: '   ',
        courseId: '',
        dueDate: '2026-11-20T23:59',
      };
      const result = AssignmentFormSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        assert.ok(issues.includes('title'));
        assert.ok(issues.includes('courseId'));
      }
    });

    it('rejects invalid due dates', () => {
      const invalidDate = {
        title: 'Homework 1',
        courseId: 'course-1',
        dueDate: '2026-02-30T12:00', // invalid calendar date
      };
      const result = AssignmentFormSchema.safeParse(invalidDate);
      assert.equal(result.success, false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        assert.ok(issues.includes('dueDate'));
      }
    });

    it('rejects negative weight or weight exceeding 100', () => {
      const invalidWeight = {
        title: 'Homework 2',
        courseId: 'course-1',
        dueDate: '2026-11-10T23:59',
        weight: 150,
      };
      const result = AssignmentFormSchema.safeParse(invalidWeight);
      assert.equal(result.success, false);
    });
  });

  describe('ExamFormSchema', () => {
    it('validates a complete exam input', () => {
      const validExam = {
        title: 'Midterm Examination',
        courseId: 'course-cs201',
        examType: 'midterm',
        examDate: '2026-11-18T09:00',
        durationMinutes: 120,
        location: 'Turing Hall - Auditorium 1',
        seatNumber: 'Seat A-24',
        weight: 30,
        topics: ['Complexity', 'Trees', 'Graphs'],
        targetScore: 90,
        status: 'upcoming',
      };
      const result = ExamFormSchema.safeParse(validExam);
      assert.equal(result.success, true);
    });

    it('rejects missing location or zero/negative duration', () => {
      const invalid = {
        title: 'Midterm',
        courseId: 'course-1',
        examDate: '2026-11-18T09:00',
        location: '   ',
        durationMinutes: 0,
      };
      const result = ExamFormSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        assert.ok(issues.includes('location'));
        assert.ok(issues.includes('durationMinutes'));
      }
    });

    it('rejects invalid exam dates', () => {
      const invalidDate = {
        title: 'Quiz 2',
        courseId: 'course-1',
        location: 'Hall B',
        durationMinutes: 60,
        examDate: 'invalid-date-format',
      };
      const result = ExamFormSchema.safeParse(invalidDate);
      assert.equal(result.success, false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        assert.ok(issues.includes('examDate'));
      }
    });
  });
});
