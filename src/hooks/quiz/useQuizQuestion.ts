
import { useState } from 'react';
import { QuizQuestion, getRandomQuestion } from '@/utils/quizData';

export const useQuizQuestion = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  return {
    currentQuestion,
    isLoading,
    loadNewQuestion
  };
};
