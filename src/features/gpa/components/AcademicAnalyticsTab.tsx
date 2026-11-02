import React from 'react';
import {
  TrendingUp,
  Award,
  BookOpen,
  Clock,
  CheckSquare,
  Calendar,
  Layers,
  Sparkles,
  Flame,
  ArrowUpRight,
  BarChart2,
} from 'lucide-react';
import { StatCard } from '@/components/common';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  CreditAnalytics,
  CourseCompletionStats,
  StudyTimeAnalytics,
  AssignmentAnalytics,
  AcademicSummaries,
} from '../utils/analyticsLogic';
import { GpaHistoryPoint, GradingScale } from '@/types';

interface AcademicAnalyticsTabProps {
  creditAnalytics: CreditAnalytics;
  courseCompletionStats: CourseCompletionStats;
  studyAnalytics: StudyTimeAnalytics;
  assignmentAnalytics: AssignmentAnalytics;
  academicSummaries: AcademicSummaries;
  gpaHistory: GpaHistoryPoint[];
  scale: GradingScale;
}

export const AcademicAnalyticsTab: React.FC<AcademicAnalyticsTabProps> = ({
  creditAnalytics,
  courseCompletionStats,
  studyAnalytics,
  assignmentAnalytics,
  academicSummaries,
  gpaHistory,
  scale,
}) => {
  return (
    <div className="space-y-6">
      {/* Analytics Metric Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Degree Credits Progress"
          value={`${creditAnalytics.totalEarnedCredits} / ${creditAnalytics.degreeTargetCredits}`}
          subtitle={`${creditAnalytics.completionRate}% of Graduation Target`}
          icon={BookOpen}
          iconColor="sky"
          progress={{
            current: creditAnalytics.totalEarnedCredits,
            total: creditAnalytics.degreeTargetCredits,
            unit: 'Credits',
          }}
          trend={{
            value: `${creditAnalytics.creditsRemaining} credits remaining`,
            positive: true,
          }}
        />

        <StatCard
          title="Course Completion"
          value={`${courseCompletionStats.completionRate}%`}
          subtitle={`${courseCompletionStats.completedCourses} Completed · ${courseCompletionStats.enrolledCourses} Active`}
          icon={Layers}
          iconColor="emerald"
          trend={{
            value: `${courseCompletionStats.totalCourses} Total Courses (${courseCompletionStats.droppedCourses} dropped)`,
            positive: courseCompletionStats.droppedCourses === 0,
          }}
        />

        <StatCard
          title="Total Study Hours"
          value={`${studyAnalytics.totalHours}h`}
          subtitle={`★ ${studyAnalytics.averageFocusRating} / 5.0 Focus Rating`}
          icon={Clock}
          iconColor="indigo"
          trend={{
            value: `${studyAnalytics.totalSessions} sessions · Avg ${studyAnalytics.averageSessionMinutes}m`,
            positive: true,
          }}
        />

        <StatCard
          title="Assignment Velocity"
          value={`${assignmentAnalytics.completionRate}%`}
          subtitle={`${assignmentAnalytics.completedCount} of ${assignmentAnalytics.total} Done`}
          icon={CheckSquare}
          iconColor="amber"
          trend={{
            value:
              assignmentAnalytics.averageScore !== null
                ? `Avg Score: ${assignmentAnalytics.averageScore}%`
                : `${assignmentAnalytics.urgentCount + assignmentAnalytics.highCount} priority tasks`,
            positive: assignmentAnalytics.urgentCount === 0,
          }}
        />
      </div>

      {/* Main Charts: 1. GPA Progression & 2. Credits Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: GPA History Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <span>GPA History & Progression Curve</span>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Semester GPA vs Cumulative GPA trajectory across academic terms
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-600"></span>
                  <span className="text-slate-600 dark:text-slate-400">Term GPA</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Cumulative</span>
                </span>
              </div>
            </CardHeader>

            <CardContent>
              <div className="h-64 w-full pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gpaHistory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="semesterName"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[2.5, scale.maxGpa]}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                      formatter={(val: number) => [val.toFixed(2), '']}
                    />
                    <ReferenceLine
                      y={scale.maxGpa * 0.875} // Dean's list threshold line e.g. 3.5 on 4.0
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{
                        value: "Dean's Honor Target",
                        position: 'insideBottomRight',
                        fill: '#d97706',
                        fontSize: 10,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="semesterGpa"
                      name="Term GPA"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#4f46e5' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeGpa"
                      name="Cumulative GPA"
                      stroke="#10b981"
                      strokeWidth={3}
                      strokeDasharray="3 3"
                      dot={{ r: 4, fill: '#10b981' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* History Milestone Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                {gpaHistory.map((h) => (
                  <div key={h.semesterId} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {h.semesterName}
                    </span>
                    <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">
                      {h.semesterGpa.toFixed(2)} GPA
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {h.creditsEarned} Cr · Cum: {h.cumulativeGpa.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Grade Distribution Breakdown */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-emerald-500" />
                <span>Grade Distribution</span>
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Frequency count of letter grades earned
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={courseCompletionStats.gradeDistribution}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                    <XAxis
                      dataKey="letter"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                      formatter={(val: number) => [`${val} courses`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {courseCompletionStats.gradeDistribution.map((entry, index) => {
                        const colors = ['#3B82F6', '#60A5FA', '#10B981', '#34D399', '#F59E0B', '#FBBF24', '#EC4899', '#EF4444'];
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Highest Frequency:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {courseCompletionStats.gradeDistribution[0]?.letter || 'A'} (
                  {courseCompletionStats.gradeDistribution[0]?.count || 0} Courses)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 2: Study Time Analytics & Assignment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Hours by Course */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" />
              <span>Study Hours by Subject</span>
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Logged Pomodoro and stopwatch focus allocation
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {studyAnalytics.studyTimeByCourse.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No study sessions logged yet.
              </p>
            ) : (
              studyAnalytics.studyTimeByCourse.map((item) => (
                <div key={item.courseId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {item.courseCode} - {item.courseName}
                    </span>
                    <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">
                      {item.hours}h ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 7-Day Study Velocity Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <span>7-Day Study Consistency</span>
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily logged study hours over the past week
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyAnalytics.dailyTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                  <XAxis dataKey="dayLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(val: number) => [`${val} hours`, 'Study Time']}
                  />
                  <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Weekly & Monthly Periodic Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Weekly Summary Card */}
        <Card className="border border-brand-100 dark:border-brand-950 bg-gradient-to-br from-white to-brand-50/20 dark:from-slate-900 dark:to-brand-950/20 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-600" />
                <span>Weekly Academic Summary</span>
              </CardTitle>
              <Badge variant="brand" size="sm">
                Score: {academicSummaries.weekly.momentumScore}/100
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {academicSummaries.weekly.summaryHighlight}
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Study Hours</span>
                <span className="text-sm font-bold font-mono text-brand-600 dark:text-brand-400">
                  {academicSummaries.weekly.studyHours}h
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Assignments</span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {academicSummaries.weekly.assignmentsCompleted}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Exams</span>
                <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                  {academicSummaries.weekly.examsHandled}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary Card */}
        <Card className="border border-emerald-100 dark:border-emerald-950 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Monthly Academic Summary</span>
              </CardTitle>
              <Badge variant="emerald" size="sm">
                Score: {academicSummaries.monthly.momentumScore}/100
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {academicSummaries.monthly.summaryHighlight}
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Focus</span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {academicSummaries.monthly.studyHours}h
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tasks Done</span>
                <span className="text-sm font-bold font-mono text-brand-600 dark:text-brand-400">
                  {academicSummaries.monthly.assignmentsCompleted}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Exams Handled</span>
                <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                  {academicSummaries.monthly.examsHandled}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
