import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TimerEngine, DEFAULT_POMODORO_SETTINGS } from './timerEngine.ts';

describe('Pomodoro Timer Engine Logic & Accuracy Tests', () => {
  it('initializes with default durations and work mode', () => {
    const timer = new TimerEngine({
      settings: {
        workDuration: 25,
        shortBreak: 5,
        longBreak: 15,
      },
    });

    assert.equal(timer.getMode(), 'work');
    assert.equal(timer.getStatus(), 'idle');
    assert.equal(timer.getRemainingSeconds(), 25 * 60);
    assert.equal(timer.getTotalDurationSeconds(), 25 * 60);
    assert.equal(timer.getProgressPercent(), 0);
  });

  it('supports custom focus and break durations', () => {
    const timer = new TimerEngine({
      settings: {
        workDuration: 45,
        shortBreak: 10,
        longBreak: 20,
      },
    });

    assert.equal(timer.getRemainingSeconds(), 45 * 60);

    timer.switchMode('shortBreak');
    assert.equal(timer.getMode(), 'shortBreak');
    assert.equal(timer.getRemainingSeconds(), 10 * 60);

    timer.switchMode('longBreak');
    assert.equal(timer.getMode(), 'longBreak');
    assert.equal(timer.getRemainingSeconds(), 20 * 60);
  });

  it('accurately computes elapsed time from wall-clock timestamps (preventing interval drift)', () => {
    const timer = new TimerEngine({
      settings: { workDuration: 25 },
    });

    const startTime = 1700000000000;
    timer.start(startTime);
    assert.equal(timer.getStatus(), 'running');

    // Simulate 300 seconds (5 minutes) passing in reality
    const tickTime = startTime + 300 * 1000;
    timer.tick(tickTime);

    // Remaining should be 25*60 - 300 = 1200s (20 mins)
    assert.equal(timer.getRemainingSeconds(), 1200);
    assert.equal(timer.getProgressPercent(), 20); // 300/1500 = 20%
  });

  it('pauses and resumes without losing accumulated elapsed time', () => {
    const timer = new TimerEngine({
      settings: { workDuration: 25 },
    });

    const startTime = 1700000000000;
    timer.start(startTime);

    // Run for 100 seconds
    timer.pause(startTime + 100 * 1000);
    assert.equal(timer.getStatus(), 'paused');
    assert.equal(timer.getRemainingSeconds(), 25 * 60 - 100);

    // Wait 50 seconds while paused
    const resumeTime = startTime + 150 * 1000;
    timer.resume(resumeTime);
    assert.equal(timer.getStatus(), 'running');
    assert.equal(timer.getRemainingSeconds(), 25 * 60 - 100);

    // Run 50 more seconds
    timer.tick(resumeTime + 50 * 1000);
    assert.equal(timer.getRemainingSeconds(), 25 * 60 - 150);
  });

  it('handles page visibility changes seamlessly when tab is restored from background', () => {
    const timer = new TimerEngine({
      settings: { workDuration: 25 },
    });

    const startTime = 1700000000000;
    timer.start(startTime);

    // User switches tab (hidden)
    timer.handleVisibilityChange(false, startTime + 10 * 1000);

    // Tab was in background for 600 seconds (10 minutes)
    const restoreTime = startTime + 610 * 1000;
    timer.handleVisibilityChange(true, restoreTime);

    // Remaining should immediately catch up to wall-clock time
    assert.equal(timer.getRemainingSeconds(), 25 * 60 - 610);
  });

  it('triggers onComplete when timer expires in background during visibility change', () => {
    let completionCalls = 0;
    let completedMode: string | null = null;

    const timer = new TimerEngine({
      settings: { workDuration: 25 },
      onComplete: (mode) => {
        completionCalls += 1;
        completedMode = mode;
      },
    });

    const startTime = 1700000000000;
    timer.start(startTime);

    // Tab is hidden
    timer.handleVisibilityChange(false, startTime + 10 * 1000);

    // Tab returns after 30 minutes (timer expired 5 mins ago)
    const returnTime = startTime + 30 * 60 * 1000;
    timer.handleVisibilityChange(true, returnTime);

    assert.equal(timer.getStatus(), 'completed');
    assert.equal(timer.getRemainingSeconds(), 0);
    assert.equal(completionCalls, 1);
    assert.equal(completedMode, 'work');
  });

  it('CRITICAL: Prevents duplicate study records on subsequent ticks or visibility events', () => {
    let completionCount = 0;

    const timer = new TimerEngine({
      settings: { workDuration: 10 },
      onComplete: () => {
        completionCount += 1;
      },
    });

    const startTime = 1700000000000;
    timer.start(startTime);

    const finishTime = startTime + 10 * 60 * 1000;
    // Tick at finish time
    timer.tick(finishTime);
    assert.equal(completionCount, 1);

    // Repeated ticks after completion
    timer.tick(finishTime + 1000);
    timer.tick(finishTime + 5000);
    timer.handleVisibilityChange(true, finishTime + 10000);

    // Ensure completion callback was called ONLY once
    assert.equal(completionCount, 1);
  });

  it('cycles between pomodoros and breaks according to longBreakInterval', () => {
    const timer = new TimerEngine({
      settings: {
        workDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      },
    });

    assert.equal(timer.getMode(), 'work');

    // Skip cycle 1
    timer.skip();
    assert.equal(timer.getMode(), 'shortBreak');
    assert.equal(timer.getCompletedWorkCycles(), 1);

    // Skip break 1
    timer.skip();
    assert.equal(timer.getMode(), 'work');

    // Skip cycle 2
    timer.skip();
    assert.equal(timer.getMode(), 'shortBreak');
    assert.equal(timer.getCompletedWorkCycles(), 2);

    // Skip break 2
    timer.skip();
    assert.equal(timer.getMode(), 'work');

    // Skip cycle 3
    timer.skip();
    assert.equal(timer.getMode(), 'shortBreak');
    assert.equal(timer.getCompletedWorkCycles(), 3);

    // Skip break 3
    timer.skip();
    assert.equal(timer.getMode(), 'work');

    // Skip cycle 4 -> long break trigger!
    timer.skip();
    assert.equal(timer.getMode(), 'longBreak');
    assert.equal(timer.getCompletedWorkCycles(), 4);
    assert.equal(timer.getRemainingSeconds(), 15 * 60);
  });

  it('resets timer state properly on reset()', () => {
    const timer = new TimerEngine({
      settings: { workDuration: 25 },
    });

    timer.start();
    timer.tick(Date.now() + 10000);
    timer.reset();

    assert.equal(timer.getStatus(), 'idle');
    assert.equal(timer.getRemainingSeconds(), 25 * 60);
    assert.equal(timer.getProgressPercent(), 0);
  });
});

