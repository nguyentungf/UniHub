import type { TimetableSlot, TimetableConflict, DayOfWeek } from '@/types';

/**
 * Converts "HH:mm" 24-hour time string into total minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Checks whether two time ranges overlap.
 * Touching at boundaries (e.g. 10:00-11:00 and 11:00-12:00) is NOT an overlap.
 */
export function doTimeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const minStartA = timeToMinutes(startA);
  const minEndA = timeToMinutes(endA);
  const minStartB = timeToMinutes(startB);
  const minEndB = timeToMinutes(endB);

  return minStartA < minEndB && minEndA > minStartB;
}

/**
 * Evaluates if recurrence patterns allow an overlap.
 * Two bi-weekly classes on opposite cycles (odd vs even) never clash.
 */
export function doRecurrencesOverlap(
  recA: TimetableSlot['recurrence'] = 'weekly',
  recB: TimetableSlot['recurrence'] = 'weekly'
): boolean {
  if (
    (recA === 'biweekly_odd' && recB === 'biweekly_even') ||
    (recA === 'biweekly_even' && recB === 'biweekly_odd')
  ) {
    return false;
  }
  return true;
}

/**
 * Tests whether two timetable slots conflict with each other.
 */
export function areSlotsInConflict(
  slotA: TimetableSlot,
  slotB: TimetableSlot
): boolean {
  if (slotA.id && slotB.id && slotA.id === slotB.id) {
    return false;
  }
  if (slotA.dayOfWeek !== slotB.dayOfWeek) {
    return false;
  }
  if (!doRecurrencesOverlap(slotA.recurrence, slotB.recurrence)) {
    return false;
  }
  return doTimeRangesOverlap(
    slotA.startTime,
    slotA.endTime,
    slotB.startTime,
    slotB.endTime
  );
}

/**
 * Finds all existing slots in the list that conflict with the given candidate slot.
 */
export function findConflictingSlots(
  candidate: {
    id?: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    recurrence?: TimetableSlot['recurrence'];
  },
  existingSlots: TimetableSlot[]
): TimetableSlot[] {
  return existingSlots.filter((slot) => {
    if (candidate.id && slot.id === candidate.id) {
      return false;
    }
    if (slot.dayOfWeek !== candidate.dayOfWeek) {
      return false;
    }
    if (!doRecurrencesOverlap(candidate.recurrence || 'weekly', slot.recurrence)) {
      return false;
    }
    return doTimeRangesOverlap(
      candidate.startTime,
      candidate.endTime,
      slot.startTime,
      slot.endTime
    );
  });
}

/**
 * Detects all pairwise timetable conflicts in a schedule.
 */
export function detectAllTimetableConflicts(slots: TimetableSlot[]): TimetableConflict[] {
  const conflicts: TimetableConflict[] = [];

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const slotA = slots[i];
      const slotB = slots[j];

      if (areSlotsInConflict(slotA, slotB)) {
        conflicts.push({
          slotA,
          slotB,
          reason: `Time overlap on Day ${slotA.dayOfWeek}: ${slotA.startTime}-${slotA.endTime} and ${slotB.startTime}-${slotB.endTime}`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Helper to get English day name.
 */
export function getDayName(day: DayOfWeek): string {
  const days: Record<DayOfWeek, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
  };
  return days[day] || 'Unknown';
}
