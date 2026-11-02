import React, { useState } from 'react';
import { Assignment, Course } from '@/types';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
} from 'date-fns';
import { Card, Button, Badge } from '@/components/ui';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar as CalendarIcon,
  AlertTriangle,
} from 'lucide-react';
import {
  generateAssignmentsIcs,
  downloadFile,
  isAssignmentOverdue,
  isAssignmentCompleted,
} from '../utils/assignmentLogic';

interface AssignmentCalendarViewProps {
  assignments: Assignment[];
  courses: Course[];
  onSelectAssignment: (assignment: Assignment) => void;
}

export const AssignmentCalendarView: React.FC<AssignmentCalendarViewProps> = ({
  assignments,
  courses,
  onSelectAssignment,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 10, 1)); // Default November 2026
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const resetToToday = () => setCurrentMonth(new Date());

  const handleExportIcs = () => {
    const icsContent = generateAssignmentsIcs(assignments, courses);
    downloadFile(`unihub-assignments-${format(currentMonth, 'yyyy-MM')}.ics`, icsContent);
  };

  // Calendar dates generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rows: Date[][] = [];
  let days: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-brand-500" />
            <span>{format(currentMonth, 'MMMM yyyy')}</span>
          </h3>
          <Button size="xs" variant="outline" onClick={resetToToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button
            size="xs"
            variant="outline"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={handleExportIcs}
            title="Download iCalendar file for Google Calendar or Apple Calendar"
          >
            Export .ICS
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekDayNames.map((name, idx) => (
              <div
                key={name}
                className={`py-1.5 text-xs font-bold uppercase tracking-wider ${
                  idx >= 5
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="space-y-1">
            {rows.map((row, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-7 gap-1">
                {row.map((cellDate) => {
                  const isCurrentMonthDay = isSameMonth(cellDate, currentMonth);
                  const isTodayDate = isSameDay(cellDate, new Date());
                  const dateStr = format(cellDate, 'yyyy-MM-dd');

                  // Find assignments on this date
                  const dayAssignments = assignments.filter((a) => a.dueDate.startsWith(dateStr));

                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[96px] p-1.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isCurrentMonthDay
                          ? 'bg-white border-slate-200/80 dark:bg-slate-900/60 dark:border-slate-800'
                          : 'bg-slate-50/50 border-slate-100 dark:bg-slate-950/30 dark:border-slate-900/40 opacity-50'
                      } ${isTodayDate ? 'ring-2 ring-brand-500 shadow-xs' : ''}`}
                    >
                      {/* Day number */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full ${
                            isTodayDate
                              ? 'bg-brand-600 text-white font-mono'
                              : isCurrentMonthDay
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {format(cellDate, 'd')}
                        </span>
                        {dayAssignments.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {dayAssignments.length}
                          </span>
                        )}
                      </div>

                      {/* Assignment items */}
                      <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[75px] scrollbar-none">
                        {dayAssignments.map((a) => {
                          const course = courseMap.get(a.courseId);
                          const isComp = isAssignmentCompleted(a.status);
                          const isOver = isAssignmentOverdue(a);

                          return (
                            <button
                              key={a.id}
                              onClick={() => onSelectAssignment(a)}
                              className={`w-full text-left p-1 rounded-md text-[10px] font-medium leading-tight truncate flex items-center gap-1 transition-all hover:scale-[1.02] ${
                                isComp
                                  ? 'bg-emerald-50 text-emerald-700 line-through dark:bg-emerald-950/50 dark:text-emerald-300'
                                  : isOver
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
                                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
                              }`}
                              style={{
                                borderLeft: `3px solid ${course?.color || '#3b82f6'}`,
                              }}
                              title={`${course?.code ? `[${course.code}] ` : ''}${a.title} (${format(parseISO(a.dueDate), 'HH:mm')})`}
                            >
                              {isOver && !isComp && (
                                <AlertTriangle className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                              )}
                              <span className="truncate">{a.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

