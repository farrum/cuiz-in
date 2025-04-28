
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
    // Check if user is logged in
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
      // Reset points if not logged in
      setUserPoints(0);
      setDailyPoints(0);
      setMonthlyPoints(0);
      setQuestionsAnswered(0);
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    try {
      console.log('Fetching points data for user:', userId);
      
      // Use Promise.all to make parallel requests for better performance
      const [dailyResult, monthlyResult, profileResult, answersResult] = await Promise.all([
        // Get daily points
        supabase
          .from('daily_points')
          .select('points')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle(),
          
        // Get monthly points  
        supabase
          .from('monthly_points')
          .select('points')
          .eq('user_id', userId)
          .eq('month', currentMonth)
          .maybeSingle(),
          
        // Get total user points
        supabase
          .from('profiles')
          .select('points')
          .eq('id', userId)
          .single(),
          
        // Get count of unique questions answered (for accurate question count)
        supabase
          .from('quiz_answers')
          .select('question_id', { count: 'exact', head: false })
          .eq('user_id', userId)
          .is('challenge_id', null) // Only count regular quiz answers, not challenges
      ]);
      
      console.log('Data fetched:', {
        dailyResult, 
        monthlyResult, 
        profileResult, 
        answersResult
      });
        
      // Process daily points
      if (dailyResult.data) {
        const pointsValue = Number(dailyResult.data.points);
        setDailyPoints(pointsValue);
        // Update localStorage for consistency
        localStorage.setItem(`daily_points_${today}`, pointsValue.toString());
        console.log('Daily points set to:', pointsValue);
      } else {
        setDailyPoints(0);
        console.log('No daily points found, set to 0');
      }
      
      // Process monthly points
      if (monthlyResult.data) {
        const pointsValue = Number(monthlyResult.data.points);
        setMonthlyPoints(pointsValue);
        // Update localStorage for consistency
        localStorage.setItem(`monthly_points_${now.getFullYear()}_${now.getMonth()}`, pointsValue.toString());
        console.log('Monthly points set to:', pointsValue);
      } else {
        setMonthlyPoints(0);
        console.log('No monthly points found, set to 0');
      }
      
      // Process user total points
      if (profileResult.data) {
        const pointsValue = Number(profileResult.data.points);
        setUserPoints(pointsValue);
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, pointsValue.toString());
        console.log('User total points set to:', pointsValue);
      }

      // Set questions answered count from database instead of local storage
      if (answersResult.count !== null) {
        const count = answersResult.count;
        setQuestionsAnswered(count);
        console.log('Questions answered count from DB:', count);
        updateNextBadgeThreshold(count);
      }

      // Dispatch an event to notify other components about the updated points
      window.dispatchEvent(new CustomEvent('pointsUpdated'));
      
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  }, [updateNextBadgeThreshold]);
  
  // Set up listeners for points updates
  useEffect(() => {
    // Initial fetch
    fetchPoints();
    
    // Listen for point updates
    window.addEventListener('pointsUpdated', fetchPoints);
    
    // Refresh every minute
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
