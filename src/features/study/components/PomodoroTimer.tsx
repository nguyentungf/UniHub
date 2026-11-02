import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  Star,
  CheckCircle2,
  BookOpen,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import type { Course, PomodoroSettings, StudySession } from '@/types';
import { TimerEngine, type PomodoroMode, type TimerStatus } from '../utils/timerEngine';
import { TimerSettingsModal } from './TimerSettingsModal';
import { playChimeSound } from '../utils/chime';

export interface PomodoroTimerProps {
  courses: Course[];
  settings: PomodoroSettings;
  onUpdateSettings: (newSettings: Partial<PomodoroSettings>) => void;
  onRecordSession: (session: StudySession) => Promise<unknown>;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  courses,
  settings,
  onUpdateSettings,
  onRecordSession,
}) => {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(settings.workDuration * 60);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [selectedCourseId, setSelectedCourseId] = useState<string | 'general'>(
    courses[0]?.id || 'general'
  );

  // Settings & sound
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Completion Dialog State
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState<{
    startTime: string;
    endTime: string;
    durationMinutes: number;
    courseId: string | null;
  } | null>(null);
  const [sessionRating, setSessionRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Session start time tracking for accurate start/end timestamps
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Instantiate TimerEngine in a ref so state persists across renders
  const timerEngineRef = useRef<TimerEngine | null>(null);

  const handleSessionComplete = useCallback(
    (completedMode: PomodoroMode, cycleCount: number) => {
      if (soundEnabled) {
        playChimeSound();
      }

      // If it was a focus work session, prepare record dialog
      if (completedMode === 'work') {
        const endTime = new Date().toISOString();
        const durationMinutes = Math.max(
          1,
          Math.round((Date.now() - sessionStartTimeRef.current) / 60000)
        );

        setCompletedSessionData({
          startTime: new Date(sessionStartTimeRef.current).toISOString(),
          endTime,
          durationMinutes: durationMinutes > 0 ? durationMinutes : settings.workDuration,
          courseId: selectedCourseId === 'general' ? null : selectedCourseId,
        });
        setShowCompletionPrompt(true);
      }
    },
    [soundEnabled, settings.workDuration, selectedCourseId]
  );

  // Initialize or reconfigure TimerEngine
  useEffect(() => {
    const engine = new TimerEngine({
      settings,
      initialMode: mode,
      onTick: (sec, pct) => {
        setRemainingSeconds(sec);
        setProgressPercent(pct);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onComplete: handleSessionComplete,
    });

    timerEngineRef.current = engine;
    setRemainingSeconds(engine.getRemainingSeconds());
    setProgressPercent(engine.getProgressPercent());

    return () => {
      timerEngineRef.current = null;
    };
  }, [settings, handleSessionComplete]);

  // Handle wall-clock ticking with requestAnimationFrame or interval fallback
  useEffect(() => {
    let timerId: number | null = null;

    if (status === 'running') {
      timerId = window.setInterval(() => {
        timerEngineRef.current?.tick(Date.now());
      }, 250);
    }

    return () => {
      if (timerId !== null) {
        clearInterval(timerId);
      }
    };
  }, [status]);

  // Handle page visibility change (tab switching / sleep restore)
  useEffect(() => {
    const handleVisibility = () => {
      const isVisible = document.visibilityState === 'visible';
      timerEngineRef.current?.handleVisibilityChange(isVisible, Date.now());
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleStart = () => {
    sessionStartTimeRef.current = Date.now();
    timerEngineRef.current?.start(Date.now());
  };

  const handlePause = () => {
    timerEngineRef.current?.pause(Date.now());
  };

  const handleResume = () => {
    timerEngineRef.current?.resume(Date.now());
  };

  const handleReset = () => {
    timerEngineRef.current?.reset();
  };

  const handleSkip = () => {
    timerEngineRef.current?.skip();
    if (timerEngineRef.current) {
      setMode(timerEngineRef.current.getMode());
    }
  };

  const handleSwitchMode = (newMode: PomodoroMode) => {
    setMode(newMode);
    timerEngineRef.current?.switchMode(newMode);
  };

  const handleSaveCompletedSession = async () => {
    if (!completedSessionData || isSavingSession) return;
    setIsSavingSession(true);

    try {
      const newSession: StudySession = {
        id: `study-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        courseId: completedSessionData.courseId,
        startTime: completedSessionData.startTime,
        endTime: completedSessionData.endTime,
        durationMinutes: completedSessionData.durationMinutes,
        sessionType: 'pomodoro',
        focusRating: sessionRating,
        notes: sessionNotes.trim() || 'Completed focused Pomodoro interval',
      };

      await onRecordSession(newSession);
      setShowCompletionPrompt(false);
      setCompletedSessionData(null);
      setSessionNotes('');
      setSessionRating(5);
    } catch {
      // Error handled by store
    } finally {
      setIsSavingSession(false);
    }
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // SVG Ring Geometry
  const circleRadius = 110;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <Card className="p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-b from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-navy-950 border border-slate-200/80 dark:border-slate-800">
      {/* Top Controls Row */}
      <div className="w-full flex items-center justify-between mb-6">
        {/* Mode Switcher Pills */}
        <div className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800 text-xs font-semibold select-none">
          <button
            onClick={() => handleSwitchMode('work')}
            className={`rounded-xl px-3.5 py-1.5 transition-all ${
              mode === 'work'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Pomodoro ({settings.workDuration}m)
          </button>
          <button
            onClick={() => handleSwitchMode('shortBreak')}
            className={`rounded-xl px-3.5 py-1.5 transition-all ${
              mode === 'shortBreak'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Short Break ({settings.shortBreak}m)
          </button>
          <button
            onClick={() => handleSwitchMode('longBreak')}
            className={`rounded-xl px-3.5 py-1.5 transition-all ${
              mode === 'longBreak'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Long Break ({settings.longBreak}m)
          </button>
        </div>

        {/* Quick Settings & Sound Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Timer Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Circular Animated Timer SVG Display */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-64 h-64 -rotate-90 transform" viewBox="0 0 256 256">
          {/* Background Ring */}
          <circle
            cx="128"
            cy="128"
            r={circleRadius}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress Ring */}
          <circle
            cx="128"
            cy="128"
            r={circleRadius}
            className={`transition-all duration-300 ${
              mode === 'work'
                ? 'stroke-brand-600 dark:stroke-brand-500'
                : 'stroke-emerald-500 dark:stroke-emerald-400'
            }`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Digital Time & Badge in Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-5xl font-black tracking-tight text-slate-900 dark:text-white select-none">
            {timeFormatted}
          </span>

          <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {mode === 'work'
              ? status === 'running'
                ? 'Deep Focus Interval'
                : 'Focus Ready'
              : mode === 'shortBreak'
              ? 'Quick Recharge Break'
              : 'Long Rest & Reflect'}
          </span>

          {selectedCourse && (
            <span
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full text-white shadow-xs"
              style={{ backgroundColor: selectedCourse.color }}
            >
              {selectedCourse.code} · {selectedCourse.name}
            </span>
          )}
          {selectedCourseId === 'general' && (
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 shadow-xs">
              <BookOpen className="h-3 w-3" /> General Study
            </span>
          )}
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-3 mt-6">
        {status === 'running' ? (
          <Button
            size="lg"
            variant="secondary"
            leftIcon={<Pause className="h-5 w-5" />}
            onClick={handlePause}
            className="px-8 text-base font-bold shadow-md"
          >
            Pause
          </Button>
        ) : status === 'paused' ? (
          <Button
            size="lg"
            variant="primary"
            leftIcon={<Play className="h-5 w-5 fill-current" />}
            onClick={handleResume}
            className="px-8 text-base font-bold shadow-md"
          >
            Resume
          </Button>
        ) : (
          <Button
            size="lg"
            variant="primary"
            leftIcon={<Play className="h-5 w-5 fill-current" />}
            onClick={handleStart}
            className="px-8 text-base font-bold shadow-md"
          >
            Start Focus
          </Button>
        )}

        <Button
          size="lg"
          variant="outline"
          leftIcon={<RotateCcw className="h-4 w-4" />}
          onClick={handleReset}
          disabled={status === 'idle'}
        >
          Reset
        </Button>

        <Button
          size="lg"
          variant="ghost"
          leftIcon={<SkipForward className="h-4 w-4" />}
          onClick={handleSkip}
        >
          Skip
        </Button>
      </div>

      {/* Course Association Selector */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 w-full max-w-sm flex items-center justify-center gap-3">
        <span className="text-xs font-semibold text-slate-500">Studying For:</span>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 shadow-xs cursor-pointer focus:ring-2 focus:ring-brand-500"
        >
          <option value="general">General Study / Revision</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Completion Dialog Prompt */}
      {showCompletionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pomodoro Completed!
                </h3>
                <p className="text-xs text-slate-500">
                  {completedSessionData?.durationMinutes} minutes of focused study logged
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  How was your focus depth?
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSessionRating(star as 1 | 2 | 3 | 4 | 5)}
                      className="p-1 text-slate-300 hover:text-amber-500 focus:outline-hidden"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          star <= sessionRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-slate-500 ml-2">
                    {sessionRating === 5
                      ? 'Deep Flow'
                      : sessionRating === 4
                      ? 'High Focus'
                      : sessionRating === 3
                      ? 'Moderate'
                      : sessionRating === 2
                      ? 'Slightly Distracted'
                      : 'Very Distracted'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mastered Dijkstra algorithm, read pages 45-60"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCompletionPrompt(false);
                  setCompletedSessionData(null);
                }}
              >
                Skip Record
              </Button>
              <Button
                size="sm"
                onClick={handleSaveCompletedSession}
                isLoading={isSavingSession}
              >
                Save Record
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Settings Modal */}
      <TimerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        soundEnabled={soundEnabled}
        onSave={(newSettings) => {
          if (typeof newSettings.soundEnabled === 'boolean') {
            setSoundEnabled(newSettings.soundEnabled);
          }
          onUpdateSettings(newSettings);
        }}
      />
    </Card>
  );
};
