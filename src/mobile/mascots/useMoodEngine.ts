import { useSyncExternalStore, useCallback } from 'react';
import type { Mood } from './registry';

interface State {
  window: boolean[]; // last 5 answers (true = correct)
  correctStreak: number;
  wrongStreak: number;
  lastMood: Mood;
  /** flips when we should play a one-off "forgive" celebration */
  pendingForgive: boolean;
}

const WINDOW_SIZE = 5;

const state: State = {
  window: [],
  correctStreak: 0,
  wrongStreak: 0,
  lastMood: 'neutral',
  pendingForgive: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function resolveMood(): Mood {
  if (state.correctStreak >= 5) return 'hype';
  if (state.correctStreak >= 2) return 'excited';
  if (state.wrongStreak >= 3) return 'angry';
  if (state.wrongStreak === 2) return 'upset';
  if (state.wrongStreak === 1) return 'sad';
  const accuracy = state.window.length
    ? state.window.filter(Boolean).length / state.window.length
    : 0.5;
  if (accuracy >= 0.6) return 'cheer';
  return 'neutral';
}

export const moodEngine = {
  recordAnswer(correct: boolean) {
    state.window.push(correct);
    if (state.window.length > WINDOW_SIZE) state.window.shift();
    if (correct) {
      const wasAngry = state.wrongStreak >= 3;
      state.correctStreak += 1;
      state.wrongStreak = 0;
      state.pendingForgive = wasAngry;
    } else {
      state.wrongStreak += 1;
      state.correctStreak = 0;
      state.pendingForgive = false;
    }
    state.lastMood = state.pendingForgive ? 'forgive' : resolveMood();
    emit();
  },
  reset() {
    state.window = [];
    state.correctStreak = 0;
    state.wrongStreak = 0;
    state.lastMood = 'neutral';
    state.pendingForgive = false;
    emit();
  },
  /** mood that idle surfaces (hub/profile) should display */
  idleMood(): Mood {
    return resolveMood();
  },
  accuracy(): { accuracy: number; sample: number } {
    const sample = state.window.length;
    const accuracy = sample ? state.window.filter(Boolean).length / sample : 0;
    return { accuracy, sample };
  },
  snapshot(): State {
    return state;
  },
};

function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
function getSnapshot() { return state.lastMood + ':' + state.correctStreak + ':' + state.wrongStreak; }

export function useMoodEngine() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const record = useCallback((correct: boolean) => moodEngine.recordAnswer(correct), []);
  return {
    mood: state.lastMood,
    correctStreak: state.correctStreak,
    wrongStreak: state.wrongStreak,
    accuracy: state.window.length ? state.window.filter(Boolean).length / state.window.length : 0,
    sample: state.window.length,
    record,
    reset: moodEngine.reset,
  };
}

/** map a mood to a motivation context key (reuses useMotivation's vocabulary). */
export function moodToContext(mood: Mood): 'on_correct' | 'on_wrong' | 'streak_milestone' {
  switch (mood) {
    case 'hype':
    case 'excited':
      return 'streak_milestone';
    case 'cheer':
    case 'forgive':
      return 'on_correct';
    case 'sad':
    case 'upset':
    case 'angry':
      return 'on_wrong';
    default:
      return 'on_correct';
  }
}