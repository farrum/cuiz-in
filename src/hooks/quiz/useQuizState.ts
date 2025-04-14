
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

export const useQuizState = () => {
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [forceReloadAds, setForceReloadAds] = useState(0);
  const [nextBadgeThreshold, setNextBadgeThreshold] = useState(10);
  const [isGameActive, setIsGameActive] = useState(true);
  const { toast } = useToast();

  // Compose functionality from smaller hooks
  const { 
    userPoints, 
    dailyPoints, 
    monthlyPoints, 
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
    showMotivationalMessage 
  } = useQuizMotivation(questionsAnswered);
  
  const {
    adsSynced,
    handleAdSlotsUpdated
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
    const savedPoints = parseFloat(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    
    const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
    setQuestionsAnswered(completedQuestions.length);
    
    // Load initial ad data
    await useQuizAdSync().syncAdSlots(setForceReloadAds);
    
    loadNewQuestion();
    fetchPoints();
    updateNextBadgeThreshold(completedQuestions.length);
    setIsGameActive(true);
  };
  
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
  
  const handleQuestionComplete = (isCorrect: boolean) => {
    if (!currentQuestion || !isGameActive) return;
    
    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    updateNextBadgeThreshold(newQuestionsAnswered);
    
    // Update streak counter based on correctness
    let newStreak = 0;
    if (isCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      
      // Calculate points based on game mode
      const basePoints = currentQuestion.points || 10;
      const earnedPoints = calculatePoints(basePoints, isCorrect, newStreak);
      
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
    
    setTimeout(() => {
      fetchPoints();
      window.dispatchEvent(new Event('pointsUpdated'));
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
  
  // Reset game for time attack mode
  const resetGame = () => {
    setQuestionsAnswered(0);
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
    showMotivationalMessage,
    setForceReloadAds,
    changeGameMode,
    handleTimeUp,
    resetGame
  };
};
