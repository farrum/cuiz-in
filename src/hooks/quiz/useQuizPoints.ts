import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAllBadges } from '@/utils/badgeData';
import { STORAGE_KEYS } from '@/utils/quizData';

export const useQuizPoints = (
  setNextBadgeThreshold: React.Dispatch<React.SetStateAction<number>>
) => {
  const [userPoints, setUserPoints] = useState(0);
  const [dailyPoints, setDailyPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  
  useEffect(() => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const username = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    setIsLoggedIn(!!userId && !!username);
  }, []);
  
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
    if (!userId) {
      setUserPoints(0);
      setDailyPoints(0);
      setMonthlyPoints(0);
      setQuestionsAnswered(0);
      return;
    }
    
    try {
      console.log('Fetching points data for user:', userId);
      
      const [dailyResult, monthlyResult, profileResult, answersResult] = await Promise.all([
        supabase
          .from('daily_points')
          .select('points')
          .eq('user_id', userId)
          .eq('date', new Date().toISOString().split('T')[0])
          .maybeSingle(),
          
        supabase
          .from('monthly_points')
          .select('points')
          .eq('user_id', userId)
          .eq('month', `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`)
          .maybeSingle(),
          
        supabase
          .from('profiles')
          .select('points')
          .eq('id', userId)
          .single(),
          
        supabase
          .from('quiz_answers')
          .select('question_id', { count: 'exact', head: false })
          .eq('user_id', userId)
          .is('challenge_id', null)
      ]);
      
      if (dailyResult.data) {
        const pointsValue = Number(dailyResult.data.points);
        setDailyPoints(pointsValue);
        localStorage.setItem(`daily_points_${new Date().toISOString().split('T')[0]}`, pointsValue.toString());
        console.log('Daily points set to:', pointsValue);
      } else {
        setDailyPoints(0);
        console.log('No daily points found, set to 0');
      }
      
      if (monthlyResult.data) {
        const pointsValue = Number(monthlyResult.data.points);
        setMonthlyPoints(pointsValue);
        localStorage.setItem(`monthly_points_${new Date().getFullYear()}_${new Date().getMonth()}`, pointsValue.toString());
        console.log('Monthly points set to:', pointsValue);
      } else {
        setMonthlyPoints(0);
        console.log('No monthly points found, set to 0');
      }
      
      if (profileResult.data) {
        const pointsValue = Number(profileResult.data.points);
        setUserPoints(pointsValue);
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, pointsValue.toString());
        console.log('User total points set to:', pointsValue);
      }

      if (answersResult.count !== null) {
        const count = answersResult.count;
        setQuestionsAnswered(count);
        console.log('Questions answered count from DB:', count);
        updateNextBadgeThreshold(count);
      }

      window.dispatchEvent(new CustomEvent('pointsUpdated'));
      
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  }, [updateNextBadgeThreshold]);
  
  useEffect(() => {
    fetchPoints();
    
    window.addEventListener('pointsUpdated', fetchPoints);
    
    const intervalId = setInterval(fetchPoints, 60000);
    
    return () => {
      window.removeEventListener('pointsUpdated', fetchPoints);
      clearInterval(intervalId);
    };
  }, [fetchPoints, isLoggedIn]);
  
  return {
    userPoints,
    dailyPoints,
    monthlyPoints,
    questionsAnswered,
    fetchPoints,
    updateNextBadgeThreshold
  };
};
