/**
 * Synthesizes a gentle celebratory chime on Pomodoro completion using Web Audio API.
 * Works 100% offline without external audio files or network requests.
 */
export function playChimeSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Harmonic chord: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
    const notes = [523.25, 659.25, 783.99];
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.14);

      gain.gain.setValueAtTime(0, startTime + idx * 0.14);
      gain.gain.linearRampToValueAtTime(0.12, startTime + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.14 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.14);
      osc.stop(startTime + idx * 0.14 + 0.5);
    });
  } catch {
    // Fail silently if browser audio is blocked or restricted
  }
}

