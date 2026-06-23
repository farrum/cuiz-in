
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuizGems } from './useQuizGems';
import { useQuizQuestion } from './useQuizQuestion';
import { useQuizMotivation } from './useQuizMotivation';
import { useQuizAdSync } from './useQuizAdSync';
import { useQuizSuspension } from './useQuizSuspension';
import { usePersistentQuizStats } from './usePersistentQuizStats';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useGameMode } from './useGameMode';
import { useToast } from '@/hooks/use-toast';
import { confetti } from '@/utils/animations';
import { logGemsEarned } from '@/utils/gemsService';

export const useQuizState = () => {
  const [searchParams] = useSearchParams();
  const isImageMode = searchParams.get('mode') === 'image' || searchParams.get('type') === 'image';

  // Use persistent stats hook for streak and questions answered
  const {
    streak,
    questionsAnswered: localQuestionsAnswered,
    setStreak,
    incrementStreak,
    resetStreak,
    incrementQuestionsAnswered,
    syncWithDatabase
  } = usePersistentQuizStats();
  
  const [forceReloadAds, setForceReloadAds] = useState(0);
  const [nextBadgeThreshold, setNextBadgeThreshold] = useState(10);
  const [isGameActive, setIsGameActive] = useState(true);
  const { toast } = useToast();

  // Compose functionality from smaller hooks
  const { 
    userGems, 
    dailyGems, 
    monthlyGems,
    questionsAnswered: dbQuestionsAnswered,
    fetchGems, 
    updateNextBadgeThreshold 
  } = useQuizGems(setNextBadgeThreshold);
  
  const { 
    currentQuestion, 
    isLoading, 
    loadNewQuestion 
  } = useQuizQuestion();
  
  const { 
    showMotivation, 
    motivationMessage,
    setShowMotivation,
    setMotivationMessage,
    showMotivationalMessage: showMotivationalMessageHook
  } = useQuizMotivation(localQuestionsAnswered);
  
  const {
    adsSynced,
    handleAdSlotsUpdated: handleAdSlotsUpdatedHook,
    syncAdSlots
  } = useQuizAdSync(setForceReloadAds);
  
  const {
    isSuspended,
    checkSuspensionStatus
  } = useQuizSuspension();

  const {
    currentMode,
    config,
    timeRemaining,
    setTimeRemaining,
    calculateGems,
    changeGameMode
  } = useGameMode();
  
  // Sync local stats with database value when it loads (take max to avoid data loss)
  useEffect(() => {
    if (dbQuestionsAnswered > 0) {
      syncWithDatabase(dbQuestionsAnswered);
    }
  }, [dbQuestionsAnswered, syncWithDatabase]);
  
  const loadInitialData = async () => {
    // Explicitly fetch gems which includes questions answered
    await fetchGems();
    
    // Load initial ad data
    await syncAdSlots();
    
    // Load the first question
    await loadNewQuestion(isImageMode ? { questionType: 'image' } : undefined);
    
    setIsGameActive(true);
  };
  
  // Using our local version instead of the imported one to avoid conflicts
  const handleAdSlotsUpdated = () => {
    console.log('Ad slots updated, refreshing ad display...');
    setForceReloadAds(prev => prev + 1);
  };

  const handleTimeUp = () => {
    setIsGameActive(false);
    toast({
      title: "Time's Up!",
      description: `You answered ${localQuestionsAnswered} questions in ${config.timeLimit} seconds!`,
      variant: "default",
    });
  };
  
  const handleQuestionComplete = async (isCorrect: boolean) => {
    if (!currentQuestion || !isGameActive) return;
    
    // Increment local questions answered immediately (persisted to localStorage)
    incrementQuestionsAnswered();
    
    // Update streak counter based on correctness
    let newStreak = 0;
    if (isCorrect) {
      incrementStreak();
      newStreak = streak + 1;
      
      // Calculate gems based on game mode
      const baseGems = currentQuestion.gems || 10;
      const earnedGems = calculateGems(baseGems, isCorrect, newStreak);
      
      // Log gems earned (consistently through our utility)
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (userId) {
        console.log(`User ${userId} earned ${earnedGems} gems in ${currentMode} mode`);
        await logGemsEarned(earnedGems, userId);
      }
      
      // Show streak milestone messages
      if (newStreak > 0 && newStreak % 5 === 0) {
        toast({
          title: `${newStreak} Question Streak! 🔥`,
          description: `You're on fire! Bonus gems multiplier: ${newStreak/2}x`,
        });
        confetti();
      }
      
      // In streak mode, show the bonus
      if (currentMode === 'streak' && newStreak > 1) {
        const baseGems = currentQuestion.gems || 10;
        const bonus = Math.floor(newStreak * (config.streakMultiplier || 0.5));
        toast({
          title: "Streak Bonus!",
          description: `+${baseGems} (base) +${bonus} (streak) = ${baseGems + bonus} gems!`,
        });
      }
    } else {
      // Reset streak on wrong answer
      resetStreak();
      
      // Show message for lost streak
      if (streak >= 3) {
        toast({
          title: "Streak Lost!",
          description: `You lost your streak of ${streak} questions!`,
          variant: "destructive",
        });
      }
    }
    
    // Update gems data from database (async sync)
    await fetchGems();
    
    // Load the next question
    await loadNewQuestion(isImageMode ? { questionType: 'image' } : undefined);
  };
  
  // Using our hook's implementation instead of redefining it
  const displayMotivationalMessage = () => {
    showMotivationalMessageHook();
  };
  
  // Reset game for time attack mode
  const resetGame = () => {
    resetStreak();
    setIsGameActive(true);
    if (currentMode === 'time-attack' && config.timeLimit) {
      setTimeRemaining(config.timeLimit);
    }
    loadNewQuestion(isImageMode ? { questionType: 'image' } : undefined);
  };

  return {
    currentQuestion,
    streak,
    questionsAnswered: localQuestionsAnswered,
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
    currentMode,
    config,
    timeRemaining,
    isGameActive,
    checkSuspensionStatus,
    loadInitialData,
    handleAdSlotsUpdated,
    fetchGems,
    loadNewQuestion,
    handleQuestionComplete,
    showMotivationalMessage: displayMotivationalMessage,
    setForceReloadAds,
    changeGameMode,
    handleTimeUp,
    resetGame
  };
};
