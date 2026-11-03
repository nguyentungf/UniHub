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
      title="Cài đặt đồng hồ Pomodoro"
      description="Tùy chỉnh khoảng thời gian tập trung, thời gian nghỉ và thói quen học tập"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Thời gian tập trung (phút)
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
              Nghỉ ngắn (phút)
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
              Nghỉ dài (phút)
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
            Chu kỳ nghỉ dài (mỗi N phiên)
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
              Nghỉ dài sau mỗi {longBreakInterval} phiên Pomodoro hoàn thành
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
              Tự động bắt đầu nghỉ giải lao khi hoàn thành phiên Pomodoro
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
              Phát âm thanh chuông nhẹ khi hoàn thành phiên học
            </span>
          </label>
        </div>

        <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 z-10">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" size="sm">
            Lưu cài đặt
          </Button>
        </div>
      </form>
    </Modal>
  );
};

