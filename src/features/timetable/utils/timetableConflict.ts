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
 * Parses study week expressions like "2-19" or "2-9, 11-18" or "1, 3, 5-10"
 * Returns array of sorted unique week numbers.
 */
export function parseStudyWeeks(input: string): number[] {
  if (!input || !input.trim()) return [];
  const weeks = new Set<number>();
  const tokens = input.split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean);

  for (const token of tokens) {
    if (token.includes('-')) {
      const parts = token.split('-');
      if (parts.length === 2) {
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
          for (let w = start; w <= end; w++) {
            weeks.add(w);
          }
        }
      }
    } else {
      const num = parseInt(token, 10);
      if (!isNaN(num) && num > 0) {
        weeks.add(num);
      }
    }
  }

  return Array.from(weeks).sort((a, b) => a - b);
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
 * Custom/course week intervals that share no common weeks never clash.
 */
export function doRecurrencesOverlap(
  recA: TimetableSlot['recurrence'] = 'weekly',
  recB: TimetableSlot['recurrence'] = 'weekly',
  weeksAStr?: string,
  weeksBStr?: string
): boolean {
  if (
    (recA === 'biweekly_odd' && recB === 'biweekly_even') ||
    (recA === 'biweekly_even' && recB === 'biweekly_odd')
  ) {
    return false;
  }

  const parsedA = weeksAStr ? parseStudyWeeks(weeksAStr) : [];
  const parsedB = weeksBStr ? parseStudyWeeks(weeksBStr) : [];

  // If both have specific weeks defined
  if (parsedA.length > 0 && parsedB.length > 0) {
    const setB = new Set(parsedB);
    return parsedA.some((w) => setB.has(w));
  }

  // If A has specific weeks and B is biweekly
  if (parsedA.length > 0) {
    if (recB === 'biweekly_odd') return parsedA.some((w) => w % 2 === 1);
    if (recB === 'biweekly_even') return parsedA.some((w) => w % 2 === 0);
  }

  // If B has specific weeks and A is biweekly
  if (parsedB.length > 0) {
    if (recA === 'biweekly_odd') return parsedB.some((w) => w % 2 === 1);
    if (recA === 'biweekly_even') return parsedB.some((w) => w % 2 === 0);
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
  if (!doRecurrencesOverlap(slotA.recurrence, slotB.recurrence, slotA.customWeeks, slotB.customWeeks)) {
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
    customWeeks?: string;
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
    if (
      !doRecurrencesOverlap(
        candidate.recurrence || 'weekly',
        slot.recurrence,
        candidate.customWeeks,
        slot.customWeeks
      )
    ) {
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
