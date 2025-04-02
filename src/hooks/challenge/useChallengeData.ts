
import { useState, useEffect } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { useFetchChallengeData } from './useFetchChallengeData';
import { useAnswerManagement } from './useAnswerManagement';
import { useProgressTracking } from './useProgressTracking';

// Re-export types from our other files
export type { 
  Challenge, 
  ChallengeProgress, 
  Answer,
  QuestionExplanation 
} from './challengeTypes';

const useChallengeData = (
  challengeId: string | undefined,
  userId: string | null,
  navigate: NavigateFunction,
  toast: any
) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentPoints, setCurrentPoints] = useState(0);
  
  // Use our custom hooks to separate concerns
  const { 
    challenge, 
    progress, 
    questions, 
    loading,
    fetchChallengeData
  } = useFetchChallengeData(challengeId, userId, toast);
  
  const {
    answers,
    isComplete,
    score,
    setAnswers,
    setIsComplete,
    setScore
  } = useProgressTracking(progress);
  
  const { handleQuestionComplete } = useAnswerManagement(
    challenge,
    questions,
    currentQuestionIndex,
    userId,
    challengeId,
    answers,
    currentPoints,
    setCurrentPoints,
    setAnswers,
    setCurrentQuestionIndex,
    setIsComplete,
    setScore,
    progress,
    toast
  );
  
  useEffect(() => {
    if (!challengeId || !userId) return;
    
    fetchChallengeData();
  }, [challengeId, userId]);
  
  // Add a new function to handle moving to the next question
  const handleNextQuestion = () => {
    // Check if it's the last question
    if (currentQuestionIndex >= questions.length - 1) {
      setIsComplete(true);
    } else {
      // Move to the next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  return {
    challenge,
    progress,
    questions,
    answers,
    loading,
    isComplete,
    score,
    currentQuestionIndex,
    currentPoints,
    handleQuestionComplete,
    handleNextQuestion,
  };
};

export default useChallengeData;
