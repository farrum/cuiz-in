
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnsweredQuestion, QuizAnswer } from './types';

export const useQuizHistory = (userId: string, page: number, limit: number) => {
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Get count of total questions for pagination
  useEffect(() => {
    if (userId) {
      fetchQuestionCount();
    }
  }, [userId]);

  // Fetch questions based on pagination
  useEffect(() => {
    if (userId) {
      fetchAnsweredQuestions();
    }
  }, [userId, page, limit]);

  const fetchQuestionCount = async () => {
    try {
      const { count, error } = await supabase
        .from('quiz_answers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching question count:', error);
        return;
      }
      
      if (count !== null) {
        setTotalQuestions(count);
        setTotalPages(Math.ceil(count / limit));
      }
    } catch (err) {
      console.error('Failed to fetch question count:', err);
    }
  };

  const fetchAnsweredQuestions = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Use offset pagination to reduce data transferred
      const offset = (page - 1) * limit;
      
      // Only select the columns we need
      const { data, error } = await supabase
        .from('quiz_answers')
        .select(`
          id,
          question_id,
          selected_answer,
          correct,
          answered_at,
          quiz_questions (
            id,
            question,
            options,
            correct_answer,
            explanation,
            category
          )
        `)
        .eq('user_id', userId)
        .order('answered_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching answered questions:', error);
        return;
      }

      // Transform data to AnsweredQuestion format
      const formattedData: AnsweredQuestion[] = data.map((item: any) => {
        // Convert options to string array regardless of what format it comes in
        let parsedOptions: string[] = [];
        
        // Access the first quiz_questions item if it's an array
        const quizQuestion = Array.isArray(item.quiz_questions) 
          ? item.quiz_questions[0] 
          : item.quiz_questions;
        
        // Only process if quizQuestion exists and is an object
        if (quizQuestion && typeof quizQuestion === 'object') {
          const options = quizQuestion.options;
          
          if (Array.isArray(options)) {
            // If it's already an array, make sure all elements are strings
            parsedOptions = options.map(opt => String(opt));
          } else if (typeof options === 'object' && options !== null) {
            // If it's an object, extract values
            parsedOptions = Object.values(options).map(opt => String(opt));
          } else if (typeof options === 'string') {
            // If it's a JSON string, try to parse it
            try {
              const parsed = JSON.parse(options);
              if (Array.isArray(parsed)) {
                parsedOptions = parsed.map(opt => String(opt));
              } else if (typeof parsed === 'object' && parsed !== null) {
                parsedOptions = Object.values(parsed).map(opt => String(opt));
              }
            } catch {
              // If parsing fails, use it as a single item array
              parsedOptions = [String(options)];
            }
          }
        }

        // Set default values for when quiz_questions is null or undefined
        const questionText = quizQuestion?.question || 'Question not available';
        const correctAnswer = quizQuestion?.correct_answer || '';
        const explanation = quizQuestion?.explanation || 'No explanation available';
        const category = quizQuestion?.category || 'General';

        return {
          id: item.id,
          question: questionText,
          options: parsedOptions,
          correct_answer: correctAnswer,
          selected_answer: item.selected_answer,
          answered_at: item.answered_at,
          explanation: explanation,
          category: category,
          correct: item.correct
        };
      });

      setAnsweredQuestions(formattedData);
    } catch (err) {
      console.error('Failed to fetch answered questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    answeredQuestions,
    isLoading,
    totalPages,
    totalQuestions
  };
};
