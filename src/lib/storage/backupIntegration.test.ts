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
});

