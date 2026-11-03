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
import {
  useAssignmentStore,
  useExamStore,
  useCourseStore,
  useSettingsStore,
  useTimetableStore,
  useStudyStore,
} from '@/stores';
import { getTodayDayOfWeek } from '@/stores/useTimetableStore';
import { getDatabaseMode } from '@/lib/storage/db';
import { normalizeCourseToGradeRecord, calculateSemesterGpa } from '@/features/gpa/utils/gpaLogic';
import { DEFAULT_GRADING_SCALES } from '@/features/gpa/utils/gradingScales';
import {
  calculateWeeklyStats,
  calculateStudyStreak,
  calculateDailyFocusTrend,
} from '@/features/study/utils/studyAnalytics';
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

  const settings = useSettingsStore((state) => state.settings);
  const dbMode = getDatabaseMode();

  // Store subscriptions
  const courses = useCourseStore((state) => state.courses);
  const semesters = useCourseStore((state) => state.semesters);
  const assignments = useAssignmentStore((state) => state.assignments);
  const exams = useExamStore((state) => state.exams);
  const timetable = useTimetableStore((state) => state.slots);
  const sessions = useStudyStore((state) => state.sessions);

  const loadCourses = useCourseStore((state) => state.loadCourses);
  const loadAssignments = useAssignmentStore((state) => state.loadAssignments);
  const loadExams = useExamStore((state) => state.loadExams);
  const loadSlots = useTimetableStore((state) => state.loadSlots);
  const loadSessions = useStudyStore((state) => state.loadSessions);

  useEffect(() => {
    loadCourses();
    loadAssignments();
    loadExams();
    loadSlots();
    loadSessions();
  }, [loadCourses, loadAssignments, loadExams, loadSlots, loadSessions]);

  const currentSemester = semesters.find((s) => s.isCurrent) || semesters[0];

  // Dynamic Courses & Credits calculation
  const semesterCourses = currentSemester
    ? courses.filter((c) => c.semesterId === currentSemester.id)
    : courses;
  const totalCredits = semesterCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

  // Dynamic GPA Calculation
  const gradeRecords = semesterCourses.map((c) => normalizeCourseToGradeRecord(c, currentSemester?.name));
  const semesterGpa = calculateSemesterGpa(gradeRecords, DEFAULT_GRADING_SCALES[0], currentSemester?.id, currentSemester?.name);
  const hasGradedCourses = semesterGpa.gradedCoursesCount > 0;
  const gpaValue = hasGradedCourses ? semesterGpa.gpa.toFixed(2) : '0.00';
  const gpaSubtitle = hasGradedCourses
    ? `/ 4.00 (${semesterGpa.gradedCoursesCount}/${semesterCourses.length} môn có điểm)`
    : currentSemester?.targetGpa
    ? `Mục tiêu kỳ này: ${currentSemester.targetGpa.toFixed(2)}`
    : 'Chưa có điểm môn nào';

  // Dynamic Assignments belonging to current semester (or all if course not found)
  const semesterCourseIds = new Set(semesterCourses.map((c) => c.id));
  const semesterAssignments = semesterCourses.length > 0
    ? assignments.filter((a) => semesterCourseIds.has(a.courseId))
    : assignments;
  const activeAssignments = semesterAssignments.filter((a) => a.status !== 'completed');
  const urgentAssignmentsCount = activeAssignments.filter((a) => a.priority === 'urgent' || a.priority === 'high').length;
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueThisWeekCount = activeAssignments.filter((a) => {
    try {
      const d = new Date(a.dueDate);
      return d >= now && d <= next7Days;
    } catch {
      return false;
    }
  }).length;

  // Dynamic Study Time & Weekly Trend
  const weeklyStudyStats = calculateWeeklyStats(sessions);
  const studyStreak = calculateStudyStreak(sessions);
  const rawFocusTrend = calculateDailyFocusTrend(sessions, 7);
  const dayMapVi: Record<string, string> = {
    Mon: 'T2',
    Tue: 'T3',
    Wed: 'T4',
    Thu: 'T5',
    Fri: 'T6',
    Sat: 'T7',
    Sun: 'CN',
  };
  const weeklyStudyData = rawFocusTrend.map((item) => ({
    day: dayMapVi[item.dayLabel] || item.dayLabel,
    hours: item.hours,
  }));

  // Today's classes based on actual Day of Week
  const todayDayOfWeek = getTodayDayOfWeek();
  const dayNameViMap: Record<number, string> = {
    1: 'Thứ Hai',
    2: 'Thứ Ba',
    3: 'Thứ Tư',
    4: 'Thứ Năm',
    5: 'Thứ Sáu',
    6: 'Thứ Bảy',
    7: 'Chủ Nhật',
  };
  const todayName = dayNameViMap[todayDayOfWeek] || 'Hôm nay';
  const todaysClasses = timetable
    .filter((slot) => slot.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingDeadlines = selectUpcomingDeadlines(assignments, courses, 3);
  const nextExam = selectNextExam(exams, courses);

  return (
    <div className="space-y-6">
      {/* Top Header & State Toggle */}
      <PageHeader
        title={`Chào mừng trở lại, ${settings.studentName} 👋`}
        subtitle={`${settings.major} · ${settings.universityName} · ${currentSemester?.name || 'Học kỳ mới'}`}
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand" dot>
              {currentSemester?.name || 'Học kỳ đang diễn ra'}
            </Badge>
            {dbMode === 'real' ? (
              <Badge variant="emerald" dot>
                Dữ liệu thực tế (Trường trắng)
              </Badge>
            ) : (
              <Badge variant="amber" dot>
                Dữ liệu mẫu (Demo)
              </Badge>
            )}
          </div>
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
                Chuẩn
              </button>
              <button
                onClick={() => setViewState('loading')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  viewState === 'loading'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Đang tải
              </button>
              <button
                onClick={() => setViewState('empty')}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  viewState === 'empty'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Trống
              </button>
            </div>
            <NavLink to="/study">
              <Button size="sm" leftIcon={<Flame className="h-4 w-4 text-brand-200" />}>
                Phiên tập trung
              </Button>
            </NavLink>
          </div>
        }
      />

      {viewState === 'loading' && <LoadingState rows={4} />}

      {viewState === 'empty' && (
        <EmptyState
          icon={Layers}
          title="Chưa có dữ liệu học tập"
          description="Bạn chưa đăng ký môn học hoặc chưa có thời khóa biểu nào cho học kỳ này. Nhấn bên dưới để tải dữ liệu hoặc đăng ký môn học đầu tiên."
          actionLabel="Đăng ký môn học"
          onAction={() => setViewState('normal')}
        />
      )}

      {viewState === 'normal' && (
        <>
          {/* Top Metric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="GPA Học kỳ"
              value={gpaValue}
              subtitle={gpaSubtitle}
              icon={Sparkles}
              iconColor="indigo"
              progress={
                hasGradedCourses
                  ? { current: semesterGpa.gpa, total: currentSemester?.targetGpa || 4.0, unit: 'GPA' }
                  : currentSemester?.targetGpa
                  ? { current: 0, total: currentSemester.targetGpa, unit: 'GPA' }
                  : undefined
              }
              trend={
                currentSemester?.targetGpa
                  ? {
                      value: `Mục tiêu: ${currentSemester.targetGpa.toFixed(2)}${
                        hasGradedCourses ? ` · ${semesterGpa.earnedCredits} tín chỉ` : ''
                      }`,
                      positive: hasGradedCourses ? semesterGpa.gpa >= currentSemester.targetGpa : true,
                    }
                  : hasGradedCourses
                  ? { value: `${semesterGpa.earnedCredits} tín chỉ đạt`, positive: true }
                  : { value: 'Theo dõi thời gian thực', positive: true }
              }
            />
            <StatCard
              title="Môn học đăng ký"
              value={semesterCourses.length}
              subtitle={`${totalCredits} Tổng tín chỉ`}
              icon={BookOpen}
              iconColor="emerald"
              trend={{
                value: `${semesterCourses.filter((c) => c.status === 'completed').length} môn hoàn thành`,
                positive: true,
              }}
            />
            <StatCard
              title="Bài tập đang mở"
              value={activeAssignments.length}
              subtitle={`${urgentAssignmentsCount} Ưu tiên cao`}
              icon={CheckSquare}
              iconColor="amber"
              trend={{
                value: `${dueThisWeekCount} bài hạn tuần này`,
                positive: dueThisWeekCount === 0,
              }}
            />
            <StatCard
              title="Thời gian học"
              value={`${weeklyStudyStats.totalHours} giờ`}
              subtitle="Tuần này"
              icon={Clock}
              iconColor="purple"
              trend={{
                value: `Chuỗi: ${studyStreak} ngày`,
                positive: studyStreak > 0,
              }}
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
                      <span>Lịch học hôm nay</span>
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {todayName} · {todaysClasses.length} tiết học theo lịch
                    </p>
                  </div>
                  <NavLink
                    to="/timetable"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
                  >
                    Toàn bộ TKB <ArrowRight className="h-3.5 w-3.5" />
                  </NavLink>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todaysClasses.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Không có tiết học nào trong ngày hôm nay.
                    </div>
                  ) : (
                    todaysClasses.map((slot, index) => {
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
                                  Tiết kế tiếp
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
                          <span className="text-[10px] text-slate-400">Lý thuyết tuần</span>
                        </div>
                      </div>
                    );
                  })
                  )}
                </CardContent>
              </Card>

              {/* Weekly Study Hours Analytics */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <span>Phân bổ thời gian học tuần</span>
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tổng cộng {weeklyStudyStats.totalHours} giờ ghi nhận trên tất cả môn học
                    </p>
                  </div>
                  <Badge variant="purple" size="sm">
                    {weeklyStudyStats.completedSessions} phiên tập trung
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
                          formatter={(value) => [`${value} giờ`, 'Thời gian tập trung']}
                        />
                        <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                          {weeklyStudyData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.day === 'T7' ? '#4f46e5' : '#818cf8'}
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
                          Kỳ thi sắp tới
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
                      {formatDate(nextExam.examDate)} · {nextExam.location} {nextExam.seatNumber ? `(SBD: ${nextExam.seatNumber})` : ''}
                    </p>
                    {nextExam.weight !== undefined && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
                        Trọng số: {nextExam.weight}% điểm học phần
                      </p>
                    )}
                  </div>

                  <NavLink
                    to="/exams"
                    className="mt-3.5 block text-center rounded-xl bg-amber-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
                  >
                    Xem danh sách ôn thi →
                  </NavLink>
                </div>
              )}

              {/* Upcoming Deadlines Widget */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-brand-500" />
                    <span>Hạn nộp bài tập sắp tới</span>
                  </CardTitle>
                  <NavLink
                    to="/assignments"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Xem tất cả
                  </NavLink>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingDeadlines.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Không có bài tập nào sắp tới. Bạn đã hoàn thành tất cả!
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
                            {a.priority === 'urgent' ? 'KHẨN CẤP' : a.priority === 'high' ? 'ƯU TIÊN CAO' : a.priority === 'medium' ? 'TRUNG BÌNH' : 'THẤP'}
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
                            <span className="font-mono">Trọng số {a.weight}%</span>
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
