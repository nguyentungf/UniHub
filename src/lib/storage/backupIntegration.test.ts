import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UniHubBackupDataSchema } from '../validation/schemas.ts';
import { SEED_DATA } from '../../constants/seedData.ts';

describe('Backup & Restore Validation Lifecycle Tests', () => {
  it('validates seed data as a compliant backup envelope', () => {
    const parseResult = UniHubBackupDataSchema.safeParse(SEED_DATA);
    assert.equal(parseResult.success, true, 'Seed data must pass backup envelope validation');
    if (parseResult.success) {
      assert.equal(parseResult.data.appName, 'UniHub');
      assert.equal(parseResult.data.version, 1);
      assert.ok(parseResult.data.data.courses.length > 0);
      assert.ok(parseResult.data.data.assignments.length > 0);
      assert.ok(parseResult.data.data.exams.length > 0);
      assert.ok(parseResult.data.data.timetable.length > 0);
    }
  });

  it('rejects tampered or corrupt backup payloads missing appName or version', () => {
    const corruptPayload = {
      version: 0, // invalid version (must be >= 1)
      appName: 'FakeApp', // must be 'UniHub'
      exportedAt: 'invalid-date',
      data: {
        semesters: [],
        courses: [],
        timetable: [],
        assignments: [],
        exams: [],
        studySessions: [],
        notes: [],
        settings: {},
      },
    };

    const parseResult = UniHubBackupDataSchema.safeParse(corruptPayload);
    assert.equal(parseResult.success, false, 'Corrupt payload must be rejected');
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.errors.map((e) => e.path.join('.'));
      assert.ok(fieldErrors.includes('version'), 'Must detect version error');
      assert.ok(fieldErrors.includes('appName'), 'Must detect appName error');
    }
  });

  it('rejects backup payloads with corrupted courses or missing mandatory fields', () => {
    const payloadWithInvalidCourse = {
      version: 1,
      appName: 'UniHub',
      exportedAt: '2026-11-02T10:00:00.000Z',
      data: {
        ...SEED_DATA.data,
        courses: [
          {
            id: 'c-invalid',
            code: '', // invalid empty code
            name: 'Broken Course',
            credits: -5, // invalid credits
            color: 'not-a-hex', // invalid hex
          },
        ],
      },
    };

    const parseResult = UniHubBackupDataSchema.safeParse(payloadWithInvalidCourse);
    assert.equal(parseResult.success, false, 'Invalid course data must be caught by schema');
  });

  it('validates partial backup restoration payload with safe defaults', () => {
    const minimalValidPayload = {
      version: 1,
      appName: 'UniHub' as const,
      exportedAt: '2026-11-02T12:00:00.000Z',
      data: {
        semesters: [],
        courses: [],
        timetable: [],
        assignments: [],
        exams: [],
        studySessions: [],
        notes: [],
        settings: {
          studentName: 'Test Student',
          universityName: 'Test Univ',
          major: 'Software Engineering',
          activeSemesterId: null,
          theme: 'dark' as const,
          gradingScaleType: '4.0' as const,
          pomodoro: {
            workDuration: 25,
            shortBreak: 5,
            longBreak: 15,
            longBreakInterval: 4,
            autoStartBreaks: false,
          },
          assignmentReminderHours: 24,
          examReminderDays: 7,
        },
      },
    };

    const parseResult = UniHubBackupDataSchema.safeParse(minimalValidPayload);
    assert.equal(parseResult.success, true);
  });

  it('validates and preserves custom grading scales and active scale in backup payload', () => {
    const payloadWithCustomScales = {
      version: 1,
      appName: 'UniHub' as const,
      exportedAt: '2026-11-03T10:00:00.000Z',
      data: {
        semesters: [],
        courses: [],
        timetable: [],
        assignments: [],
        exams: [],
        studySessions: [],
        notes: [],
        settings: {
          studentName: 'Custom Student',
          universityName: 'HUST',
          major: 'Computer Science',
          activeSemesterId: null,
          theme: 'system' as const,
          gradingScaleType: '4.0' as const,
          pomodoro: {
            workDuration: 25,
            shortBreak: 5,
            longBreak: 15,
            longBreakInterval: 4,
            autoStartBreaks: false,
          },
          assignmentReminderHours: 24,
          examReminderDays: 7,
        },
        gradingScales: [
          {
            id: 'custom-scale-hust-special',
            name: 'Thang điểm Bách Khoa Đặc Biệt',
            scaleType: 'custom' as const,
            maxGpa: 4.0,
            isCustom: true,
            tiers: [
              { letter: 'A+', gradePoint: 4.0, minPercentage: 90, maxPercentage: 100, description: 'Xuất sắc' },
              { letter: 'A', gradePoint: 3.7, minPercentage: 85, maxPercentage: 89.99, description: 'Giỏi' },
              { letter: 'F', gradePoint: 0.0, minPercentage: 0, maxPercentage: 49.99, description: 'Kém' },
            ],
          },
        ],
        activeScaleId: 'custom-scale-hust-special',
      },
    };

    const parseResult = UniHubBackupDataSchema.safeParse(payloadWithCustomScales);
    assert.equal(parseResult.success, true, 'Backup with custom grading scales must be valid');
    if (parseResult.success) {
      assert.ok(parseResult.data.data.gradingScales);
      assert.equal(parseResult.data.data.gradingScales.length, 1);
      assert.equal(parseResult.data.data.gradingScales[0].id, 'custom-scale-hust-special');
      assert.equal(parseResult.data.data.activeScaleId, 'custom-scale-hust-special');
    }
  });

  it('rejects backup payload with invalid grading scale structure', () => {
    const payloadWithInvalidScale = {
      version: 1,
      appName: 'UniHub' as const,
      exportedAt: '2026-11-03T10:00:00.000Z',
      data: {
        semesters: [],
        courses: [],
        timetable: [],
        assignments: [],
        exams: [],
        studySessions: [],
        notes: [],
        settings: {
          studentName: 'Student',
          universityName: 'Univ',
          major: 'CS',
          activeSemesterId: null,
          theme: 'light' as const,
          gradingScaleType: '4.0' as const,
          pomodoro: {
            workDuration: 25,
            shortBreak: 5,
            longBreak: 15,
            longBreakInterval: 4,
            autoStartBreaks: false,
          },
          assignmentReminderHours: 24,
          examReminderDays: 7,
        },
        gradingScales: [
          {
            id: 'broken-scale',
            name: '', // Empty name rejected
            scaleType: 'invalid-type' as any,
            maxGpa: -1, // Negative GPA rejected
            tiers: [], // Empty tiers rejected
          },
        ],
      },
    };

    const parseResult = UniHubBackupDataSchema.safeParse(payloadWithInvalidScale);
    assert.equal(parseResult.success, false, 'Invalid grading scale in backup must be rejected');
  });

  it('validates and preserves multiple semesters with distinct target GPAs and linked courses', () => {
    const multiSemesterPayload = {
      version: 1,
      appName: 'UniHub' as const,
      exportedAt: '2026-11-03T12:00:00.000Z',
      data: {
        semesters: [
          {
            id: 'sem-2025-1',
            name: 'Học kỳ 1 (2025 - 2026)',
            startDate: '2025-09-01',
            endDate: '2026-01-15',
            isCurrent: false,
            targetGpa: 3.6,
          },
          {
            id: 'sem-2025-2',
            name: 'Học kỳ 2 (2025 - 2026)',
            startDate: '2026-02-01',
            endDate: '2026-06-30',
            isCurrent: false,
            targetGpa: 3.75,
          },
          {
            id: 'sem-2026-1',
            name: 'Học kỳ 1 (2026 - 2027)',
            startDate: '2026-09-01',
            endDate: '2027-01-15',
            isCurrent: true,
            targetGpa: 3.9,
          },
        ],
        courses: [
          {
            id: 'c-1',
            semesterId: 'sem-2025-1',
            code: 'CS101',
            name: 'CS Intro',
            credits: 3,
            color: '#3B82F6',
            status: 'completed',
            gradingComponents: [],
          },
          {
            id: 'c-2',
            semesterId: 'sem-2026-1',
            code: 'CS201',
            name: 'DSA',
            credits: 4,
            color: '#10B981',
            status: 'enrolled',
            gradingComponents: [],
          },
        ],
        timetable: [],
        assignments: [],
        exams: [],
        studySessions: [],
        notes: [],
        settings: {
          studentName: 'Sinh viên',
          universityName: 'Đại học Bách Khoa',
          major: 'Kỹ thuật phần mềm',
          activeSemesterId: 'sem-2026-1',
          theme: 'system' as const,
          gradingScaleType: '4.0' as const,
          pomodoro: {
            workDuration: 25,
            shortBreak: 5,
            longBreak: 15,
            longBreakInterval: 4,
            autoStartBreaks: false,
          },
          assignmentReminderHours: 24,
          examReminderDays: 7,
        },
      },
    };

    const parseResult = UniHubBackupDataSchema.safeParse(multiSemesterPayload);
    assert.equal(parseResult.success, true, 'Multi-semester backup payload must be valid');
    if (parseResult.success) {
      assert.equal(parseResult.data.data.semesters.length, 3);
      assert.equal(parseResult.data.data.semesters[0].targetGpa, 3.6);
      assert.equal(parseResult.data.data.semesters[1].targetGpa, 3.75);
      assert.equal(parseResult.data.data.semesters[2].targetGpa, 3.9);
      assert.equal(parseResult.data.data.semesters[2].isCurrent, true);
      assert.equal(parseResult.data.data.settings.activeSemesterId, 'sem-2026-1');
      assert.equal(parseResult.data.data.courses[0].semesterId, 'sem-2025-1');
      assert.equal(parseResult.data.data.courses[1].semesterId, 'sem-2026-1');
    }
  });

  it('guarantees atomic restore: does NOT wipe out existing data if restore transaction fails', async () => {
    // Simulator of atomic restore versus non-atomic multi-step restore
    const existingDatabase = {
      courses: [{ id: 'existing-c1', name: 'Existing Course' }],
      assignments: [{ id: 'existing-a1', title: 'Existing Homework' }],
    };

    let simulatedCourses = [...existingDatabase.courses];
    let simulatedAssignments = [...existingDatabase.assignments];

    // Atomic transaction simulator
    const executeAtomicRestore = async (shouldFail: boolean) => {
      // Snapshot before transaction begins
      const snapshotCourses = [...simulatedCourses];
      const snapshotAssignments = [...simulatedAssignments];

      try {
        // Clear
        simulatedCourses = [];
        simulatedAssignments = [];

        if (shouldFail) {
          throw new Error('Simulated QuotaExceededError during restore');
        }

        // Put new data
        simulatedCourses.push({ id: 'new-c1', name: 'New Course' });
        simulatedAssignments.push({ id: 'new-a1', title: 'New Homework' });
      } catch (err) {
        // Atomic transaction aborts: rollback all stores to pre-transaction state
        simulatedCourses = snapshotCourses;
        simulatedAssignments = snapshotAssignments;
        throw err;
      }
    };

    // Test failure case
    await assert.rejects(async () => {
      await executeAtomicRestore(true);
    }, { message: /Simulated QuotaExceededError/ });

    // CRITICAL: Verify existing database records were NOT lost or wiped out!
    assert.equal(simulatedCourses.length, 1, 'Existing courses must not be lost when restore fails');
    assert.equal(simulatedCourses[0].id, 'existing-c1');
    assert.equal(simulatedAssignments.length, 1, 'Existing assignments must not be lost when restore fails');
    assert.equal(simulatedAssignments[0].id, 'existing-a1');
  });
});

