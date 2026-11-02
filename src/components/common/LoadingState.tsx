import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  rows?: number;
  className?: string;
  type?: 'cards' | 'table' | 'detail';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  rows = 3,
  className,
  type = 'cards',
}) => {
  if (type === 'table') {
    return (
      <div className={cn('w-full space-y-3 animate-pulse', className)}>
        <div className="h-10 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/40 w-full" />
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className={cn('space-y-6 animate-pulse p-4', className)}>
        <div className="h-8 w-1/3 rounded-lg bg-slate-200/80 dark:bg-slate-800" />
        <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/50" />
          <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/50" />
          <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/50" />
        </div>
        <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/40" />
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-2xl border border-slate-200/60 bg-slate-100/70 p-5 dark:border-slate-800/60 dark:bg-slate-800/40"
        />
      ))}
    </div>
  );
};
