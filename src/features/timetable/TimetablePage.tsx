import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageHeader, EmptyState, LoadingState } from '@/components/common';
import { Card, Button, Badge, Modal, Select } from '@/components/ui';
import { useTimetableStore, getTodayDayOfWeek } from '@/stores/useTimetableStore';
import { useCourseStore } from '@/stores/useCourseStore';
import {
  detectAllTimetableConflicts,
  getDayName,
  timeToMinutes,
  parseStudyWeeks,
} from './utils/timetableConflict';
import { TimetableSlotModal } from './components/TimetableSlotModal';
import { SlotDetailModal } from './components/SlotDetailModal';
import { TimetableSlot, DayOfWeek, Course } from '@/types';

const DAYS: { day: DayOfWeek; name: string; short: string }[] = [
  { day: 1, name: 'Thứ Hai', short: 'T2' },
  { day: 2, name: 'Thứ Ba', short: 'T3' },
  { day: 3, name: 'Thứ Tư', short: 'T4' },
  { day: 4, name: 'Thứ Năm', short: 'T5' },
  { day: 5, name: 'Thứ Sáu', short: 'T6' },
  { day: 6, name: 'Thứ Bảy', short: 'T7' },
  { day: 7, name: 'Chủ Nhật', short: 'CN' },
];

const getDayNameVi = (day: DayOfWeek): string => {
  const map: Record<DayOfWeek, string> = {
    1: 'Thứ Hai',
    2: 'Thứ Ba',
    3: 'Thứ Tư',
    4: 'Thứ Năm',
    5: 'Thứ Sáu',
    6: 'Thứ Bảy',
    7: 'Chủ Nhật',
  };
  return map[day] || `Thứ ${day}`;
};

const getSlotTypeVi = (type: TimetableSlot['type']): string => {
  const map: Record<TimetableSlot['type'], string> = {
    lecture: 'Lý thuyết',
    lab: 'Thực hành',
    tutorial: 'Bài tập',
    seminar: 'Chuyên đề',
  };
  return map[type] || type;
};

const getRecurrenceLabel = (slot: TimetableSlot, course?: Course): string => {
  if (slot.recurrence === 'course_weeks') {
    const w = slot.customWeeks || course?.studyWeeks || '2-19';
    return `Tuần ${w}`;
  }
  if (slot.recurrence === 'custom') {
    return `Tuần ${slot.customWeeks || 'Tùy chỉnh'}`;
  }
  const map: Record<string, string> = {
    weekly: 'Hàng tuần',
    biweekly_odd: 'Tuần lẻ',
    biweekly_even: 'Tuần chẵn',
  };
  return map[slot.recurrence] || slot.recurrence;
};

// 24-Hour Timeline Configuration (covering 06:45 - 17:30 standard university curriculum and ca tối)
const TIMELINE_START_HOUR = 6;  // 06:00 (360 mins)
const TIMELINE_END_HOUR = 21;    // 21:00 (1260 mins)
const HOUR_HEIGHT = 68;          // Pixels per 60 minutes
const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
const TOTAL_TIMELINE_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT; // 1020px

// Generate 24-hour markers: 06:00, 07:00, ..., 21:00
const TIMELINE_HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = TIMELINE_START_HOUR + i;
  return `${h < 10 ? '0' : ''}${h}:00`;
});

interface LayoutSlot {
  slot: TimetableSlot;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
}

/**
 * Computes exact proportional positioning and handles overlapping column clusters
 */
function computeDayLayout(daySlots: TimetableSlot[]): LayoutSlot[] {
  if (daySlots.length === 0) return [];

  // Sort by start time, then duration desc
  const sorted = [...daySlots].sort((a, b) => {
    const diff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (diff !== 0) return diff;
    return timeToMinutes(b.endTime) - timeToMinutes(a.endTime);
  });

  // Group into overlapping clusters
  const clusters: TimetableSlot[][] = [];
  let currentCluster: TimetableSlot[] = [];
  let clusterEnd = -1;

  for (const slot of sorted) {
    const sMin = timeToMinutes(slot.startTime);
    const eMin = timeToMinutes(slot.endTime);

    if (currentCluster.length === 0) {
      currentCluster.push(slot);
      clusterEnd = eMin;
    } else if (sMin < clusterEnd) {
      currentCluster.push(slot);
      clusterEnd = Math.max(clusterEnd, eMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [slot];
      clusterEnd = eMin;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: LayoutSlot[] = [];
  for (const cluster of clusters) {
    if (cluster.length === 1) {
      const s = cluster[0];
      const sMin = timeToMinutes(s.startTime);
      const eMin = timeToMinutes(s.endTime);
      const top = ((sMin - TIMELINE_START_HOUR * 60) / 60) * HOUR_HEIGHT;
      const height = Math.max(34, ((eMin - sMin) / 60) * HOUR_HEIGHT);
      result.push({ slot: s, top, height, leftPercent: 0, widthPercent: 100 });
      continue;
    }

    // Distribute slots in columns within cluster
    const columns: TimetableSlot[][] = [];
    for (const slot of cluster) {
      const sMin = timeToMinutes(slot.startTime);
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastInCol = columns[c][columns[c].length - 1];
        if (timeToMinutes(lastInCol.endTime) <= sMin) {
          columns[c].push(slot);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([slot]);
      }
    }

    const totalCols = columns.length;
    const colWidth = 100 / totalCols;

    for (let c = 0; c < totalCols; c++) {
      for (const slot of columns[c]) {
        const sMin = timeToMinutes(slot.startTime);
        const eMin = timeToMinutes(slot.endTime);
        const top = ((sMin - TIMELINE_START_HOUR * 60) / 60) * HOUR_HEIGHT;
        const height = Math.max(34, ((eMin - sMin) / 60) * HOUR_HEIGHT);
        result.push({
          slot,
          top,
          height,
          leftPercent: c * colWidth,
          widthPercent: colWidth - 1,
        });
      }
    }
  }

  return result;
}

/**
 * Computes estimated semester week from start date
 */
function computeCurrentAcademicWeek(startDateStr?: string): number {
  if (!startDateStr) return 1;
  const start = new Date(startDateStr);
  const now = new Date();
  if (isNaN(start.getTime())) return 1;
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(25, weekNum));
}

export const TimetablePage: React.FC = () => {
  const slots = useTimetableStore((state) => state.slots);
  const isLoading = useTimetableStore((state) => state.isLoading);
  const error = useTimetableStore((state) => state.error);
  const viewMode = useTimetableStore((state) => state.viewMode);
  const selectedDay = useTimetableStore((state) => state.selectedDay);
  const loadSlots = useTimetableStore((state) => state.loadSlots);
  const setViewMode = useTimetableStore((state) => state.setViewMode);
  const setSelectedDay = useTimetableStore((state) => state.setSelectedDay);
  const addSlot = useTimetableStore((state) => state.addSlot);
  const updateSlot = useTimetableStore((state) => state.updateSlot);
  const deleteSlot = useTimetableStore((state) => state.deleteSlot);

  const courses = useCourseStore((state) => state.courses);
  const semesters = useCourseStore((state) => state.semesters);
  const loadCourses = useCourseStore((state) => state.loadCourses);

  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('all'); // 'all' or '1', '2', ...
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<TimetableSlot | null>(null);
  const [slotToView, setSlotToView] = useState<TimetableSlot | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<TimetableSlot | null>(null);

  useEffect(() => {
    loadSlots();
    loadCourses();
  }, [loadSlots, loadCourses]);

  const todayDayOfWeek = useMemo(() => getTodayDayOfWeek(), []);

  // Compute current semester and current academic week
  const currentSemester = useMemo(
    () => semesters.find((s) => s.isCurrent) || semesters[0],
    [semesters]
  );
  const currentAcademicWeek = useMemo(
    () => computeCurrentAcademicWeek(currentSemester?.startDate),
    [currentSemester]
  );

  // Real-time conflict detection across all registered slots
  const allConflicts = useMemo(() => detectAllTimetableConflicts(slots), [slots]);
  const conflictingSlotIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of allConflicts) {
      set.add(c.slotA.id);
      set.add(c.slotB.id);
    }
    return set;
  }, [allConflicts]);

  // Recurrence & Week filtering logic
  const isSlotActiveInWeek = (slot: TimetableSlot, weekNum: number): boolean => {
    if (slot.recurrence === 'weekly') return true;
    if (slot.recurrence === 'biweekly_odd') return weekNum % 2 === 1;
    if (slot.recurrence === 'biweekly_even') return weekNum % 2 === 0;

    const course = courses.find((c) => c.id === slot.courseId);
    if (slot.recurrence === 'course_weeks') {
      const weeksStr = slot.customWeeks || course?.studyWeeks || '';
      const parsed = parseStudyWeeks(weeksStr);
      return parsed.length === 0 || parsed.includes(weekNum);
    }
    if (slot.recurrence === 'custom') {
      const parsed = parseStudyWeeks(slot.customWeeks || '');
      return parsed.length === 0 || parsed.includes(weekNum);
    }
    return true;
  };

  // Filtered slots according to course selection AND week selection
  const filteredSlots = useMemo(() => {
    let result = slots;

    // Course filter
    if (selectedCourseFilter !== 'all') {
      result = result.filter((s) => s.courseId === selectedCourseFilter);
    }

    // Week filter (Tuần học)
    if (selectedWeekFilter !== 'all') {
      const weekNum = parseInt(selectedWeekFilter, 10);
      if (!isNaN(weekNum)) {
        result = result.filter((s) => isSlotActiveInWeek(s, weekNum));
      }
    }

    return result;
  }, [slots, selectedCourseFilter, selectedWeekFilter, courses]);

  // Current time indicator line calculation
  const now = new Date();
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
  const isNowWithinTimeline =
    currentMinutesFromMidnight >= TIMELINE_START_HOUR * 60 &&
    currentMinutesFromMidnight <= TIMELINE_END_HOUR * 60;
  const currentNowTop = isNowWithinTimeline
    ? ((currentMinutesFromMidnight - TIMELINE_START_HOUR * 60) / 60) * HOUR_HEIGHT
    : null;

  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return;
    try {
      await deleteSlot(slotToDelete.id);
      setSlotToDelete(null);
    } catch (err) {
      console.error('Delete slot failed:', err);
    }
  };

  if (isLoading && slots.length === 0) {
    return <LoadingState rows={4} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thời khóa biểu tuần"
        subtitle="Lịch học trực quan dạng lưới, chuẩn ca học 06:45 - 17:30, thang 24h & lặp theo tuần đăng ký"
        badge={
          allConflicts.length === 0 ? (
            <Badge variant="emerald" dot>
              Lịch học thông suốt (Không trùng giờ)
            </Badge>
          ) : (
            <Badge variant="rose" dot>
              Phát hiện {allConflicts.length} xung đột lịch
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-medium">
              <button
                onClick={() => setViewMode('week')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  viewMode === 'week'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Lưới theo tuần (24h)
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  viewMode === 'agenda'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Lịch trình ngày
              </button>
            </div>

            {/* Week Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <CalendarIcon className="h-3.5 w-3.5 text-brand-500 shrink-0" />
              <select
                value={selectedWeekFilter}
                onChange={(e) => setSelectedWeekFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả các tuần (Tổng quan)</option>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={String(w)}>
                    Tuần {w} {w === currentAcademicWeek ? '(Tuần hiện tại)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSlotToEdit(null);
                setIsAddModalOpen(true);
              }}
            >
              Thêm tiết học
            </Button>
          </div>
        }
      />

      {/* Conflict Alert Banner / Verified Status */}
      {allConflicts.length > 0 ? (
        <div className="p-4 rounded-2xl border border-rose-300 bg-rose-50/80 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 text-xs space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Phát hiện xung đột thời khóa biểu ({allConflicts.length})</span>
            </div>
            <span
              className="text-[11px] font-semibold underline cursor-pointer"
              onClick={() => setViewMode('agenda')}
            >
              Xem chi tiết xung đột →
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Các tiết học sau đây bị trùng khung giờ trong cùng ngày và cùng tuần học:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {allConflicts.map((c, i) => {
              const courseA = courses.find((course) => course.id === c.slotA.courseId);
              const courseB = courses.find((course) => course.id === c.slotB.courseId);
              return (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900 text-[11px]"
                >
                  <span className="font-bold">{getDayNameVi(c.slotA.dayOfWeek)}: </span>
                  <span className="font-semibold text-rose-700 dark:text-rose-300">
                    {courseA?.code} ({c.slotA.startTime}-{c.slotA.endTime})
                  </span>{' '}
                  trùng với{' '}
                  <span className="font-semibold text-rose-700 dark:text-rose-300">
                    {courseB?.code} ({c.slotB.startTime}-{c.slotB.endTime})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium text-emerald-900 dark:text-emerald-200">
              Lịch học thông suốt: Tất cả {slots.length} tiết học đã được xác minh không trùng giờ.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              {filteredSlots.length} tiết hiển thị
            </span>
            {selectedWeekFilter !== 'all' && (
              <Badge variant="brand" size="sm">
                Đang lọc: Tuần {selectedWeekFilter}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar: Course selection chips */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCourseFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none whitespace-nowrap ${
              selectedCourseFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Tất cả môn học ({slots.length})
          </button>
          {courses.map((course) => {
            const count = slots.filter((s) => s.courseId === course.id).length;
            const isSelected = selectedCourseFilter === course.id;
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourseFilter(course.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: course.color }} />
                <span>{course.code}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Standard Program Legend Pill */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <Clock className="h-3 w-3 text-brand-500" />
          <span>Khung giờ chính khóa: <strong>06:45 - 17:30</strong> (Thang 24h)</span>
        </div>
      </div>

      {/* VIEW MODE 1: PROPORTIONAL WEEKLY CALENDAR GRID (Thang 24h, 06:45 - 17:30 tiêu chuẩn) */}
      {viewMode === 'week' ? (
        <Card className="overflow-x-auto shadow-sm p-0 border border-slate-200/90 dark:border-slate-800">
          <div className="min-w-[940px] p-4">
            {/* Header: Time label + 7 Day headers (Monday to Sunday) */}
            <div className="grid grid-cols-8 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="text-left text-slate-400 font-normal pl-2 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Giờ (24h)</span>
              </div>
              {DAYS.map((d) => {
                const isToday = d.day === todayDayOfWeek;
                const daySlotCount = filteredSlots.filter((s) => s.dayOfWeek === d.day).length;

                return (
                  <div
                    key={d.day}
                    className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
                      isToday
                        ? 'bg-brand-50 border border-brand-200/80 dark:bg-brand-950/40 dark:border-brand-900/60'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className={isToday ? 'text-brand-600 dark:text-brand-400 font-extrabold' : ''}>
                        {d.short}
                      </span>
                      {isToday && (
                        <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-brand-600 text-white shadow-xs">
                          HÔM NAY
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {d.name} {daySlotCount > 0 && `(${daySlotCount})`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Timeline Layout Area (06:00 to 21:00) */}
            <div className="relative grid grid-cols-8 gap-2 pt-2" style={{ height: `${TOTAL_TIMELINE_HEIGHT}px` }}>
              {/* Left Column: 24h Time Labels */}
              <div className="relative select-none pr-2">
                {TIMELINE_HOURS.map((hourStr, i) => {
                  const top = i * HOUR_HEIGHT;
                  const isCurriculumHour =
                    hourStr >= '06:00' && hourStr <= '17:00';

                  return (
                    <div
                      key={hourStr}
                      className="absolute left-0 text-xs font-mono -translate-y-2 flex items-center gap-1"
                      style={{ top: `${top}px` }}
                    >
                      <span
                        className={`font-semibold ${
                          isCurriculumHour
                            ? 'text-slate-600 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {hourStr}
                      </span>
                    </div>
                  );
                })}

                {/* Standard Period Highlight Indicator on Side */}
                <div
                  className="absolute left-0 w-1 rounded-full bg-brand-500/80"
                  style={{
                    top: `${((45 / 60)) * HOUR_HEIGHT}px`, // 06:45
                    height: `${(( (17 * 60 + 30) - (6 * 60 + 45) ) / 60) * HOUR_HEIGHT}px`, // to 17:30
                  }}
                  title="Khung giờ học chính khóa tiêu chuẩn: 06:45 - 17:30"
                />
              </div>

              {/* 7 Columns: Days (Monday to Sunday) */}
              {DAYS.map((d) => {
                const isToday = d.day === todayDayOfWeek;
                const daySlots = filteredSlots.filter((slot) => slot.dayOfWeek === d.day);
                const layoutSlots = computeDayLayout(daySlots);

                return (
                  <div
                    key={d.day}
                    className={`relative rounded-xl border-l border-slate-100 dark:border-slate-800/80 transition-colors ${
                      isToday ? 'bg-brand-50/[0.15] dark:bg-brand-950/[0.08]' : ''
                    }`}
                  >
                    {/* Hourly horizontal background grid lines */}
                    {TIMELINE_HOURS.map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 border-t border-slate-100 dark:border-slate-800/60 pointer-events-none"
                        style={{ top: `${i * HOUR_HEIGHT}px` }}
                      />
                    ))}

                    {/* Standard period boundaries: 06:45 and 17:30 subtle dashed lines */}
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-brand-300/40 dark:border-brand-700/30 pointer-events-none"
                      style={{ top: `${((45 / 60)) * HOUR_HEIGHT}px` }}
                      title="06:45 - Bắt đầu tiết 1"
                    />
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-brand-300/40 dark:border-brand-700/30 pointer-events-none"
                      style={{ top: `${(((17 - 6) * 60 + 30) / 60) * HOUR_HEIGHT}px` }}
                      title="17:30 - Kết thúc tiết 12"
                    />

                    {/* Today's current time line indicator */}
                    {isToday && currentNowTop !== null && (
                      <div
                        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                        style={{ top: `${currentNowTop}px` }}
                      >
                        <div className="h-2 w-2 rounded-full bg-rose-500 shadow-xs -ml-1" />
                        <div className="flex-1 h-0.5 bg-rose-500 shadow-xs" />
                      </div>
                    )}

                    {/* Rendered Proportional Slots ("đúng giờ, đúng tỉ lệ box") */}
                    {layoutSlots.map(({ slot, top, height, leftPercent, widthPercent }) => {
                      const course = courses.find((c) => c.id === slot.courseId);
                      const hasConflict = conflictingSlotIds.has(slot.id);
                      const recLabel = getRecurrenceLabel(slot, course);

                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSlotToView(slot)}
                          className={`group absolute rounded-xl p-2 text-white shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer hover:scale-[1.02] border z-10 overflow-hidden flex flex-col justify-between ${
                            hasConflict
                              ? 'border-rose-400 ring-2 ring-rose-500 animate-pulse'
                              : 'border-white/20 dark:border-black/20'
                          }`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            backgroundColor: course?.color || '#3b82f6',
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-xs tracking-tight leading-none truncate">
                                {course?.code}
                              </span>
                              {hasConflict ? (
                                <span className="text-[8px] uppercase font-black px-1 py-0.2 rounded bg-rose-600 text-white shrink-0">
                                  TRÙNG
                                </span>
                              ) : (
                                <span className="text-[8px] uppercase font-bold px-1 py-0.2 rounded bg-black/25 shrink-0">
                                  {getSlotTypeVi(slot.type)}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] font-bold truncate mt-1 leading-tight opacity-95">
                              {course?.name}
                            </p>
                          </div>

                          <div className="space-y-0.5 mt-auto pt-1">
                            <div className="flex items-center gap-1 text-[10px] font-semibold opacity-95">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span className="font-mono">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[9.5px] opacity-90 truncate">
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">
                                {slot.room ? `${slot.room} · ` : ''}
                                {slot.location}
                              </span>
                            </div>

                            {/* Recurrence Chip */}
                            <div className="pt-0.5">
                              <span className="inline-block text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-white/20 text-white backdrop-blur-xs truncate max-w-full">
                                {recLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        /* VIEW MODE 2: DAILY AGENDA VIEW */
        <div className="space-y-4">
          {/* Day selection tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {DAYS.map((d) => {
              const isToday = d.day === todayDayOfWeek;
              const isSelected = selectedDay === d.day;
              const daySlotCount = filteredSlots.filter((s) => s.dayOfWeek === d.day).length;

              return (
                <button
                  key={d.day}
                  onClick={() => setSelectedDay(d.day)}
                  className={`flex-1 min-w-[90px] rounded-2xl p-3 text-center transition-all select-none relative ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 font-bold'
                      : isToday
                      ? 'bg-brand-50 border-2 border-brand-300 text-brand-900 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-200'
                      : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                  }`}
                >
                  {isToday && (
                    <span className="absolute top-1 right-1 text-[8px] font-black uppercase px-1 rounded bg-brand-500 text-white">
                      HÔM NAY
                    </span>
                  )}
                  <span className="block text-[11px] uppercase opacity-80">{d.short}</span>
                  <span className="text-base font-extrabold">{d.name}</span>
                  <span className="text-[10px] block opacity-75 mt-0.5">
                    {daySlotCount} tiết học
                  </span>
                </button>
              );
            })}
          </div>

          {/* Agenda items for selected day */}
          <div className="space-y-3">
            {filteredSlots.filter((s) => s.dayOfWeek === selectedDay).length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title={`Không có tiết học vào ${getDayNameVi(selectedDay)}`}
                description="Bạn không có lịch học nào trong ngày này theo bộ lọc hiện tại. Hãy tận dụng thời gian để tự học hoặc thêm tiết học mới."
                actionLabel="Xếp lịch tiết học cho ngày này"
                onAction={() => {
                  setSlotToEdit(null);
                  setIsAddModalOpen(true);
                }}
              />
            ) : (
              filteredSlots
                .filter((s) => s.dayOfWeek === selectedDay)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((slot) => {
                  const course = courses.find((c) => c.id === slot.courseId);
                  const hasConflict = conflictingSlotIds.has(slot.id);
                  const recLabel = getRecurrenceLabel(slot, course);

                  return (
                    <Card
                      key={slot.id}
                      hoverEffect
                      onClick={() => setSlotToView(slot)}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 cursor-pointer transition-all ${
                        hasConflict ? 'ring-2 ring-rose-400 bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                      style={{ borderLeftColor: course?.color || '#4f46e5' }}
                    >
                      <div className="flex items-start gap-4">
                        {/* 24-Hour Time Box */}
                        <div className="flex flex-col items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-center min-w-[84px] shrink-0">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                            {slot.startTime}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            đến {slot.endTime}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {course?.code} · {course?.name}
                            </span>
                            <Badge variant="brand" size="sm">
                              {getSlotTypeVi(slot.type)}
                            </Badge>
                            {hasConflict && (
                              <Badge variant="rose" size="sm" dot>
                                Trùng lịch học
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span>
                                {slot.room ? `${slot.room} · ` : ''}
                                {slot.location}
                              </span>
                            </div>
                            {(slot.instructor || course?.instructor) && (
                              <div className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                <span>{slot.instructor || course?.instructor}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Badge variant="outline" size="sm" className="font-semibold">
                          {recLabel}
                        </Badge>
                      </div>
                    </Card>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Class Slot Modal */}
      <TimetableSlotModal
        isOpen={isAddModalOpen || !!slotToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setSlotToEdit(null);
        }}
        initialData={slotToEdit}
        courses={courses}
        existingSlots={slots}
        defaultDay={selectedDay}
        onSubmit={async (slotData) => {
          if (slotToEdit) {
            await updateSlot(slotToEdit.id, slotData);
          } else {
            await addSlot(slotData);
          }
        }}
      />

      {/* Slot Details Modal */}
      <SlotDetailModal
        slot={slotToView}
        course={courses.find((c) => c.id === slotToView?.courseId)}
        isOpen={!!slotToView}
        onClose={() => setSlotToView(null)}
        onEdit={(slot) => {
          setSlotToView(null);
          setSlotToEdit(slot);
        }}
        onDelete={(slot) => {
          setSlotToView(null);
          setSlotToDelete(slot);
        }}
      />

      {/* Delete Slot Confirmation Modal */}
      <Modal
        isOpen={!!slotToDelete}
        onClose={() => setSlotToDelete(null)}
        title="Xóa tiết học"
        description="Bạn có chắc chắn muốn xóa tiết học này khỏi thời khóa biểu?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Hành động này sẽ xóa vĩnh viễn tiết học vào{' '}
            <strong>
              {slotToDelete ? getDayNameVi(slotToDelete.dayOfWeek) : ''} (
              {slotToDelete?.startTime} - {slotToDelete?.endTime})
            </strong>{' '}
            khỏi thời khóa biểu của bạn.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSlotToDelete(null)}>
              Hủy
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Xóa tiết học
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
