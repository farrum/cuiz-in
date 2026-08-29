import { useCallback, useEffect, useState } from 'react';

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizPreferences {
  category: string | null;
  difficulty: QuizDifficulty | null;
}

/** Shared with the mobile Quiz Story screen so prefs follow the player. */
export const QUIZ_PREFS_KEY = 'quiz_story_prefs';
export const QUIZ_PREFS_EVENT = 'cuizin:quiz-prefs-changed';

export const readQuizPreferences = (): QuizPreferences => {
  try {
    const raw = JSON.parse(localStorage.getItem(QUIZ_PREFS_KEY) || '{}');
    return {
      category: raw.category ?? null,
      difficulty: (raw.difficulty ?? null) as QuizDifficulty | null,
    };
  } catch {
    return { category: null, difficulty: null };
  }
};

export const useQuizPreferences = () => {
  const [prefs, setPrefsState] = useState<QuizPreferences>(() => readQuizPreferences());

  useEffect(() => {
    const sync = () => setPrefsState(readQuizPreferences());
    window.addEventListener(QUIZ_PREFS_EVENT, sync);
    return () => window.removeEventListener(QUIZ_PREFS_EVENT, sync);
  }, []);

  const setPrefs = useCallback((next: QuizPreferences) => {
    localStorage.setItem(QUIZ_PREFS_KEY, JSON.stringify(next));
    setPrefsState(next);
    window.dispatchEvent(new CustomEvent(QUIZ_PREFS_EVENT));
  }, []);

  return { prefs, setPrefs };
};

export default useQuizPreferences;
