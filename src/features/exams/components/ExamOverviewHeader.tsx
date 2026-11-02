import React from 'react';
import { ExamOverviewStats } from '../utils/examLogic';
import { Card } from '@/components/ui';
import { GraduationCap, Calendar, Clock, CheckCircle2, Percent, AlertCircle } from 'lucide-react';

interface ExamOverviewHeaderProps {
  stats: ExamOverviewStats;
}

export const ExamOverviewHeader: React.FC<ExamOverviewHeaderProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Upcoming Exams */}
      <Card className="p-4 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/10 border-amber-200/70 dark:border-amber-900/50">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Upcoming Exams
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <GraduationCap className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.upcomingCount}
          </span>
          <span className="text-xs text-slate-400">
            of {stats.totalExams} scheduled
          </span>
        </div>
        <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 font-medium truncate">
          {stats.completedCount} exams completed
        </p>
      </Card>

      {/* 2. Nearest Exam Countdown */}
      <Card className="p-4 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Next Countdown
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.nearestExamDays !== null
              ? stats.nearestExamDays === 0
                ? 'Today!'
                : `${stats.nearestExamDays}d`
              : 'None'}
          </span>
          <span className="text-xs text-slate-400">
            {stats.nearestExamDays !== null && stats.nearestExamDays > 0 ? 'remaining' : ''}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 truncate">
          {stats.nearestExamDays !== null
            ? stats.nearestExamDays <= 3
              ? 'Urgent preparation needed'
              : 'Adequate revision time'
            : 'No upcoming exams queued'}
        </p>
      </Card>

      {/* 3. Revision Readiness */}
      <Card className="p-4 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Revision Readiness
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-brand-700 dark:text-brand-300">
            {stats.overallReadinessPercentage}%
          </span>
          <span className="text-xs text-slate-400">topics ready</span>
        </div>
        {/* Progress bar */}
        <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-brand-600 dark:bg-brand-500 transition-all duration-300 rounded-full"
            style={{ width: `${stats.overallReadinessPercentage}%` }}
          />
        </div>
      </Card>

      {/* 4. Total Exam Weight */}
      <Card className="p-4 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Total Grade Weight
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Percent className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
            {stats.totalExamWeight}%
          </span>
          <span className="text-xs text-slate-400">of final marks</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 truncate">
          High impact on cumulative GPA
        </p>
      </Card>
    </div>
  );
};

