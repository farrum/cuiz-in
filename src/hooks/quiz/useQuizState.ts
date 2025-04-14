
import { useState } from 'react';
import { useQuizPoints } from './useQuizPoints';
import { useQuizQuestion } from './useQuizQuestion';
import { useQuizMotivation } from './useQuizMotivation';
import { useQuizAdSync } from './useQuizAdSync';
import { useQuizSuspension } from './useQuizSuspension';
import { STORAGE_KEYS } from '@/utils/quizData';

export const useQuizState = () => {
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [forceReloadAds, setForceReloadAds] = useState(0);
  const [nextBadgeThreshold, setNextBadgeThreshold] = useState(10);

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
  
  const loadInitialData = async () => {
    const savedPoints = parseFloat(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    
    const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
    setQuestionsAnswered(completedQuestions.length);
    
    // Load initial ad data
    await useQuizAdSync().syncAdSlots(setForceReloadAds);
    
    loadNewQuestion();
    fetchPoints();
    updateNextBadgeThreshold(completedQuestions.length);
  };
  
  const handleQuestionComplete = (isCorrect: boolean) => {
    if (!currentQuestion) return;
    
    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    updateNextBadgeThreshold(newQuestionsAnswered);
    
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
    } else {
      setStreak(0);
    }
    
    setTimeout(() => {
      fetchPoints();
      window.dispatchEvent(new Event('pointsUpdated'));
    }, 1000);
    
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
    checkSuspensionStatus,
    loadInitialData,
    handleAdSlotsUpdated,
    fetchPoints,
    loadNewQuestion,
    handleQuestionComplete,
    showMotivationalMessage,
    setForceReloadAds
  };
};
