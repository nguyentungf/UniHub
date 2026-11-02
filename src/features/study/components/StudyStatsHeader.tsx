import React from 'react';
import { Clock, Flame, Calendar, CheckCircle2 } from 'lucide-react';
import { StatCard } from '@/components/common';
import type { DailyStudyStats, WeeklyStudyStats } from '../utils/studyAnalytics';
import { formatDurationMinutes } from '@/lib/utils';

export interface StudyStatsHeaderProps {
  dailyStats: DailyStudyStats;
  weeklyStats: WeeklyStudyStats;
  streakDays: number;
  totalSessionsCount: number;
}

export const StudyStatsHeader: React.FC<StudyStatsHeaderProps> = ({
  dailyStats,
  weeklyStats,
  streakDays,
  totalSessionsCount,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Today's Focus Time"
        value={formatDurationMinutes(dailyStats.totalMinutes)}
        subtitle={`${dailyStats.sessionCount} sessions today`}
        icon={Clock}
        iconColor="indigo"
        progress={{
          current: dailyStats.totalMinutes,
          total: 120, // 2 hour daily goal
          unit: 'min',
        }}
      />

      <StatCard
        title="Focus Streak"
        value={`${streakDays} Day${streakDays === 1 ? '' : 's'}`}
        subtitle={streakDays > 0 ? 'Consecutive study habit!' : 'Start your streak today'}
        icon={Flame}
        iconColor="amber"
      />

      <StatCard
        title="Weekly Focus"
        value={`${weeklyStats.totalHours} hrs`}
        subtitle={`Goal: ${weeklyStats.targetMinutes / 60} hrs / week`}
        icon={Calendar}
        iconColor="emerald"
        trend={{
          value: `${weeklyStats.percentOfTarget}%`,
          positive: weeklyStats.percentOfTarget >= 100,
          label: 'of target',
        }}
      />

      <StatCard
        title="Total Sessions"
        value={totalSessionsCount}
        subtitle={
          dailyStats.averageFocusRating > 0
            ? `Avg focus rating: ${dailyStats.averageFocusRating}/5 ★`
            : 'Tracked deep work blocks'
        }
        icon={CheckCircle2}
        iconColor="purple"
      />
    </div>
  );
};

