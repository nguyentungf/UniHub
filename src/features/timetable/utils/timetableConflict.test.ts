import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  doTimeRangesOverlap,
  doRecurrencesOverlap,
  areSlotsInConflict,
  findConflictingSlots,
  detectAllTimetableConflicts,
} from './timetableConflict.ts';
import type { TimetableSlot } from '../../../types/index.ts';

describe('Timetable Conflict Detection Business Logic', () => {
  describe('timeToMinutes', () => {
    it('converts HH:mm strings correctly to integer minutes', () => {
      assert.equal(timeToMinutes('00:00'), 0);
      assert.equal(timeToMinutes('08:30'), 510);
      assert.equal(timeToMinutes('14:45'), 885);
      assert.equal(timeToMinutes('23:59'), 1439);
    });
  });

  describe('doTimeRangesOverlap', () => {
    it('detects standard partial overlaps', () => {
      assert.equal(doTimeRangesOverlap('08:30', '10:00', '09:00', '10:30'), true);
      assert.equal(doTimeRangesOverlap('09:00', '10:30', '08:30', '10:00'), true);
    });

    it('detects total containment / subset overlaps', () => {
      assert.equal(doTimeRangesOverlap('08:00', '12:00', '09:00', '10:00'), true);
      assert.equal(doTimeRangesOverlap('09:00', '10:00', '08:00', '12:00'), true);
    });

    it('returns false for clearly separated non-overlapping ranges', () => {
      assert.equal(doTimeRangesOverlap('08:00', '09:30', '10:00', '11:30'), false);
      assert.equal(doTimeRangesOverlap('14:00', '16:00', '09:00', '11:00'), false);
    });

    it('allows back-to-back classes touching exactly at boundary without conflict', () => {
      // 08:30 to 10:00 and 10:00 to 11:30 is consecutive, NOT a clash
      assert.equal(doTimeRangesOverlap('08:30', '10:00', '10:00', '11:30'), false);
      assert.equal(doTimeRangesOverlap('10:00', '11:30', '08:30', '10:00'), false);
    });
  });

  describe('doRecurrencesOverlap', () => {
    it('returns true when at least one or both is weekly', () => {
      assert.equal(doRecurrencesOverlap('weekly', 'weekly'), true);
      assert.equal(doRecurrencesOverlap('weekly', 'biweekly_odd'), true);
      assert.equal(doRecurrencesOverlap('biweekly_even', 'weekly'), true);
    });

    it('returns false when biweekly classes are on alternating odd vs even weeks', () => {
      assert.equal(doRecurrencesOverlap('biweekly_odd', 'biweekly_even'), false);
      assert.equal(doRecurrencesOverlap('biweekly_even', 'biweekly_odd'), false);
    });

    it('returns true when both biweekly classes are on the same cycle', () => {
      assert.equal(doRecurrencesOverlap('biweekly_odd', 'biweekly_odd'), true);
      assert.equal(doRecurrencesOverlap('biweekly_even', 'biweekly_even'), true);
    });
  });

  describe('areSlotsInConflict', () => {
    const slotA: TimetableSlot = {
      id: 'slot-1',
      courseId: 'course-cs201',
      dayOfWeek: 1, // Monday
      startTime: '08:30',
      endTime: '10:00',
      location: 'Turing Hall',
      type: 'lecture',
      recurrence: 'weekly',
    };

    it('does not conflict with itself', () => {
      assert.equal(areSlotsInConflict(slotA, slotA), false);
    });

    it('does not conflict if classes are on different days of the week', () => {
      const slotTuesday: TimetableSlot = {
        ...slotA,
        id: 'slot-2',
        dayOfWeek: 2, // Tuesday
        startTime: '08:30',
        endTime: '10:00',
      };
      assert.equal(areSlotsInConflict(slotA, slotTuesday), false);
    });

    it('detects conflict when slots overlap on the same day', () => {
      const conflictingSlot: TimetableSlot = {
        id: 'slot-3',
        courseId: 'course-math205',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:30',
        location: 'Science Complex',
        type: 'lecture',
        recurrence: 'weekly',
      };
      assert.equal(areSlotsInConflict(slotA, conflictingSlot), true);
    });

    it('avoids conflict if slots alternate biweekly on the same day and time', () => {
      const oddWeekSlot: TimetableSlot = {
        ...slotA,
        id: 'slot-odd',
        recurrence: 'biweekly_odd',
      };
      const evenWeekSlot: TimetableSlot = {
        ...slotA,
        id: 'slot-even',
        courseId: 'course-cs210',
        recurrence: 'biweekly_even',
      };
      assert.equal(areSlotsInConflict(oddWeekSlot, evenWeekSlot), false);
    });
  });

  describe('detectAllTimetableConflicts', () => {
    it('returns empty array when timetable has no overlaps', () => {
      const cleanSchedule: TimetableSlot[] = [
        {
          id: 's1',
          courseId: 'c1',
          dayOfWeek: 1,
          startTime: '08:30',
          endTime: '10:00',
          location: 'Hall A',
          type: 'lecture',
          recurrence: 'weekly',
        },
        {
          id: 's2',
          courseId: 'c2',
          dayOfWeek: 1,
          startTime: '10:30',
          endTime: '12:00',
          location: 'Hall B',
          type: 'lecture',
          recurrence: 'weekly',
        },
        {
          id: 's3',
          courseId: 'c3',
          dayOfWeek: 2,
          startTime: '08:30',
          endTime: '10:00',
          location: 'Lab 1',
          type: 'lab',
          recurrence: 'weekly',
        },
      ];
      const conflicts = detectAllTimetableConflicts(cleanSchedule);
      assert.equal(conflicts.length, 0);
    });

    it('correctly reports conflicting slot pairs', () => {
      const clashingSchedule: TimetableSlot[] = [
        {
          id: 's1',
          courseId: 'c1',
          dayOfWeek: 1,
          startTime: '08:30',
          endTime: '10:00',
          location: 'Hall A',
          type: 'lecture',
          recurrence: 'weekly',
        },
        {
          id: 's2',
          courseId: 'c2',
          dayOfWeek: 1,
          startTime: '09:30', // Clashes with s1 (08:30 - 10:00)
          endTime: '11:00',
          location: 'Hall B',
          type: 'lecture',
          recurrence: 'weekly',
        },
      ];
      const conflicts = detectAllTimetableConflicts(clashingSchedule);
      assert.equal(conflicts.length, 1);
      assert.equal(conflicts[0].slotA.id, 's1');
      assert.equal(conflicts[0].slotB.id, 's2');
    });
  });
});
