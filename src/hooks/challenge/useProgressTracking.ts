
import { useState, useEffect } from 'react';
import { ChallengeProgress, Answer } from './challengeTypes';

export const useProgressTracking = (progress: ChallengeProgress | null) => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (progress) {
      setIsComplete(progress.completed);
      setScore(progress.score);
    }
  }, [progress]);
  
  return {
    answers,
    isComplete,
    score,
    setAnswers,
    setIsComplete,
    setScore
  };
};
