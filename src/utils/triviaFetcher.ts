
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/utils/quizData';
import { checkForDuplicateQuestion } from './quizDuplicateChecker';
import { useToast } from '@/hooks/use-toast';

// Define interfaces for the Open Trivia DB API response
interface OpenTriviaDBQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTriviaDBResponse {
  response_code: number;
  results: OpenTriviaDBQuestion[];
}

interface TriviaCategory {
  id: number;
  name: string;
}

interface TriviaCategoriesResponse {
  trivia_categories: TriviaCategory[];
}

/**
 * Fetches trivia questions from Open Trivia Database API
 * @param amount Number of questions to fetch
 * @param category Category ID (optional)
 * @param difficulty Difficulty level (optional)
 * @returns Array of trivia questions
 */
export async function fetchTriviaQuestions(
  amount: number = 10, 
  category?: number, 
  difficulty?: 'easy' | 'medium' | 'hard'
): Promise<QuizQuestion[]> {
  try {
    let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
    
    if (category) {
      url += `&category=${category}`;
    }
    
    if (difficulty) {
      url += `&difficulty=${difficulty}`;
    }
    
    console.log('Fetching trivia from:', url);
    
    const response = await fetch(url);
    const data: OpenTriviaDBResponse = await response.json();
    
    if (data.response_code !== 0) {
      console.error('Error from Open Trivia DB:', data.response_code);
      return [];
    }
    
    // Map the API response to our QuizQuestion format
    const questions: QuizQuestion[] = data.results.map(q => {
      // Decode HTML entities in the question and answers
      const decodedQuestion = decodeHtmlEntities(q.question);
      const decodedCorrectAnswer = decodeHtmlEntities(q.correct_answer);
      const decodedIncorrectAnswers = q.incorrect_answers.map(decodeHtmlEntities);
      
      // Combine and shuffle answers
      const options = [...decodedIncorrectAnswers, decodedCorrectAnswer];
      shuffleArray(options);
      
      return {
        id: crypto.randomUUID(), // Temporary ID
        question: decodedQuestion,
        options: options,
        correctAnswer: decodedCorrectAnswer,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        category: q.category,
        points: q.difficulty === 'easy' ? 2 : q.difficulty === 'medium' ? 3 : 4,
        explanation: '',
        questionType: 'text'
      };
    });
    
    return questions;
  } catch (error) {
    console.error('Error fetching trivia questions:', error);
    return [];
  }
}

/**
 * Save trivia questions to the database, checking for duplicates
 * @param questions Array of questions to save
 * @returns Object with counts of saved and duplicate questions
 */
export async function saveTriviaToDB(questions: QuizQuestion[]): Promise<{
  saved: number;
  duplicates: number;
  errors: number;
}> {
  const adminUserId = localStorage.getItem('quiz_user_id');
  
  if (!adminUserId) {
    console.error('No admin user ID found');
    return { saved: 0, duplicates: 0, errors: questions.length };
  }

  // Filter out duplicates client-side first
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
      return { saved: 0, duplicates, errors: uniqueQuestions.length };
    }

    const result = data as { saved: number; duplicates: number; errors: number };
    return { saved: result.saved, duplicates: duplicates + result.duplicates, errors: result.errors };
  } catch (e) {
    console.error('Error saving trivia:', e);
    return { saved: 0, duplicates, errors: uniqueQuestions.length };
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
