import React, { useState } from 'react';
import { Exam, Course } from '@/types';
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
import { Card, Button } from '@/components/ui';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar as CalendarIcon,
  GraduationCap,
} from 'lucide-react';
import { generateExamsIcs, isExamCompleted } from '../utils/examLogic';
import { downloadFile } from '@/features/assignments/utils/assignmentLogic';

interface ExamCalendarViewProps {
  exams: Exam[];
  courses: Course[];
  onSelectExam: (exam: Exam) => void;
}

export const ExamCalendarView: React.FC<ExamCalendarViewProps> = ({
  exams,
  courses,
  onSelectExam,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 10, 1)); // Default November 2026
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const resetToToday = () => setCurrentMonth(new Date());

  const handleExportIcs = () => {
    const icsContent = generateExamsIcs(exams, courses);
    downloadFile(`unihub-exams-${format(currentMonth, 'yyyy-MM')}.ics`, icsContent);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
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
            <CalendarIcon className="h-4 w-4 text-amber-500" />
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

                  // Find exams on this date
                  const dayExams = exams.filter((e) => e.examDate.startsWith(dateStr));

                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[105px] p-1.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isCurrentMonthDay
                          ? 'bg-white border-slate-200/80 dark:bg-slate-900/60 dark:border-slate-800'
                          : 'bg-slate-50/50 border-slate-100 dark:bg-slate-950/30 dark:border-slate-900/40 opacity-50'
                      } ${isTodayDate ? 'ring-2 ring-amber-500 shadow-xs' : ''}`}
                    >
                      {/* Day number */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full ${
                            isTodayDate
                              ? 'bg-amber-600 text-white font-mono'
                              : isCurrentMonthDay
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {format(cellDate, 'd')}
                        </span>
                        {dayExams.length > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <GraduationCap className="h-3 w-3" />
                            {dayExams.length}
                          </span>
                        )}
                      </div>

                      {/* Exam items */}
                      <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[80px] scrollbar-none">
                        {dayExams.map((e) => {
                          const course = courseMap.get(e.courseId);
                          const isComp = isExamCompleted(e);

                          return (
                            <button
                              key={e.id}
                              onClick={() => onSelectExam(e)}
                              className={`w-full text-left p-1.5 rounded-lg text-[10px] font-semibold leading-tight truncate flex flex-col gap-0.5 transition-all hover:scale-[1.02] ${
                                isComp
                                  ? 'bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-400'
                                  : 'bg-amber-50 text-amber-900 border border-amber-200/70 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900'
                              }`}
                              style={{
                                borderLeft: `3px solid ${course?.color || '#f59e0b'}`,
                              }}
                              title={`${course?.code ? `[${course.code}] ` : ''}${e.title} (${format(parseISO(e.examDate), 'HH:mm')})`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-mono font-bold truncate">
                                  {course?.code || 'EXAM'}
                                </span>
                                <span className="text-[9px] text-amber-700 dark:text-amber-300 font-mono">
                                  {format(parseISO(e.examDate), 'HH:mm')}
                                </span>
                              </div>
                              <span className="truncate text-[10px]">{e.title}</span>
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

