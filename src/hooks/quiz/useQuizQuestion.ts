
import { useState } from 'react';
import { QuizQuestion, getRandomQuestion, QuestionFilter } from '@/utils/quizData';

export const useQuizQuestion = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadNewQuestion = async (filter?: QuestionFilter) => {
    setIsLoading(true);
    
    try {
      const question = await getRandomQuestion(filter);
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
