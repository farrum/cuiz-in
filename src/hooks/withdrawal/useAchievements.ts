
import { useState, useEffect } from 'react';
import { Achievement } from '@/types/achievement';

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('quiz_app_achievements');
    return saved ? JSON.parse(saved) : [];
  });

  return {
    achievements,
    setAchievements,
  };
};
