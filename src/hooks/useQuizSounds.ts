
import { useCallback, useRef } from 'react';

// Web Audio API-based sound effects for instant playback
export const useQuizSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Fade in and out for smoother sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, [getAudioContext]);

  const playCorrectSound = useCallback(() => {
    // Pleasant ascending chime
    playTone(523.25, 0.15, 'sine', 0.25); // C5
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.25), 100); // E5
    setTimeout(() => playTone(783.99, 0.2, 'sine', 0.3), 200); // G5
  }, [playTone]);

  const playWrongSound = useCallback(() => {
    // Descending buzzer
    playTone(300, 0.15, 'sawtooth', 0.15);
    setTimeout(() => playTone(250, 0.2, 'sawtooth', 0.15), 100);
  }, [playTone]);

  const playTickSound = useCallback(() => {
    // Quick tick for timer warning
    playTone(800, 0.05, 'square', 0.1);
  }, [playTone]);

  const playTimeUpSound = useCallback(() => {
    // Urgent buzzer
    playTone(400, 0.1, 'square', 0.2);
    setTimeout(() => playTone(350, 0.1, 'square', 0.2), 120);
    setTimeout(() => playTone(300, 0.15, 'square', 0.2), 240);
  }, [playTone]);

  const playSelectSound = useCallback(() => {
    // Subtle click
    playTone(600, 0.03, 'sine', 0.15);
  }, [playTone]);

  const playNewBestSound = useCallback(() => {
    // Celebratory fanfare
    playTone(523.25, 0.15, 'sine', 0.25); // C5
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.25), 100); // E5
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.25), 200); // G5
    setTimeout(() => playTone(1046.50, 0.3, 'sine', 0.35), 300); // C6
  }, [playTone]);

  return {
    playCorrectSound,
    playWrongSound,
    playTickSound,
    playTimeUpSound,
    playSelectSound,
    playNewBestSound,
  };
};
