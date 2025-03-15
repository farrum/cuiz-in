
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { 
  STORAGE_KEYS, 
  QuizQuestion,
  getRandomQuestion, 
  calculatePoints,
  logPointsForDay,
  logPointsForMonth,
  DAILY_TARGET,
  getPointsForToday,
  getPointsForMonth,
  MONTHLY_TARGET
} from '@/utils/quizData';
import { 
  syncQuizAnswersToSupabase, 
  syncUserPoints, 
  syncPointsData 
} from '@/integrations/supabase/client';
import { syncAdSlotsToLocal, getSyncStatus } from '@/utils/syncUtils';

export const useQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [dailyPoints, setDailyPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [adsSynced, setAdsSynced] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const { toast } = useToast();
  
  // Initialize on first load
  useEffect(() => {
    // Load user points
    const savedPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setUserPoints(savedPoints);
    
    // Get completed questions
    const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
    setQuestionsAnswered(completedQuestions.length);
    
    // Load daily and monthly points
    setDailyPoints(getPointsForToday());
    setMonthlyPoints(getPointsForMonth());
    
    // Sync ad slots from Supabase
    if (!adsSynced) {
      syncAdSlotsToLocal().then(() => {
        setAdsSynced(true);
        const adSlotsStatus = getSyncStatus('adSlots');
        if (adSlotsStatus.status === 'completed') {
          console.log('Ad slots synced successfully');
        }
      });
    }
    
    // Get first question
    loadNewQuestion();
  }, []);
  
  const loadNewQuestion = () => {
    setIsLoading(true);
    
    // Simulate loading delay for smoother transitions
    setTimeout(() => {
      const question = getRandomQuestion();
      setCurrentQuestion(question);
      setIsLoading(false);
    }, 600);
  };
  
  const handleQuestionComplete = async (isCorrect: boolean) => {
    // Calculate points using the new system
    const pointsEarned = calculatePoints(isCorrect);
    
    // Update user points
    const newTotal = userPoints + pointsEarned;
    setUserPoints(newTotal);
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, newTotal.toString());
    
    // Update daily and monthly points
    logPointsForDay(pointsEarned);
    logPointsForMonth(pointsEarned);
    
    // Refresh daily and monthly points
    const updatedDailyPoints = getPointsForToday();
    const updatedMonthlyPoints = getPointsForMonth();
    setDailyPoints(updatedDailyPoints);
    setMonthlyPoints(updatedMonthlyPoints);
    
    // Save question answer to history
    if (currentQuestion) {
      const username = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      const userAnswer = {
        id: crypto.randomUUID(),
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        options: currentQuestion.options,
        selectedOption: isCorrect ? currentQuestion.correctAnswer : "incorrect answer",
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: isCorrect,
        pointsEarned: pointsEarned,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        timestamp: new Date().toISOString()
      };
      
      // Update local history
      const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_QUIZ_HISTORY) || '[]');
      history.push(userAnswer);
      localStorage.setItem(STORAGE_KEYS.USER_QUIZ_HISTORY, JSON.stringify(history));
      
      // Sync to Supabase if user is logged in
      if (username) {
        try {
          setSyncingData(true);
          // Sync points and quiz answer to Supabase
          await syncUserPoints(username, newTotal);
          await syncPointsData(username);
          await syncQuizAnswersToSupabase(username);
          setSyncingData(false);
        } catch (error) {
          console.error('Error syncing quiz data:', error);
          setSyncingData(false);
        }
      }
    }
    
    // Check for daily target completion
    if (updatedDailyPoints >= DAILY_TARGET && dailyPoints < DAILY_TARGET) {
      toast({
        title: "Daily Target Achieved!",
        description: "Congratulations! You've reached your daily target of 400 points.",
      });
    }
    
    // Check for monthly target completion
    if (updatedMonthlyPoints >= MONTHLY_TARGET && monthlyPoints < MONTHLY_TARGET) {
      toast({
        title: "Monthly Target Achieved!",
        description: "Amazing! You've reached your monthly target of 12,000 points. ₹8,000 reward is available for withdrawal!",
      });
    }
    
    window.dispatchEvent(new Event('pointsUpdated'));
    
    // Update questions answered
    setQuestionsAnswered(prev => prev + 1);
    
    // Update streak
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Bonus for streaks
      if (newStreak % 5 === 0) {
        const bonusPoints = 20;
        const bonusTotal = newTotal + bonusPoints;
        
        setUserPoints(bonusTotal);
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, bonusTotal.toString());
        logPointsForDay(bonusPoints);
        logPointsForMonth(bonusPoints);
        window.dispatchEvent(new Event('pointsUpdated'));
        
        toast({
          title: `${newStreak} Question Streak!`,
          description: `Bonus ${bonusPoints} points awarded!`,
        });
      }
    } else {
      setStreak(0);
    }
    
    // Load next question
    loadNewQuestion();
  };

  return {
    currentQuestion,
    isLoading,
    questionsAnswered,
    streak,
    userPoints,
    dailyPoints,
    monthlyPoints,
    syncingData,
    handleQuestionComplete
  };
};
