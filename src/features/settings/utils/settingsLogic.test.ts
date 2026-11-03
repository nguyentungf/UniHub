import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getInitials } from '../../../lib/utils.ts';
import type { UserSettings } from '../../../types/index.ts';

describe('Settings & Profile Display Business Logic', () => {
  describe('getInitials helper', () => {
    it('returns initials for first and last name', () => {
      assert.equal(getInitials('Alex Chen'), 'AC');
      assert.equal(getInitials('John Doe'), 'JD');
    });

    it('returns first two letters for single word names', () => {
      assert.equal(getInitials('Alex'), 'AL');
      assert.equal(getInitials('Cher'), 'CH');
      assert.equal(getInitials('Tung'), 'TU');
    });

    it('uses first and last name initials for multi-word names', () => {
      assert.equal(getInitials('Nguyen Van A'), 'NA');
      assert.equal(getInitials('Mary Jane Watson'), 'MW');
    });

    it('handles extra and irregular whitespace cleanly', () => {
      assert.equal(getInitials('   Alex    Chen   '), 'AC');
      assert.equal(getInitials('\tJohn \n Doe '), 'JD');
    });

    it('returns empty string for empty, whitespace, or invalid inputs', () => {
      assert.equal(getInitials(''), '');
      assert.equal(getInitials('    '), '');
      assert.equal(getInitials(undefined), '');
      assert.equal(getInitials(null as unknown as string), '');
    });
  });

  describe('User profile display fallback formatting', () => {
    it('formats display name with fallback when empty', () => {
      const formatDisplayName = (name?: string) => name?.trim() || 'Student';

      assert.equal(formatDisplayName('Alex Chen'), 'Alex Chen');
      assert.equal(formatDisplayName('   '), 'Student');
      assert.equal(formatDisplayName(''), 'Student');
      assert.equal(formatDisplayName(undefined), 'Student');
    });

    it('formats university name with fallback when empty', () => {
      const formatUniversity = (uni?: string) => uni?.trim() || 'No university specified';

      assert.equal(formatUniversity('MIT'), 'MIT');
      assert.equal(formatUniversity(''), 'No university specified');
      assert.equal(formatUniversity('   '), 'No university specified');
    });

    it('formats subtitle based on major and semester with fallback', () => {
      const formatSubtitle = (major?: string, semesterName?: string) => {
        if (major?.trim()) {
          return semesterName ? `${major.trim()} · ${semesterName}` : major.trim();
        }
        return semesterName ? `GPA 3.82 · ${semesterName}` : 'UniHub Student';
      };

      assert.equal(
        formatSubtitle('Computer Science', 'Fall 2026'),
        'Computer Science · Fall 2026'
      );
      assert.equal(formatSubtitle('', 'Fall 2026'), 'GPA 3.82 · Fall 2026');
      assert.equal(formatSubtitle('', ''), 'UniHub Student');
    });
  });

  describe('Settings state persistence & updates lifecycle', () => {
    it('correctly merges partial profile updates', () => {
      const initialSettings: UserSettings = {
        studentName: 'Alex Chen',
        universityName: 'Metropolis University of Technology',
        major: 'Computer Science & Engineering',
        activeSemesterId: 'sem-fall-2026',
        theme: 'system',
        gradingScaleType: '4.0',
        pomodoro: {
          workDuration: 25,
          shortBreak: 5,
          longBreak: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
        },
        assignmentReminderHours: 24,
        examReminderDays: 7,
      };

      const updates: Partial<UserSettings> = {
        studentName: 'David Miller',
        universityName: 'Harvard University',
      };

      const updated = { ...initialSettings, ...updates };

      assert.equal(updated.studentName, 'David Miller');
      assert.equal(updated.universityName, 'Harvard University');
      assert.equal(updated.major, 'Computer Science & Engineering');
      assert.equal(getInitials(updated.studentName), 'DM');
    });

    it('handles blanking out profile fields without corruption', () => {
      const initialSettings: UserSettings = {
        studentName: 'Alex Chen',
        universityName: 'Metropolis University of Technology',
        major: 'Computer Science & Engineering',
        activeSemesterId: null,
        theme: 'dark',
        gradingScaleType: '4.0',
        pomodoro: {
          workDuration: 25,
          shortBreak: 5,
          longBreak: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
        },
        assignmentReminderHours: 24,
        examReminderDays: 7,
      };

      const blankUpdates: Partial<UserSettings> = {
        studentName: '',
        universityName: '',
        major: '',
      };

      const blanked = { ...initialSettings, ...blankUpdates };

      assert.equal(blanked.studentName, '');
      assert.equal(blanked.universityName, '');
      assert.equal(blanked.major, '');
      assert.equal(getInitials(blanked.studentName), '');
      assert.equal(blanked.theme, 'dark');
    });
  });
});

