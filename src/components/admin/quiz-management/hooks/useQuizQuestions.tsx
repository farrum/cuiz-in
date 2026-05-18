
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { QuizQuestion } from '@/utils/quizData';

export const useQuizQuestions = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [imageQuestions, setImageQuestions] = useState<QuizQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuizQuestion[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      // Use admin RPC to fetch full rows (including correct_answer).
      // Direct SELECT on quiz_questions no longer returns correct_answer.
      const { data, error } = await supabase
        .rpc('admin_get_quiz_questions', { p_ids: null });
        
      if (error) {
        throw error;
      }
      
      const formattedQuestions = data.map(q => {
        const optionsArray: string[] = Array.isArray(q.options) 
          ? q.options.map(String) 
          : typeof q.options === 'object' 
            ? Object.values(q.options).map(String) 
            : [];
        
        return {
          id: q.id,
          question: q.question,
          options: optionsArray,
          correctAnswer: q.correct_answer,
          difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'easy',
          category: q.category || 'General Knowledge',
          points: 10,
          explanation: q.explanation || '',
          imageUrl: q.image_url,
          questionType: q.question_type as 'text' | 'image' || 'text'
        };
      });
      
      const textQuestions = formattedQuestions.filter(q => q.questionType !== 'image');
      const imgQuestions = formattedQuestions.filter(q => q.questionType === 'image');
      
      setQuestions(textQuestions);
      setImageQuestions(imgQuestions);
      
      const uniqueCategories = Array.from(
        new Set(formattedQuestions.map(q => q.category))
      );
      setCategories(uniqueCategories);
      
      toast({
        title: "Success",
        description: `Loaded ${formattedQuestions.length} quiz questions.`,
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz questions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchQuestions();
  }, []);
  
  return {
    questions,
    imageQuestions,
    filteredQuestions,
    setFilteredQuestions,
    categories,
    isLoading,
    fetchQuestions
  };
};
