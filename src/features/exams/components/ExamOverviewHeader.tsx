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
            Kỳ thi sắp tới
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
            trong tổng số {stats.totalExams} kỳ thi
          </span>
        </div>
        <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 font-medium truncate">
          {stats.completedCount} kỳ thi đã hoàn thành
        </p>
      </Card>

      {/* 2. Nearest Exam Countdown */}
      <Card className="p-4 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Đếm ngược gần nhất
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.nearestExamDays !== null
              ? stats.nearestExamDays === 0
                ? 'Hôm nay!'
                : `${stats.nearestExamDays} ngày`
              : 'Không có'}
          </span>
          <span className="text-xs text-slate-400">
            {stats.nearestExamDays !== null && stats.nearestExamDays > 0 ? 'còn lại' : ''}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 truncate">
          {stats.nearestExamDays !== null
            ? stats.nearestExamDays <= 3
              ? 'Cần tập trung ôn thi cấp tốc'
              : 'Tiến độ ôn tập phù hợp'
            : 'Không có kỳ thi nào sắp tới'}
        </p>
      </Card>

      {/* 3. Revision Readiness */}
      <Card className="p-4 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Mức độ sẵn sàng ôn tập
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-brand-700 dark:text-brand-300">
            {stats.overallReadinessPercentage}%
          </span>
          <span className="text-xs text-slate-400">chủ đề đã ôn</span>
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
            Tổng trọng số điểm thi
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Percent className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
            {stats.totalExamWeight}%
          </span>
          <span className="text-xs text-slate-400">tổng điểm môn học</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 truncate">
          Ảnh hưởng trực tiếp đến GPA tích lũy
        </p>
      </Card>
    </div>
  );
};

