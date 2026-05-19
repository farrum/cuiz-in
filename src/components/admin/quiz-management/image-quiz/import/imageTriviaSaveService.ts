
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';

interface ImageQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  category: string;
  explanation?: string;
  gems: number;
  questionType: 'image';
  imageUrl: string;
}

interface SaveResult {
  saved: number;
  duplicates: number;
  errors: number;
}

/**
 * Save image trivia questions to the database via admin edge function
 */
export const saveImageTriviaToDB = async (questions: ImageQuizQuestion[]): Promise<SaveResult> => {
  const adminUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
  if (!adminUserId) {
    console.error('No admin user ID found');
    return { saved: 0, duplicates: 0, errors: questions.length };
  }

  try {
    const { data, error } = await supabase.functions.invoke('admin-create-quiz-question', {
      body: {
        adminUserId,
        questions: questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          category: q.category,
          explanation: q.explanation || '',
          questionType: q.questionType,
          imageUrl: q.imageUrl,
        })),
      },
    });

    if (error) {
      console.error('Error calling admin-create-quiz-question:', error);
      return { saved: 0, duplicates: 0, errors: questions.length };
    }

    return data as SaveResult;
  } catch (e) {
    console.error('Error saving image trivia:', e);
    return { saved: 0, duplicates: 0, errors: questions.length };
  }
};
