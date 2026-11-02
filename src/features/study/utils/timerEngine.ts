import type { PomodoroSettings } from '../../../types/index.ts';

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerEngineOptions {
  settings?: Partial<PomodoroSettings>;
  initialMode?: PomodoroMode;
  onTick?: (remainingSeconds: number, progressPercent: number) => void;
  onComplete?: (completedMode: PomodoroMode, cycleCount: number) => void;
  onStatusChange?: (status: TimerStatus) => void;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
};

export class TimerEngine {
  private mode: PomodoroMode;
  private status: TimerStatus = 'idle';
  private settings: PomodoroSettings;
  private remainingSeconds: number;
  private totalDurationSeconds: number;
  private endTimestamp: number | null = null;
  private hasRecordedCompletion = false;
  private completedWorkCycles = 0;

  private onTick?: (remainingSeconds: number, progressPercent: number) => void;
  private onComplete?: (completedMode: PomodoroMode, cycleCount: number) => void;
  private onStatusChange?: (status: TimerStatus) => void;

  constructor(options: TimerEngineOptions = {}) {
    this.settings = { ...DEFAULT_POMODORO_SETTINGS, ...options.settings };
    this.mode = options.initialMode || 'work';
    this.onTick = options.onTick;
    this.onComplete = options.onComplete;
    this.onStatusChange = options.onStatusChange;

    this.totalDurationSeconds = this.getDurationForMode(this.mode);
    this.remainingSeconds = this.totalDurationSeconds;
  }

  public getMode(): PomodoroMode {
    return this.mode;
  }

  public getStatus(): TimerStatus {
    return this.status;
  }

  public getRemainingSeconds(): number {
    return this.remainingSeconds;
  }

  public getTotalDurationSeconds(): number {
    return this.totalDurationSeconds;
  }

  public getCompletedWorkCycles(): number {
    return this.completedWorkCycles;
  }

  public getSettings(): PomodoroSettings {
    return { ...this.settings };
  }

  public getProgressPercent(): number {
    if (this.totalDurationSeconds <= 0) return 0;
    const elapsed = this.totalDurationSeconds - this.remainingSeconds;
    return Math.min(100, Math.max(0, Math.round((elapsed / this.totalDurationSeconds) * 100)));
  }

  public getDurationForMode(mode: PomodoroMode): number {
    switch (mode) {
      case 'work':
        return Math.max(1, Math.round(this.settings.workDuration * 60));
      case 'shortBreak':
        return Math.max(1, Math.round(this.settings.shortBreak * 60));
      case 'longBreak':
        return Math.max(1, Math.round(this.settings.longBreak * 60));
    }
  }

  public updateSettings(newSettings: Partial<PomodoroSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    if (this.status === 'idle') {
      this.totalDurationSeconds = this.getDurationForMode(this.mode);
      this.remainingSeconds = this.totalDurationSeconds;
      this.notifyTick();
    }
  }

  public setCustomDuration(seconds: number): void {
    const clamped = Math.max(1, Math.round(seconds));
    this.totalDurationSeconds = clamped;
    this.remainingSeconds = clamped;
    this.endTimestamp = null;
    this.hasRecordedCompletion = false;
    this.notifyTick();
  }

  public switchMode(newMode: PomodoroMode): void {
    this.mode = newMode;
    this.totalDurationSeconds = this.getDurationForMode(newMode);
    this.remainingSeconds = this.totalDurationSeconds;
    this.endTimestamp = null;
    this.hasRecordedCompletion = false;
    this.setStatus('idle');
    this.notifyTick();
  }

  public start(now: number = Date.now()): void {
    if (this.status === 'running') return;

    if (this.status === 'completed' || this.remainingSeconds <= 0) {
      this.remainingSeconds = this.totalDurationSeconds;
    }

    this.endTimestamp = now + this.remainingSeconds * 1000;
    this.hasRecordedCompletion = false;
    this.setStatus('running');
    this.notifyTick();
  }

  public pause(now: number = Date.now()): void {
    if (this.status !== 'running') return;

    if (this.endTimestamp !== null) {
      const remainingMs = Math.max(0, this.endTimestamp - now);
      this.remainingSeconds = Math.ceil(remainingMs / 1000);
    }

    this.endTimestamp = null;
    this.setStatus('paused');
    this.notifyTick();
  }

  public resume(now: number = Date.now()): void {
    if (this.status === 'paused') {
      this.start(now);
    }
  }

  public reset(): void {
    this.endTimestamp = null;
    this.hasRecordedCompletion = false;
    this.remainingSeconds = this.totalDurationSeconds;
    this.setStatus('idle');
    this.notifyTick();
  }

  public skip(): void {
    this.endTimestamp = null;
    this.hasRecordedCompletion = false;

    if (this.mode === 'work') {
      this.completedWorkCycles += 1;
      const isLongBreak = this.completedWorkCycles % this.settings.longBreakInterval === 0;
      this.switchMode(isLongBreak ? 'longBreak' : 'shortBreak');
    } else {
      this.switchMode('work');
    }
  }

  /**
   * Precision tick calculation based on real wall-clock timestamps.
   * Call this on interval or requestAnimationFrame.
   */
  public tick(now: number = Date.now()): void {
    if (this.status !== 'running' || this.endTimestamp === null) {
      return;
    }

    const remainingMs = this.endTimestamp - now;

    if (remainingMs <= 0) {
      this.remainingSeconds = 0;
      this.notifyTick();

      // Guard against duplicate records
      if (!this.hasRecordedCompletion) {
        this.hasRecordedCompletion = true;
        this.setStatus('completed');

        const completedMode = this.mode;
        if (completedMode === 'work') {
          this.completedWorkCycles += 1;
        }

        if (this.onComplete) {
          this.onComplete(completedMode, this.completedWorkCycles);
        }

        // Automatic mode transition if autoStartBreaks is configured
        if (completedMode === 'work') {
          const isLongBreak = this.completedWorkCycles % this.settings.longBreakInterval === 0;
          const nextMode: PomodoroMode = isLongBreak ? 'longBreak' : 'shortBreak';
          if (this.settings.autoStartBreaks) {
            this.switchMode(nextMode);
            this.start(now);
          }
        }
      }
    } else {
      const computedSec = Math.ceil(remainingMs / 1000);
      if (computedSec !== this.remainingSeconds) {
        this.remainingSeconds = computedSec;
        this.notifyTick();
      }
    }
  }

  /**
   * Resynchronize timer when page visibility changes (tab backgrounded/resumed)
   */
  public handleVisibilityChange(isVisible: boolean, now: number = Date.now()): void {
    if (!isVisible) {
      // In background: ensure endTimestamp is anchored to current remaining seconds
      if (this.status === 'running' && this.endTimestamp === null) {
        this.endTimestamp = now + this.remainingSeconds * 1000;
      }
      return;
    }

    // Returning to foreground: immediately calculate exact elapsed wall time
    if (this.status === 'running') {
      this.tick(now);
    }
  }

  private setStatus(nextStatus: TimerStatus): void {
    if (this.status !== nextStatus) {
      this.status = nextStatus;
      if (this.onStatusChange) {
        this.onStatusChange(nextStatus);
      }
    }
  }

  private notifyTick(): void {
    if (this.onTick) {
      this.onTick(this.remainingSeconds, this.getProgressPercent());
    }
  }
}

