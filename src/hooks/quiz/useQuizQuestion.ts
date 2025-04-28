
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/utils/quizData';

export const useQuizQuestion = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadNewQuestion = async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching random question from quiz_questions table');
      // Fetch a random question with proper RLS considerations
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('RANDOM()')
        .limit(1)
        .single();
        
      if (error) {
        console.error('Error loading question:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No question data returned from the database');
        throw new Error('No question data returned');
      }
      
      console.log('Successfully fetched question data:', data);
      
      // Transform the question to match QuizQuestion interface
      const question: QuizQuestion = {
        id: data.id,
        question: data.question,
        options: Array.isArray(data.options) 
          ? data.options 
          : Object.values(data.options || {}),
        correctAnswer: data.correct_answer,
        difficulty: data.difficulty || 'medium',
        category: data.category,
        points: data.points || 10,
        explanation: data.explanation || '',
        imageUrl: data.image_url,
        questionType: data.question_type || 'text'
      };
      
      setCurrentQuestion(question);
    } catch (error) {
      console.error('Error in loadNewQuestion:', error);
      // Fallback to a default question if fetching fails
      const defaultQuestion: QuizQuestion = {
        id: 'default-question',
        question: 'Network error. Please try again.',
        options: ['Retry'],
        correctAnswer: 'Retry',
        difficulty: 'easy',
        category: 'Error',
        points: 0,
        explanation: 'Unable to load question due to a network issue.'
      };
      setCurrentQuestion(defaultQuestion);
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
