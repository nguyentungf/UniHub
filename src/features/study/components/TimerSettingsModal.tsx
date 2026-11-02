import React, { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { Sliders, Bell } from 'lucide-react';
import type { PomodoroSettings } from '@/types';

export interface TimerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PomodoroSettings;
  onSave: (newSettings: PomodoroSettings & { soundEnabled?: boolean }) => void;
  soundEnabled: boolean;
}

export const TimerSettingsModal: React.FC<TimerSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  soundEnabled,
}) => {
  const [workDuration, setWorkDuration] = useState(settings.workDuration);
  const [shortBreak, setShortBreak] = useState(settings.shortBreak);
  const [longBreak, setLongBreak] = useState(settings.longBreak);
  const [longBreakInterval, setLongBreakInterval] = useState(settings.longBreakInterval);
  const [autoStartBreaks, setAutoStartBreaks] = useState(settings.autoStartBreaks);
  const [isSoundEnabled, setIsSoundEnabled] = useState(soundEnabled);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      workDuration: Math.max(1, Math.min(180, Number(workDuration) || 25)),
      shortBreak: Math.max(1, Math.min(60, Number(shortBreak) || 5)),
      longBreak: Math.max(1, Math.min(90, Number(longBreak) || 15)),
      longBreakInterval: Math.max(1, Math.min(12, Number(longBreakInterval) || 4)),
      autoStartBreaks,
      soundEnabled: isSoundEnabled,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pomodoro Timer Settings"
      description="Customize your focus intervals, rest breaks, and study habits"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Focus Work (min)
            </label>
            <input
              type="number"
              min={1}
              max={180}
              value={workDuration}
              onChange={(e) => setWorkDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Short Break (min)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={shortBreak}
              onChange={(e) => setShortBreak(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Long Break (min)
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={longBreak}
              onChange={(e) => setLongBreak(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Long Break Interval (every N cycles)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={10}
              value={longBreakInterval}
              onChange={(e) => setLongBreakInterval(Number(e.target.value))}
              className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-brand-500"
              required
            />
            <span className="text-xs text-slate-500">
              Take a long break after every {longBreakInterval} completed pomodoros
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoStartBreaks}
              onChange={(e) => setAutoStartBreaks(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Automatically start rest breaks when a pomodoro finishes
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isSoundEnabled}
              onChange={(e) => setIsSoundEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-slate-400" />
              Play gentle audio chime upon session completion (offline)
            </span>
          </label>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save Preferences
          </Button>
        </div>
      </form>
    </Modal>
  );
};

