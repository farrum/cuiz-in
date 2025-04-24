
import { QuizQuestion } from '@/utils/types';
import { supabase } from '@/integrations/supabase/client';

export const extractKeywords = (text: string): string[] => {
  // Remove special characters and split into words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter out words shorter than 3 characters
    
  return [...new Set(words)]; // Remove duplicates
};

export const getQuestionKeywords = (question: QuizQuestion): string[] => {
  const keywords: string[] = [];
  
  // Add keywords from question
  keywords.push(...extractKeywords(question.question));
  
  // Add keywords from options
  question.options.forEach(option => {
    keywords.push(...extractKeywords(option));
  });
  
  // Add keywords from explanation if available
  if (question.explanation) {
    keywords.push(...extractKeywords(question.explanation));
  }
  
  // Add category and difficulty as keywords
  keywords.push(question.category.toLowerCase());
  keywords.push(question.difficulty.toLowerCase());
  
  return [...new Set(keywords)]; // Remove duplicates
};

export const generateMetaKeywords = async (): Promise<string[]> => {
  try {
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('*');
      
    if (error) throw error;
    
    const allKeywords = new Set<string>();
    
    questions?.forEach((question: QuizQuestion) => {
      const questionKeywords = getQuestionKeywords(question);
      questionKeywords.forEach(keyword => allKeywords.add(keyword));
    });
    
    // Convert Set to array and sort alphabetically
    return Array.from(allKeywords).sort();
  } catch (error) {
    console.error('Error generating keywords:', error);
    return [];
  }
};

// Save keywords to localStorage for caching
export const cacheKeywords = (keywords: string[]) => {
  localStorage.setItem('quiz_keywords', JSON.stringify(keywords));
};

// Get cached keywords
export const getCachedKeywords = (): string[] => {
  const cached = localStorage.getItem('quiz_keywords');
  return cached ? JSON.parse(cached) : [];
};
