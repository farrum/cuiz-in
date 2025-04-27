
import { useState } from 'react';
import { useQuizPoints } from './useQuizPoints';
import { useQuizQuestion } from './useQuizQuestion';
import { useQuizMotivation } from './useQuizMotivation';
import { useQuizAdSync } from './useQuizAdSync';
import { useQuizSuspension } from './useQuizSuspension';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useGameMode } from './useGameMode';
import { useToast } from '@/hooks/use-toast';
import { confetti } from '@/utils/animations';
import { logPointsEarned } from '@/utils/pointsService';

export const useQuizState = () => {
  const [streak, setStreak] = useState(0);
  const [forceReloadAds, setForceReloadAds] = useState(0);
  const [nextBadgeThreshold, setNextBadgeThreshold] = useState(10);
  const [isGameActive, setIsGameActive] = useState(true);
  const { toast } = useToast();

  // Compose functionality from smaller hooks
  const { 
    userPoints, 
    dailyPoints, 
    monthlyPoints,
    questionsAnswered,
    fetchPoints, 
    updateNextBadgeThreshold 
  } = useQuizPoints(setNextBadgeThreshold);
  
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
  } = useQuizMotivation(questionsAnswered);
  
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
    calculatePoints,
    changeGameMode
  } = useGameMode();
  
  const loadInitialData = async () => {
    // Explicitly fetch points which includes questions answered
    await fetchPoints();
    
    // Load initial ad data
    await syncAdSlots();
    
    // Load the first question
    await loadNewQuestion();
    
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
      description: `You answered ${questionsAnswered} questions in ${config.timeLimit} seconds!`,
      variant: "default",
    });
  };
  
  const handleQuestionComplete = async (isCorrect: boolean) => {
    if (!currentQuestion || !isGameActive) return;
    
    // Update streak counter based on correctness
    let newStreak = 0;
    if (isCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      
      // Calculate points based on game mode
      const basePoints = currentQuestion.points || 10;
      const earnedPoints = calculatePoints(basePoints, isCorrect, newStreak);
      
      // Log points earned (consistently through our utility)
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (userId) {
        console.log(`User ${userId} earned ${earnedPoints} points in ${currentMode} mode`);
        await logPointsEarned(earnedPoints, userId);
      }
      
      // Show streak milestone messages
      if (newStreak > 0 && newStreak % 5 === 0) {
        toast({
          title: `${newStreak} Question Streak! 🔥`,
          description: `You're on fire! Bonus points multiplier: ${newStreak/2}x`,
        });
        confetti();
      }
      
      // In streak mode, show the bonus
      if (currentMode === 'streak' && newStreak > 1) {
        const basePoints = currentQuestion.points || 10;
        const bonus = Math.floor(newStreak * (config.streakMultiplier || 0.5));
        toast({
          title: "Streak Bonus!",
          description: `+${basePoints} (base) +${bonus} (streak) = ${basePoints + bonus} points!`,
        });
      }
    } else {
      // Reset streak on wrong answer
      setStreak(0);
      
      // Show message for lost streak
      if (streak >= 3) {
        toast({
          title: "Streak Lost!",
          description: `You lost your streak of ${streak} questions!`,
          variant: "destructive",
        });
      }
    }
    
    // Update points data
    await fetchPoints();
    
    // Load the next question
    await loadNewQuestion();
  };
  
  // Using our hook's implementation instead of redefining it
  const displayMotivationalMessage = () => {
    showMotivationalMessageHook();
  };
  
  // Reset game for time attack mode
  const resetGame = () => {
    setStreak(0);
    setIsGameActive(true);
    if (currentMode === 'time-attack' && config.timeLimit) {
      setTimeRemaining(config.timeLimit);
    }
    loadNewQuestion();
  };

  return {
    currentQuestion,
    streak,
    questionsAnswered,
    userPoints,
    dailyPoints,
    monthlyPoints,
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
    fetchPoints,
    loadNewQuestion,
    handleQuestionComplete,
    showMotivationalMessage: displayMotivationalMessage,
    setForceReloadAds,
    changeGameMode,
    handleTimeUp,
    resetGame
  };
};
