import React from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple';
  trend?: {
    value: string;
    positive?: boolean;
    label?: string;
  };
  progress?: {
    current: number;
    total: number;
    unit?: string;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'indigo',
  trend,
  progress,
  className,
}) => {
  const iconColorMap = {
    indigo: 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
  };

  const percent = progress ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : null;

  return (
    <Card hoverEffect className={cn('p-5 flex flex-col justify-between relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </h4>
            {subtitle && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105', iconColorMap[iconColor])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(trend || progress) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {trend && (
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  'font-semibold px-1.5 py-0.5 rounded-md',
                  trend.positive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                )}
              >
                {trend.value}
              </span>
              {trend.label && (
                <span className="text-slate-500 dark:text-slate-400">{trend.label}</span>
              )}
            </div>
          )}

          {progress && percent !== null && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span>Progress</span>
                <span>{progress.current}/{progress.total} {progress.unit || ''} ({percent}%)</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-brand-600 dark:bg-brand-500 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
