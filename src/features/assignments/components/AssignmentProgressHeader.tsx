import React from 'react';
import { AssignmentProgressStats } from '../utils/assignmentLogic';
import { Card, Badge } from '@/components/ui';
import { CheckCircle2, Clock, AlertTriangle, Layers, Percent } from 'lucide-react';

interface AssignmentProgressHeaderProps {
  stats: AssignmentProgressStats;
}

export const AssignmentProgressHeader: React.FC<AssignmentProgressHeaderProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Overall Progress */}
      <Card className="p-4 col-span-2 lg:col-span-1 bg-gradient-to-br from-brand-50/70 via-white to-brand-50/30 dark:from-brand-950/30 dark:via-slate-900 dark:to-brand-950/10 border-brand-200/70 dark:border-brand-900/50">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            Tỷ lệ hoàn thành
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
            <Percent className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.completionPercentage}%
          </span>
          <span className="text-xs text-slate-500">
            ({stats.completed}/{stats.total})
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-brand-600 dark:bg-brand-500 transition-all duration-300 rounded-full"
            style={{ width: `${stats.completionPercentage}%` }}
          />
        </div>
      </Card>

      {/* 2. Not Started */}
      <Card className="p-4 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chưa làm
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Layers className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.notStarted}
          </span>
          <span className="text-xs text-slate-400">bài tập</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 truncate">Sẵn sàng để bắt đầu</p>
      </Card>

      {/* 3. In Progress */}
      <Card className="p-4 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Đang làm
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <Clock className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-brand-700 dark:text-brand-300">
            {stats.inProgress}
          </span>
          <span className="text-xs text-slate-400">đang làm</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 truncate">Đang tích cực xử lý</p>
      </Card>

      {/* 4. Completed */}
      <Card className="p-4 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Đã xong
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
            {stats.completed}
          </span>
          <span className="text-xs text-slate-400">hoàn thành</span>
        </div>
        <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
          Đạt {stats.completedWeight}% trọng số điểm
        </p>
      </Card>

      {/* 5. Overdue */}
      <Card
        className={`p-4 col-span-2 lg:col-span-1 transition-colors ${
          stats.overdue > 0
            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
            : 'bg-white dark:bg-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-2">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${
              stats.overdue > 0
                ? 'text-rose-700 dark:text-rose-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Quá hạn
          </span>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-xl ${
              stats.overdue > 0
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-extrabold ${
              stats.overdue > 0
                ? 'text-rose-700 dark:text-rose-300'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {stats.overdue}
          </span>
          <span className="text-xs text-slate-400">cần nộp gấp</span>
        </div>
        <p
          className={`mt-2 text-[11px] font-medium truncate ${
            stats.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
          }`}
        >
          {stats.overdue > 0 ? 'Cần hành động ngay lập tức' : 'Mọi bài tập đúng tiến độ'}
        </p>
      </Card>
    </div>
  );
};

