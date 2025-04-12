
import { supabase } from '@/integrations/supabase/client';

interface ImageQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  category: string;
  explanation?: string;
  points: number;
  questionType: 'image';
  imageUrl: string;
}

interface SaveResult {
  saved: number;
  duplicates: number;
  errors: number;
}

/**
 * Save image trivia questions to the database
 */
export const saveImageTriviaToDB = async (questions: ImageQuizQuestion[]): Promise<SaveResult> => {
  let saved = 0;
  let duplicates = 0;
  let errors = 0;
  
  for (const question of questions) {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert({
          question: question.question,
          options: question.options,
          correct_answer: question.correctAnswer,
          difficulty: question.difficulty,
          category: question.category,
          explanation: question.explanation || '',
          points: question.difficulty === 'easy' ? 2 : question.difficulty === 'medium' ? 3 : 4,
          question_type: 'image',
          image_url: question.imageUrl
        })
        .select();
        
      if (error) {
        if (error.message.includes('duplicate')) {
          duplicates++;
        } else {
          console.error('Error saving question:', error);
          errors++;
        }
      } else {
        saved++;
      }
    } catch (e) {
      console.error('Error processing question:', e);
      errors++;
    }
  }
  
  return { saved, duplicates, errors };
};
