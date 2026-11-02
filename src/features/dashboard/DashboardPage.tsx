import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
  Flame,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { StatCard, PageHeader, LoadingState, EmptyState } from '@/components/common';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { SEED_DATA } from '@/constants/seedData';
import { formatDeadlineRelative, formatDate } from '@/lib/utils';
import { useAssignmentStore, useExamStore, useCourseStore } from '@/stores';
import { selectUpcomingDeadlines } from '@/features/assignments';
import { selectNextExam } from '@/features/exams';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty'>('normal');

  const { settings, timetable } = SEED_DATA.data;
  const currentSemester = SEED_DATA.data.semesters.find((s) => s.isCurrent);

  // Store subscriptions
  const liveCourses = useCourseStore((state) => state.courses);
  const liveAssignments = useAssignmentStore((state) => state.assignments);
  const liveExams = useExamStore((state) => state.exams);
  const loadCourses = useCourseStore((state) => state.loadCourses);
  const loadAssignments = useAssignmentStore((state) => state.loadAssignments);
  const loadExams = useExamStore((state) => state.loadExams);

  useEffect(() => {
    loadCourses();
    loadAssignments();
    loadExams();
  }, [loadCourses, loadAssignments, loadExams]);

  const courses = liveCourses.length > 0 ? liveCourses : SEED_DATA.data.courses;
  const assignments = liveAssignments.length > 0 ? liveAssignments : SEED_DATA.data.assignments;
  const exams = liveExams.length > 0 ? liveExams : SEED_DATA.data.exams;

  // Today is Monday in demo
  const todaysClasses = timetable
    .filter((slot) => slot.dayOfWeek === 1)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingDeadlines = selectUpcomingDeadlines(assignments, courses, 3);
  const nextExam = selectNextExam(exams, courses);

  const weeklyStudyData = [
    { day: 'Mon', hours: 3.5 },
    { day: 'Tue', hours: 4.2 },
    { day: 'Wed', hours: 2.8 },
    { day: 'Thu', hours: 5.0 },
    { day: 'Fri', hours: 3.0 },
    { day: 'Sat', hours: 6.5 },
    { day: 'Sun', hours: 4.0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & State Toggle for demonstration */}
      <PageHeader
        title={`Welcome back, ${settings.studentName} 👋`}
        subtitle={`${settings.major} · ${settings.universityName} · ${currentSemester?.name}`}
        badge={
          <Badge variant="brand" dot>
            Semester in Progress
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-medium">
              <button
                onClick={() => setViewState('normal')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  viewState === 'normal'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setViewState('loading')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  viewState === 'loading'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Loading
              </button>
              <button
                onClick={() => setViewState('empty')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  viewState === 'empty'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Empty
              </button>
            </div>
            <NavLink to="/study">
              <Button size="sm" leftIcon={<Flame className="h-4 w-4 text-brand-200" />}>
                Focus Session
              </Button>
            </NavLink>
          </div>
        }
      />

      {viewState === 'loading' && <LoadingState rows={4} />}

      {viewState === 'empty' && (
        <EmptyState
          icon={Layers}
          title="No Academic Data Active"
          description="You do not have any enrolled courses or timetable slots scheduled for this semester. Click below to load demo data or enroll in your first course."
          actionLabel="Enroll in Courses"
          onAction={() => setViewState('normal')}
        />
      )}

      {viewState === 'normal' && (
        <>
          {/* Top Metric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Semester GPA"
              value="3.82"
              subtitle="/ 4.00"
              icon={Sparkles}
              iconColor="indigo"
              progress={{ current: 3.82, total: 4.0, unit: 'GPA' }}
              trend={{ value: '+0.07', positive: true, label: 'vs Spring 2026' }}
            />
            <StatCard
              title="Enrolled Courses"
              value={courses.length}
              subtitle="12 Total Credits"
              icon={BookOpen}
              iconColor="emerald"
              trend={{ value: '100% on track', positive: true }}
            />
            <StatCard
              title="Active Deadlines"
              value={assignments.filter((a) => a.status !== 'graded').length}
              subtitle="1 High Priority"
              icon={CheckSquare}
              iconColor="amber"
              trend={{ value: '2 Due this week', positive: false }}
            />
            <StatCard
              title="Study Focus"
              value="28.5 hrs"
              subtitle="This Week"
              icon={Clock}
              iconColor="purple"
              trend={{ value: '+18%', positive: true, label: 'streak: 5 days' }}
            />
          </div>

          {/* Main Grid: Today's Schedule & Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Schedule & Study Graph */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Schedule Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand-500" />
                      <span>Today&apos;s Class Schedule</span>
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Monday · 2 lectures scheduled
                    </p>
                  </div>
                  <NavLink
                    to="/timetable"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
                  >
                    Full Timetable <ArrowRight className="h-3.5 w-3.5" />
                  </NavLink>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todaysClasses.map((slot, index) => {
                    const course = courses.find((c) => c.id === slot.courseId);
                    return (
                      <div
                        key={slot.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-white hover:shadow-xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/80 transition-all gap-3"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-1.5 h-10 rounded-full shrink-0"
                            style={{ backgroundColor: course?.color || '#6366f1' }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {course?.code}
                              </span>
                              <Badge variant="outline" size="sm">
                                {slot.type.toUpperCase()}
                              </Badge>
                              {index === 0 && (
                                <Badge variant="emerald" size="sm" dot>
                                  Next Up
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                              {course?.name}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {slot.location} · {course?.instructor}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="text-[10px] text-slate-400">Weekly Lecture</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Weekly Study Hours Analytics */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <span>Weekly Focus Distribution</span>
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total 28.5 hours recorded across all enrolled courses
                    </p>
                  </div>
                  <Badge variant="purple" size="sm">
                    Target: 25h/week
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyStudyData}>
                        <XAxis
                          dataKey="day"
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${val}h`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                          formatter={(value) => [`${value} hours`, 'Focus Time']}
                        />
                        <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                          {weeklyStudyData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.day === 'Sat' ? '#4f46e5' : '#818cf8'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right 1 Col: Urgent Deadlines & Exam Alert */}
            <div className="space-y-6">
              {/* Exam Alert Card */}
              {nextExam && (
                <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-5 shadow-xs dark:border-amber-900/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                        <AlertCircle className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                          Next Exam Alert
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {nextExam.countdownLabel}
                        </p>
                      </div>
                    </div>
                    <Badge variant={nextExam.badgeVariant} size="sm">
                      {nextExam.examType.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mt-3.5 space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {nextExam.courseCode ? `${nextExam.courseCode} · ` : ''}{nextExam.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(nextExam.examDate)} · {nextExam.location} {nextExam.seatNumber ? `(${nextExam.seatNumber})` : ''}
                    </p>
                    {nextExam.weight !== undefined && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
                        Weight: {nextExam.weight}% of total course grade
                      </p>
                    )}
                  </div>

                  <NavLink
                    to="/exams"
                    className="mt-3.5 block text-center rounded-xl bg-amber-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
                  >
                    View Revision Checklist →
                  </NavLink>
                </div>
              )}

              {/* Upcoming Deadlines Widget */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-brand-500" />
                    <span>Upcoming Deadlines</span>
                  </CardTitle>
                  <NavLink
                    to="/assignments"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    View All
                  </NavLink>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingDeadlines.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No upcoming deadlines. All caught up!
                    </div>
                  ) : (
                    upcomingDeadlines.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/80 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold"
                            style={{ color: a.courseColor || '#3b82f6' }}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: a.courseColor || '#3b82f6' }}
                            />
                            {a.courseCode || 'GEN'}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              a.priority === 'urgent'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : a.priority === 'high'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {a.priority.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                          {a.title}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className={a.isOverdue ? 'text-rose-500 font-bold' : ''}>
                            {a.relativeLabel}
                          </span>
                          {a.weight !== undefined && (
                            <span className="font-mono">{a.weight}% Weight</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
