
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAllBadges } from '@/utils/badgeData';
import { STORAGE_KEYS } from '@/utils/quizData';

export const useQuizPoints = (
  setNextBadgeThreshold: React.Dispatch<React.SetStateAction<number>>
) => {
  const [userPoints, setUserPoints] = useState(0);
  const [dailyPoints, setDailyPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  
  const updateNextBadgeThreshold = useCallback((questionCount: number) => {
    const allBadges = getAllBadges();
    const questionBadges = allBadges.filter(badge => 
      badge.criteria.type === 'questions_answered'
    ).sort((a, b) => a.criteria.threshold - b.criteria.threshold);
    
    for (const badge of questionBadges) {
      if (questionCount < badge.criteria.threshold) {
        setNextBadgeThreshold(badge.criteria.threshold);
        return;
      }
    }
    
    if (questionBadges.length > 0) {
      const highestThreshold = questionBadges[questionBadges.length - 1].criteria.threshold;
      setNextBadgeThreshold(highestThreshold);
    }
  }, [setNextBadgeThreshold]);
  
  const fetchPoints = useCallback(async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) return;
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    try {
      const { data: dailyData } = await supabase
        .from('daily_points')
        .select('points')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
        
      if (dailyData) {
        setDailyPoints(Number(dailyData.points));
      } else {
        setDailyPoints(0);
      }
      
      const { data: monthlyData } = await supabase
        .from('monthly_points')
        .select('points')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .maybeSingle();
        
      if (monthlyData) {
        setMonthlyPoints(Number(monthlyData.points));
      } else {
        setMonthlyPoints(0);
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
        
      if (profileData) {
        setUserPoints(Number(profileData.points));
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, profileData.points.toString());
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  }, []);
  
  return {
    userPoints,
    dailyPoints,
    monthlyPoints,
    fetchPoints,
    updateNextBadgeThreshold
  };
};
