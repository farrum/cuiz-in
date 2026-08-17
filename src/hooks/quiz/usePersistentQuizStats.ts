
import { useState, useEffect, useCallback } from 'react';

const STATS_KEY = 'cuizin_quiz_stats';

interface QuizStats {
  streak: number;
  questionsAnswered: number;
  correctAnswered: number;
  lastDate: string; // YYYY-MM-DD format for daily reset
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getDefaultStats = (): QuizStats => ({
  streak: 0,
  questionsAnswered: 0,
  correctAnswered: 0,
  lastDate: getTodayDate()
});

const loadStats = (): QuizStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) return getDefaultStats();
    
    const stats: QuizStats = JSON.parse(stored);
    const today = getTodayDate();
    
    // If it's a new day, reset stats
    if (stats.lastDate !== today) {
      console.log('New day detected, resetting quiz stats');
      return getDefaultStats();
    }
    
    return stats;
  } catch (err) {
    console.error('Error loading quiz stats:', err);
    return getDefaultStats();
  }
};

const saveStats = (stats: QuizStats) => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Error saving quiz stats:', err);
  }
};

export const usePersistentQuizStats = () => {
  const [streak, setStreakState] = useState(() => loadStats().streak);
  const [questionsAnswered, setQuestionsAnsweredState] = useState(() => loadStats().questionsAnswered);
  const [correctAnswered, setCorrectAnsweredState] = useState(() => loadStats().correctAnswered);
  
  // Persist to localStorage whenever values change
  useEffect(() => {
    const stats: QuizStats = {
      streak,
      questionsAnswered,
      correctAnswered,
      lastDate: getTodayDate()
    };
    saveStats(stats);
  }, [streak, questionsAnswered, correctAnswered]);
  
  // Check for day change on visibility change (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const stored = loadStats();
        // If day changed, reset
        if (stored.streak === 0 && stored.questionsAnswered === 0) {
          setStreakState(0);
          setQuestionsAnsweredState(0);
          setCorrectAnsweredState(0);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  const setStreak = useCallback((value: number | ((prev: number) => number)) => {
    setStreakState(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      return newValue;
    });
  }, []);
  
  const setQuestionsAnswered = useCallback((value: number | ((prev: number) => number)) => {
    setQuestionsAnsweredState(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      return newValue;
    });
  }, []);
  
  const incrementStreak = useCallback(() => {
    setStreakState(prev => prev + 1);
  }, []);
  
  const resetStreak = useCallback(() => {
    setStreakState(0);
  }, []);
  
  const incrementQuestionsAnswered = useCallback(() => {
    setQuestionsAnsweredState(prev => prev + 1);
  }, []);

  const incrementCorrectAnswered = useCallback(() => {
    setCorrectAnsweredState(prev => {
      const next = prev + 1;
      try {
        const currentLifetime = Number(localStorage.getItem('cuizin_lifetime_wins') || '0');
        localStorage.setItem('cuizin_lifetime_wins', String(currentLifetime + 1));
      } catch (e) {
        console.error('Failed to update lifetime wins', e);
      }
      return next;
    });
  }, []);
  
  // Sync with database value if higher (in case user answered on another device)
  const syncWithDatabase = useCallback((dbQuestionsAnswered: number) => {
    if (dbQuestionsAnswered > 0) {
      setQuestionsAnsweredState(prev => Math.max(prev, dbQuestionsAnswered));
    }
  }, []);
  
  return {
    streak,
    questionsAnswered,
    correctAnswered,
    setStreak,
    setQuestionsAnswered,
    incrementStreak,
    resetStreak,
    incrementQuestionsAnswered,
    incrementCorrectAnswered,
    syncWithDatabase
  };
};
