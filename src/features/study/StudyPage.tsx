import React, { useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { PageHeader } from '@/components/common';
import { Badge, Button } from '@/components/ui';
import { BookOpen, FileText, Sparkles, RefreshCw } from 'lucide-react';
import { useStudyStore, useCourseStore, useNoteStore } from '@/stores';
import {
  PomodoroTimer,
  StudyStatsHeader,
  FocusCharts,
  StudyHistoryTable,
  LogManualSessionModal,
} from './components';
import {
  calculateDailyStats,
  calculateWeeklyStats,
  calculateStudyStreak,
  calculateCourseFocusBreakdown,
  calculateDailyFocusTrend,
} from './utils/studyAnalytics';

export const StudyPage: React.FC = () => {
  const sessions = useStudyStore((state) => state.sessions);
  const settings = useStudyStore((state) => state.settings);
  const isLoading = useStudyStore((state) => state.isLoading);
  const error = useStudyStore((state) => state.error);
  const loadSessions = useStudyStore((state) => state.loadSessions);
  const addSession = useStudyStore((state) => state.addSession);
  const deleteSession = useStudyStore((state) => state.deleteSession);
  const updateSettings = useStudyStore((state) => state.updateSettings);

  const courses = useCourseStore((state) => state.courses);
  const loadCourses = useCourseStore((state) => state.loadCourses);

  const notes = useNoteStore((state) => state.notes);
  const loadNotes = useNoteStore((state) => state.loadNotes);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  useEffect(() => {
    loadSessions();
    loadCourses();
    loadNotes();
  }, [loadSessions, loadCourses, loadNotes]);

  // Analytics computation memoized on sessions and courses
  const dailyStats = useMemo(() => calculateDailyStats(sessions), [sessions]);
  const weeklyStats = useMemo(() => calculateWeeklyStats(sessions), [sessions]);
  const streakDays = useMemo(() => calculateStudyStreak(sessions), [sessions]);
  const courseBreakdown = useMemo(
    () => calculateCourseFocusBreakdown(sessions, courses),
    [sessions, courses]
  );
  const trendData = useMemo(() => calculateDailyFocusTrend(sessions, 7), [sessions]);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <PageHeader
        title="Study Workspace & Pomodoro"
        subtitle="Time-tested Pomodoro flow, deep work tracking, and course revision analytics"
        badge={
          <Badge variant="brand" dot>
            {dailyStats.sessionCount} Sessions Today
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <NavLink to="/notes">
              <Button size="sm" variant="outline" leftIcon={<FileText className="h-4 w-4" />}>
                Course Notes ({notes.length})
              </Button>
            </NavLink>
          </div>
        }
      />

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
          <span>{error}</span>
          <Button size="xs" variant="outline" onClick={loadSessions} leftIcon={<RefreshCw className="h-3 w-3" />}>
            Retry
          </Button>
        </div>
      )}

      {/* High-Level Analytical StatCards */}
      <StudyStatsHeader
        dailyStats={dailyStats}
        weeklyStats={weeklyStats}
        streakDays={streakDays}
        totalSessionsCount={sessions.length}
      />

      {/* Core Focus Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Pomodoro Clock Card (Col 1-8) */}
        <div className="lg:col-span-8">
          <PomodoroTimer
            courses={courses}
            settings={settings}
            onUpdateSettings={updateSettings}
            onRecordSession={addSession}
          />
        </div>

        {/* Quick Insights & Motivation Card (Col 9-12) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl p-6 bg-gradient-to-br from-indigo-500 via-indigo-600 to-brand-700 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Deep Work Protocol</span>
            </div>
            <h3 className="text-lg font-bold leading-snug">
              25m Focus + 5m Rest
            </h3>
            <p className="mt-2 text-xs text-indigo-100/90 leading-relaxed">
              Maintain cognitive clarity by tackling one task per session. The timer stays accurate
              even if you switch tabs or minimize the browser.
            </p>

            <div className="mt-5 pt-4 border-t border-white/20 flex items-center justify-between text-xs">
              <span className="text-indigo-200">Weekly Target Progress:</span>
              <span className="font-bold text-white font-mono">
                {weeklyStats.percentOfTarget}% ({weeklyStats.totalHours}h / {weeklyStats.targetMinutes / 60}h)
              </span>
            </div>
          </div>

          {/* Quick Notes Scratchpad Link */}
          <div className="p-5 rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-500" />
                <span>Recent Knowledge Vault</span>
              </h4>
              <NavLink to="/notes" className="text-[11px] font-semibold text-brand-600 hover:underline">
                View all
              </NavLink>
            </div>
            <div className="space-y-2">
              {notes.slice(0, 3).map((n) => (
                <NavLink
                  key={n.id}
                  to="/notes"
                  className="block p-2.5 rounded-xl bg-slate-50 hover:bg-brand-50/50 dark:bg-slate-850 dark:hover:bg-brand-950/30 transition-all border border-slate-100 dark:border-slate-800/80"
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {n.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {n.content.replace(/#|\*|`/g, '').substring(0, 60)}
                  </p>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Focus Duration & Distribution Charts */}
      <FocusCharts trendData={trendData} courseBreakdown={courseBreakdown} />

      {/* Study History Table */}
      <StudyHistoryTable
        sessions={sessions}
        courses={courses}
        onDeleteSession={deleteSession}
        onOpenLogModal={() => setIsManualModalOpen(true)}
      />

      {/* Manual Offline Session Logger Modal */}
      <LogManualSessionModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        courses={courses}
        onSave={addSession}
      />
    </div>
  );
};
