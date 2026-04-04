
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/utils/quizData';
import { checkForDuplicateQuestion } from './quizDuplicateChecker';
import { STORAGE_KEYS } from './constants';
...
export async function saveTriviaToDB(questions: QuizQuestion[]): Promise<{
  saved: number;
  duplicates: number;
  errors: number;
}> {
  const adminUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
  if (!adminUserId) {
    console.error('No admin user ID found');
    throw new Error('Admin session not found. Please log in again and retry.');
  }

  const uniqueQuestions: QuizQuestion[] = [];
  let duplicates = 0;
  
  for (const question of questions) {
    const isDuplicate = await checkForDuplicateQuestion(question.question);
    if (isDuplicate) {
      console.log('Skipping duplicate question:', question.question);
      duplicates++;
    } else {
      uniqueQuestions.push(question);
    }
  }

  if (uniqueQuestions.length === 0) {
    return { saved: 0, duplicates, errors: 0 };
  }

  try {
    const { data, error } = await supabase.functions.invoke('admin-create-quiz-question', {
      body: {
        adminUserId,
        questions: uniqueQuestions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          category: q.category,
          explanation: q.explanation,
          questionType: 'text',
        })),
      },
    });

    if (error) {
      console.error('Error calling admin-create-quiz-question:', error);
      throw new Error(error.message || 'Failed to save trivia questions.');
    }

    const result = data as { saved: number; duplicates: number; errors: number; error?: string };

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      saved: result.saved,
      duplicates: duplicates + (result.duplicates ?? 0),
      errors: result.errors ?? 0,
    };
  } catch (e) {
    console.error('Error saving trivia:', e);
    throw e instanceof Error ? e : new Error('Failed to save trivia questions.');
  }
}

/**
 * Helper function to decode HTML entities
 */
function decodeHtmlEntities(str: string): string {
  const doc = new DOMParser().parseFromString(str, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Helper function to shuffle an array in-place (Fisher-Yates algorithm)
 */
function shuffleArray(array: any[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Get available categories from Open Trivia DB
 * @returns Object mapping category IDs to names
 */
export async function getTriviaCategories(): Promise<Record<number, string>> {
  try {
    const response = await fetch('https://opentdb.com/api_category.php');
    const data: TriviaCategoriesResponse = await response.json();
    
    const categories: Record<number, string> = {};
    data.trivia_categories.forEach((cat: TriviaCategory) => {
      categories[cat.id] = cat.name;
    });
    
    return categories;
  } catch (error) {
    console.error('Error fetching trivia categories:', error);
    return {};
  }
}
