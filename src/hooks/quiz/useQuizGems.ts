import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAllBadges } from '@/utils/badgeData';
import { STORAGE_KEYS } from '@/utils/quizData';

export const useQuizGems = (
  setNextBadgeThreshold: React.Dispatch<React.SetStateAction<number>>
) => {
  const [userGems, setUserGems] = useState(0);
  const [dailyGems, setDailyGems] = useState(0);
  const [monthlyGems, setMonthlyGems] = useState(0);
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
  
  const fetchGems = useCallback(async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      setUserGems(0);
      setDailyGems(0);
      setMonthlyGems(0);
      setQuestionsAnswered(0);
      return;
    }
    
    try {
      console.log('Fetching gems data for user:', userId);
      
      const [dailyResult, monthlyResult, profileResult, answersResult] = await Promise.all([
        supabase
          .from('daily_points')
          .select('gems:points')
          .eq('user_id', userId)
          .eq('date', new Date().toISOString().split('T')[0])
          .maybeSingle(),
          
        supabase
          .from('monthly_points')
          .select('gems:points')
          .eq('user_id', userId)
          .eq('month', `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`)
          .maybeSingle(),
          
        supabase
          .from('profiles')
          .select('gems:points')
          .eq('id', userId)
          .maybeSingle(),
          
        supabase
          .from('quiz_answers')
          .select('question_id', { count: 'exact', head: false })
          .eq('user_id', userId)
      ]);
      
      let hasChanges = false;
      
      if (dailyResult.data) {
        const gemsValue = Number(dailyResult.data.gems);
        if (gemsValue !== dailyGems) {
          setDailyGems(gemsValue);
          localStorage.setItem(`daily_gems_${new Date().toISOString().split('T')[0]}`, gemsValue.toString());
          console.log('Daily gems set to:', gemsValue);
          hasChanges = true;
        }
      } else if (dailyGems !== 0) {
        setDailyGems(0);
        console.log('No daily gems found, set to 0');
        hasChanges = true;
      }
      
      if (monthlyResult.data) {
        const gemsValue = Number(monthlyResult.data.gems);
        if (gemsValue !== monthlyGems) {
          setMonthlyGems(gemsValue);
          localStorage.setItem(`monthly_gems_${new Date().getFullYear()}_${new Date().getMonth()}`, gemsValue.toString());
          console.log('Monthly gems set to:', gemsValue);
          hasChanges = true;
        }
      } else if (monthlyGems !== 0) {
        setMonthlyGems(0);
        console.log('No monthly gems found, set to 0');
        hasChanges = true;
      }
      
      if (profileResult.data) {
        const gemsValue = Number(profileResult.data.gems);
        if (gemsValue !== userGems) {
          setUserGems(gemsValue);
          localStorage.setItem(STORAGE_KEYS.USER_GEMS, gemsValue.toString());
          console.log('User total gems set to:', gemsValue);
          hasChanges = true;
        }
      } else {
        // Fallback to localStorage if profile data is not accessible
        const cachedGems = localStorage.getItem(STORAGE_KEYS.USER_GEMS);
        if (cachedGems) {
          const gemsValue = Number(cachedGems);
          if (gemsValue !== userGems) {
            setUserGems(gemsValue);
            console.log('Using cached gems:', gemsValue);
          }
        }
      }

      if (answersResult.count !== null) {
        const count = answersResult.count;
        if (count !== questionsAnswered) {
          setQuestionsAnswered(count);
          console.log('Questions answered count from DB:', count);
          updateNextBadgeThreshold(count);
          hasChanges = true;
        }
      }

      // Only dispatch event if there were actual changes
      if (hasChanges) {
        window.dispatchEvent(new CustomEvent('gemsUpdated'));
      }
      
    } catch (error) {
      console.error('Error fetching gems:', error);
    }
  }, [updateNextBadgeThreshold, dailyGems, monthlyGems, userGems, questionsAnswered]);
  
  useEffect(() => {
    // Initial fetch only
    fetchGems();
    
    // Poll for updates every minute
    const intervalId = setInterval(fetchGems, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchGems, isLoggedIn]);
  
  return {
    userGems,
    dailyGems,
    monthlyGems,
    questionsAnswered,
    fetchGems,
    updateNextBadgeThreshold
  };
};
