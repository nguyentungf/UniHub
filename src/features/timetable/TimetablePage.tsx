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
} from 'lucide-react';
import { PageHeader, EmptyState, LoadingState } from '@/components/common';
import { Card, Button, Badge, Modal, Select } from '@/components/ui';
import { useTimetableStore, getTodayDayOfWeek } from '@/stores/useTimetableStore';
import { useCourseStore } from '@/stores/useCourseStore';
import {
  detectAllTimetableConflicts,
  getDayName,
  timeToMinutes,
} from './utils/timetableConflict';
import { TimetableSlotModal } from './components/TimetableSlotModal';
import { SlotDetailModal } from './components/SlotDetailModal';
import { TimetableSlot, DayOfWeek } from '@/types';

const DAYS: { day: DayOfWeek; name: string; short: string }[] = [
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
  { day: 6, name: 'Saturday', short: 'Sat' },
  { day: 7, name: 'Sunday', short: 'Sun' },
];

const TIME_ROWS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

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
  const loadCourses = useCourseStore((state) => state.loadCourses);

  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<TimetableSlot | null>(null);
  const [slotToView, setSlotToView] = useState<TimetableSlot | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<TimetableSlot | null>(null);

  useEffect(() => {
    loadSlots();
    loadCourses();
  }, [loadSlots, loadCourses]);

  const todayDayOfWeek = useMemo(() => getTodayDayOfWeek(), []);

  // Conflict detection
  const allConflicts = useMemo(() => detectAllTimetableConflicts(slots), [slots]);
  const conflictingSlotIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of allConflicts) {
      set.add(c.slotA.id);
      set.add(c.slotB.id);
    }
    return set;
  }, [allConflicts]);

  // Filtered slots
  const filteredSlots = useMemo(() => {
    if (selectedCourseFilter === 'all') return slots;
    return slots.filter((s) => s.courseId === selectedCourseFilter);
  }, [slots, selectedCourseFilter]);

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
        title="Weekly Timetable"
        subtitle="Interactive schedule grid, room directions, conflict collision check, and daily agenda"
        badge={
          allConflicts.length === 0 ? (
            <Badge variant="emerald" dot>
              Schedule Clash-Free
            </Badge>
          ) : (
            <Badge variant="rose" dot>
              {allConflicts.length} Conflict(s) Detected
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher: Weekly Grid vs Daily Agenda */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-medium">
              <button
                onClick={() => setViewMode('week')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  viewMode === 'week'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Weekly Grid
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`rounded-lg px-3 py-1 transition-all ${
                  viewMode === 'agenda'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Daily Agenda
              </button>
            </div>

            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Class Slot
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
              <span>Timetable Scheduling Conflicts Detected ({allConflicts.length})</span>
            </div>
            <span className="text-[11px] font-semibold underline cursor-pointer" onClick={() => setViewMode('agenda')}>
              Review Conflicts →
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">
            The following scheduled class sessions overlap in time on the same day:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {allConflicts.map((c, i) => {
              const courseA = courses.find((course) => course.id === c.slotA.courseId);
              const courseB = courses.find((course) => course.id === c.slotB.courseId);
              return (
                <div key={i} className="p-2 rounded-xl bg-white/80 dark:bg-navy-900/60 border border-rose-200 dark:border-rose-900 text-[11px]">
                  <span className="font-bold">{getDayName(c.slotA.dayOfWeek)}: </span>
                  <span className="font-semibold text-rose-700 dark:text-rose-300">
                    {courseA?.code} ({c.slotA.startTime}-{c.slotA.endTime})
                  </span>{' '}
                  clashes with{' '}
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
              Schedule Clash-Free: All {slots.length} class slots verified with zero time collisions.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            {slots.length} Slots Scheduled
          </span>
        </div>
      )}

      {/* Course Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCourseFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all select-none whitespace-nowrap ${
              selectedCourseFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All Courses ({slots.length})
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
      </div>

      {/* VIEW MODE 1: WEEKLY CALENDAR GRID (Monday - Sunday) */}
      {viewMode === 'week' ? (
        <Card className="overflow-x-auto shadow-sm">
          <div className="min-w-[850px] p-4">
            {/* 7 Days Header (Monday to Sunday) + Time column */}
            <div className="grid grid-cols-8 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="text-left text-slate-400 font-normal pl-1">Time</div>
              {DAYS.map((d) => {
                const isToday = d.day === todayDayOfWeek;
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
                          TODAY
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">{d.name}</span>
                  </div>
                );
              })}
            </div>

            {/* Time Slot Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {TIME_ROWS.map((time) => {
                const currentHour = parseInt(time.split(':')[0], 10);

                return (
                  <div key={time} className="grid grid-cols-8 gap-2 py-2 min-h-[80px]">
                    {/* Time Label */}
                    <div className="text-xs font-mono text-slate-400 pt-1 pl-1">
                      {time}
                    </div>

                    {/* 7 Day Columns (Monday to Sunday) */}
                    {DAYS.map((d) => {
                      const isToday = d.day === todayDayOfWeek;

                      // Match slots on this day whose start time matches or falls into this hour
                      const matchingSlots = filteredSlots.filter((slot) => {
                        if (slot.dayOfWeek !== d.day) return false;
                        const slotStartHour = parseInt(slot.startTime.split(':')[0], 10);
                        return slotStartHour === currentHour;
                      });

                      return (
                        <div
                          key={d.day}
                          className={`h-full flex flex-col gap-1.5 p-1 rounded-xl transition-colors ${
                            isToday ? 'bg-brand-50/20 dark:bg-brand-950/10' : ''
                          }`}
                        >
                          {matchingSlots.map((slot) => {
                            const course = courses.find((c) => c.id === slot.courseId);
                            const hasConflict = conflictingSlotIds.has(slot.id);

                            return (
                              <div
                                key={slot.id}
                                onClick={() => setSlotToView(slot)}
                                className={`group relative rounded-xl p-2.5 text-white shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer hover:scale-[1.02] border ${
                                  hasConflict
                                    ? 'border-rose-400 ring-2 ring-rose-500 animate-pulse'
                                    : 'border-transparent'
                                }`}
                                style={{ backgroundColor: course?.color || '#3b82f6' }}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-extrabold text-xs tracking-tight">
                                    {course?.code}
                                  </span>
                                  {hasConflict ? (
                                    <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-rose-600 text-white shadow-xs">
                                      CLASH
                                    </span>
                                  ) : (
                                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-black/25">
                                      {slot.type}
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] font-semibold truncate mt-1 opacity-95">
                                  {course?.name}
                                </p>

                                <div className="flex items-center gap-1 text-[10px] opacity-90 mt-1">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  <span>
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 text-[10px] opacity-85 mt-0.5 truncate">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {slot.room ? `${slot.room} · ` : ''}
                                    {slot.location}
                                  </span>
                                </div>

                                {(slot.instructor || course?.instructor) && (
                                  <div className="flex items-center gap-1 text-[9px] opacity-80 mt-0.5 truncate">
                                    <User className="h-2.5 w-2.5 shrink-0" />
                                    <span className="truncate">
                                      {slot.instructor || course?.instructor}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
                      TODAY
                    </span>
                  )}
                  <span className="block text-[11px] uppercase opacity-80">{d.short}</span>
                  <span className="text-base font-extrabold">{d.name}</span>
                  <span className="text-[10px] block opacity-75 mt-0.5">
                    {daySlotCount} Classes
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
                title={`No Classes on ${getDayName(selectedDay)}`}
                description="You have no classes scheduled on this day. Use this time for independent study or add a new seminar."
                actionLabel="Schedule Session on This Day"
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
                        {/* Time box */}
                        <div className="flex flex-col items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-center min-w-[76px] shrink-0">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {slot.startTime}
                          </span>
                          <span className="text-[10px] text-slate-400">to {slot.endTime}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {course?.code} · {course?.name}
                            </span>
                            <Badge variant="brand" size="sm">
                              {slot.type.toUpperCase()}
                            </Badge>
                            {hasConflict && (
                              <Badge variant="rose" size="sm" dot>
                                Scheduling Conflict
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span>{slot.room ? `${slot.room} · ` : ''}{slot.location}</span>
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
                        <Badge variant="outline" size="sm" className="capitalize">
                          {slot.recurrence.replace('_', ' ')}
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
        title="Delete Class Session"
        description="Are you sure you want to remove this session from your timetable?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            This will permanently remove the class session on{' '}
            <strong>
              {slotToDelete ? getDayName(slotToDelete.dayOfWeek) : ''} ({slotToDelete?.startTime} - {slotToDelete?.endTime})
            </strong>{' '}
            from your weekly timetable.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSlotToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Delete Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
