
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  STORAGE_KEYS, 
  QuizQuestion, 
  getRandomQuestion,
  syncAdSlotsToLocal
} from '@/utils/quizData';
import { getAllBadges } from '@/utils/badgeData';

export const useQuizState = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [userGems, setUserGems] = useState(0);
  const [dailyGems, setDailyGems] = useState(0);
  const [monthlyGems, setMonthlyGems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [adsSynced, setAdsSynced] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [nextBadgeThreshold, setNextBadgeThreshold] = useState(10);
  const [isSuspended, setIsSuspended] = useState(false);
  const [forceReloadAds, setForceReloadAds] = useState(0);
  const { toast } = useToast();
  
  const updateNextBadgeThreshold = (questionCount: number) => {
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
  };
  
  const checkSuspensionStatus = async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      navigate('/login');
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('suspended')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error checking suspension status:', error);
        return false;
      }
      
      if (data && data.suspended) {
        setIsSuspended(true);
        navigate('/profile', { replace: true });
        toast({
          title: "Account Suspended",
          description: "Your account is currently suspended. Please request reactivation from your profile page.",
          variant: "destructive"
        });
        return false;
      }
      
      setIsSuspended(false);
      return true;
    } catch (error) {
      console.error('Failed to check suspension status:', error);
      return false;
    }
  };
  
  const loadInitialData = async () => {
    const savedGems = parseFloat(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '0');
    setUserGems(savedGems);
    
    const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
    setQuestionsAnswered(completedQuestions.length);
    
    try {
      console.log('Syncing ad slots from server...');
      const { data: adSlots, error } = await supabase
        .from('ad_slots')
        .select('*')
        .eq('active', true);
        
      if (!error && adSlots) {
        console.log('Successfully loaded ad slots:', adSlots.length);
        localStorage.setItem('quiz_app_ad_slots', JSON.stringify(adSlots));
        setAdsSynced(true);
        
        setForceReloadAds(prev => prev + 1);
        
        window.dispatchEvent(new CustomEvent('adSlotsUpdated', { detail: adSlots }));
      } else {
        console.error('Error fetching ad slots:', error);
        await syncAdSlotsToLocal();
        setAdsSynced(true);
      }
    } catch (err) {
      console.error('Error syncing ad slots:', err);
      await syncAdSlotsToLocal();
      setAdsSynced(true);
    }
    
    loadNewQuestion();
    fetchGems();
    updateNextBadgeThreshold(JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]').length);
  };
  
  const handleAdSlotsUpdated = () => {
    console.log('Ad slots updated, refreshing ad display...');
    setForceReloadAds(prev => prev + 1);
  };
  
  const fetchGems = async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) return;
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    try {
      const { data: dailyData } = await supabase
        .from('daily_points')
        .select('gems:points')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
        
      if (dailyData) {
        setDailyGems(Number(dailyData.gems));
      } else {
        setDailyGems(0);
      }
      
      const { data: monthlyData } = await supabase
        .from('monthly_points')
        .select('gems:points')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .maybeSingle();
        
      if (monthlyData) {
        setMonthlyGems(Number(monthlyData.gems));
      } else {
        setMonthlyGems(0);
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('points, suspended')
        .eq('id', userId)
        .single();
        
      if (profileData) {
        setUserGems(Number(profileData.gems));
        localStorage.setItem(STORAGE_KEYS.USER_GEMS, profileData.gems.toString());
        
        if (profileData.suspended && !isSuspended) {
          setIsSuspended(true);
          navigate('/profile', { replace: true });
          toast({
            title: "Account Suspended",
            description: "Your account is currently suspended. Please request reactivation from your profile page.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error fetching gems:', error);
    }
  };
  
  const loadNewQuestion = async () => {
    setIsLoading(true);
    
    try {
      const question = await getRandomQuestion();
      setCurrentQuestion(question);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    }
  };
  
  const handleQuestionComplete = (isCorrect: boolean) => {
    if (!currentQuestion) return;
    
    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    updateNextBadgeThreshold(newQuestionsAnswered);
    
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      if (newStreak % 5 === 0) {
        const bonusGems = 5;
        toast({
          title: `${newStreak} Question Streak!`,
          description: `Bonus ${bonusGems} gems awarded!`,
        });
      }
    } else {
      setStreak(0);
    }
    
    setTimeout(() => {
      fetchGems();
      window.dispatchEvent(new Event('gemsUpdated'));
    }, 1000);
    
    loadNewQuestion();
  };

  const showMotivationalMessage = () => {
    if (questionsAnswered > 0 && questionsAnswered % 3 === 0) {
      const motivationalMessages = [
        "You're doing great! Keep going!",
        "Your brain is getting stronger with every question!",
        "You're on a roll! Can you answer a few more?",
        "Learning is an adventure, and you're acing it!",
        "Keep up this momentum! You're amazing!"
      ];
      
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMotivationMessage(randomMessage);
      setShowMotivation(true);
      
      setTimeout(() => {
        setShowMotivation(false);
      }, 5000);
    }
  };

  return {
    currentQuestion,
    streak,
    questionsAnswered,
    userGems,
    dailyGems,
    monthlyGems,
    isLoading,
    adsSynced,
    showMotivation,
    motivationMessage,
    nextBadgeThreshold,
    isSuspended,
    forceReloadAds,
    checkSuspensionStatus,
    loadInitialData,
    handleAdSlotsUpdated,
    fetchGems,
    loadNewQuestion,
    handleQuestionComplete,
    showMotivationalMessage,
    setForceReloadAds
  };
};
