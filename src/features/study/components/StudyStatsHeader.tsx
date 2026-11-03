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
        title="Thời gian tập trung hôm nay"
        value={formatDurationMinutes(dailyStats.totalMinutes)}
        subtitle={`${dailyStats.sessionCount} phiên hôm nay`}
        icon={Clock}
        iconColor="indigo"
        progress={{
          current: dailyStats.totalMinutes,
          total: 120, // 2 hour daily goal
          unit: 'phút',
        }}
      />

      <StatCard
        title="Chuỗi ngày học liên tục"
        value={`${streakDays} Ngày`}
        subtitle={streakDays > 0 ? 'Thói quen học tập bền bỉ!' : 'Bắt đầu chuỗi học hôm nay'}
        icon={Flame}
        iconColor="amber"
      />

      <StatCard
        title="Tập trung trong tuần"
        value={`${weeklyStats.totalHours} giờ`}
        subtitle={`Mục tiêu: ${weeklyStats.targetMinutes / 60} giờ / tuần`}
        icon={Calendar}
        iconColor="emerald"
        trend={{
          value: `${weeklyStats.percentOfTarget}%`,
          positive: weeklyStats.percentOfTarget >= 100,
          label: 'mục tiêu',
        }}
      />

      <StatCard
        title="Tổng số phiên học"
        value={totalSessionsCount}
        subtitle={
          dailyStats.averageFocusRating > 0
            ? `Đánh giá TB: ${dailyStats.averageFocusRating}/5 ★`
            : 'Khoảng thời gian tập trung sâu'
        }
        icon={CheckCircle2}
        iconColor="purple"
      />
    </div>
  );
};

