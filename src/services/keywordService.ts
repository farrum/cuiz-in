import { QuizQuestion } from '@/utils/types';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';

// Common English stop words that aren't useful for SEO
const STOP_WORDS = [
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don',
  'should', 'now', 'this', 'that', 'these', 'those', 'from', 'with', 'about', 'have',
  'what', 'which', 'their', 'they', 'them', 'there', 'been', 'being', 'into', 'does',
  'your', 'over', 'under', 'again', 'once', 'here', 'there', 'when', 'who'
];

// Extract keywords from text with improved filtering
export const extractKeywords = (text: string): string[] => {
  if (!text) return [];
  
  // Remove special characters and split into words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter out words shorter than 4 characters
    
  // Remove common stop words
  const filteredWords = words.filter(word => !STOP_WORDS.includes(word));
  
  // Remove duplicates
  return [...new Set(filteredWords)];
};

// Get keywords from all parts of a question
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
  
  // Add quiz-specific keywords
  keywords.push('quiz', 'question', 'trivia', 'test', 'knowledge', 'learn');
  
  return [...new Set(keywords)]; // Remove duplicates
};

// Generate meta keywords for the entire site
export const generateMetaKeywords = async (): Promise<string[]> => {
  try {
    // Try to get from cache first
    const cachedKeywords = getCachedKeywords();
    if (cachedKeywords.length > 0) {
      return cachedKeywords;
    }
    
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('id, question, options, category, difficulty, points, image_url');
      
    if (error) throw error;
    
    const allKeywords = new Set<string>();
    
    questions?.forEach((q: any) => {
      const formattedQuestion: QuizQuestion = {
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
        correctAnswer: q.correct_answer,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        category: q.category,
        gems: q.gems || 10,
        explanation: q.explanation || ''
      };
      
      const questionKeywords = getQuestionKeywords(formattedQuestion);
      questionKeywords.forEach(keyword => allKeywords.add(keyword));
    });
    
    // Convert Set to array and sort alphabetically
    const keywordArray = Array.from(allKeywords).sort();
    
    // Cache the keywords
    cacheKeywords(keywordArray);
    
    return keywordArray;
  } catch (error) {
    console.error('Error generating keywords:', error);
    return [];
  }
};

// Save keywords to localStorage for caching
export const cacheKeywords = (keywords: string[]) => {
  try {
    localStorage.setItem('quiz_keywords', JSON.stringify(keywords));
    localStorage.setItem('quiz_keywords_timestamp', Date.now().toString());
  } catch (error) {
    console.error('Error caching keywords:', error);
  }
};

// Get cached keywords
export const getCachedKeywords = (): string[] => {
  try {
    const cached = localStorage.getItem('quiz_keywords');
    const timestamp = localStorage.getItem('quiz_keywords_timestamp');
    
    // Check if cache is older than 24 hours
    if (timestamp && (Date.now() - parseInt(timestamp)) > 86400000) {
      return []; // Cache expired
    }
    
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error retrieving cached keywords:', error);
    return [];
  }
};

// Create SEO keyword component
export const SEOKeywords: React.FC = () => {
  React.useEffect(() => {
    const updateKeywords = async () => {
      // Check if we have cached keywords first
      const cachedKeywords = getCachedKeywords();
      
      if (cachedKeywords.length === 0) {
        // Generate new keywords if cache is empty
        const keywords = await generateMetaKeywords();
        cacheKeywords(keywords);
        
        // Add keywords meta tag to document head
        const metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        metaKeywords.content = keywords.join(', ');
        document.head.appendChild(metaKeywords);
      }
    };
    
    updateKeywords();
  }, []);
  
  return null; // This is a utility component that doesn't render anything
};
