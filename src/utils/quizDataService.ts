
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from './types';
import { STORAGE_KEYS } from './constants';
import { shouldShowImageQuestion } from './imageQuizUtils';

// Mock quiz questions for fallback
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    difficulty: 'easy',
    category: 'Math',
    gems: 10,
    explanation: 'Basic addition'
  },
  {
    id: 'q2',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 'Paris',
    difficulty: 'easy',
    category: 'Geography',
    gems: 10,
    explanation: 'Paris is the capital city of France'
  }
];

// Get questions from localStorage (never throws on corrupted/oversized data)
export const getQuestionsFromLocalStorage = (): QuizQuestion[] => {
  try {
    const storedQuestions = localStorage.getItem(STORAGE_KEYS.QUIZ_QUESTIONS);
    if (!storedQuestions) return quizQuestions;
    const parsed = JSON.parse(storedQuestions);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : quizQuestions;
  } catch (e) {
    console.error('Corrupted cached questions, clearing cache', e);
    try { localStorage.removeItem(STORAGE_KEYS.QUIZ_QUESTIONS); } catch { /* ignore */ }
    return quizQuestions;
  }
};

// Fetch quiz questions from Supabase
export const fetchQuizQuestions = async (): Promise<QuizQuestion[]> => {
  try {
    // First try to get from Supabase
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('id, question, options, category, difficulty, explanation, gems:points, image_url, question_type, created_at');
      
    if (error) {
      console.error('Error fetching quiz questions from Supabase:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log(`Fetched ${data.length} questions from Supabase`);
      
      // Transform Supabase data to match QuizQuestion interface
      // Note: correct_answer is no longer fetched client-side for security
      const questions: QuizQuestion[] = data.map(q => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        category: q.category,
        gems: q.gems || 10,
        explanation: q.explanation || '',
        imageUrl: q.image_url || undefined,
        questionType: q.question_type as 'text' | 'image' || 'text',
        createdAt: q.created_at
      }));
      
      // Save to localStorage (ignore quota errors so a full cache never blocks play)
      try {
        localStorage.setItem(STORAGE_KEYS.QUIZ_QUESTIONS, JSON.stringify(questions));
      } catch (e) {
        console.warn('Could not cache questions to localStorage (quota?)', e);
      }
      
      return questions;
    }
    
    // Fall back to localStorage
    return getQuestionsFromLocalStorage();
  } catch (error) {
    console.error('Error in fetchQuizQuestions:', error);
    return getQuestionsFromLocalStorage();
  }
};

export interface QuestionFilter {
  category?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  questionType?: 'text' | 'image' | null;
}

// Get a random question (with preference for unanswered questions)
export const getRandomQuestion = async (filter?: QuestionFilter): Promise<QuizQuestion> => {
  // Try to get the latest questions from Supabase
  let questions = await fetchQuizQuestions();

  // Apply user-selected category / difficulty / questionType preferences when provided
  if (filter && (filter.category || filter.difficulty || filter.questionType)) {
    const filtered = questions.filter(q =>
      (!filter.category || q.category === filter.category) &&
      (!filter.difficulty || q.difficulty === filter.difficulty) &&
      (!filter.questionType || q.questionType === filter.questionType)
    );
    if (filtered.length > 0) questions = filtered;
  }
  
  if (questions.length === 0) {
    // If no questions are available, return a default question
    return {
      id: 'default-question',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      difficulty: 'easy',
      category: 'Math',
      gems: 10,
      explanation: 'Basic addition'
    };
  }
  
  // Filter out questions the user has already completed (never throw on bad data)
  let completedQuestions: string[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) completedQuestions = parsed;
  } catch (e) {
    console.error('Corrupted completed-questions list, resetting', e);
    try { localStorage.removeItem(STORAGE_KEYS.COMPLETED_QUESTIONS); } catch { /* ignore */ }
  }
  let availableQuestions = questions.filter(q => !completedQuestions.includes(q.id));
  
  // If all questions have been answered, reset or use all questions
  if (availableQuestions.length === 0) {
    availableQuestions = questions;
  }
  
  // If an explicit questionType filter was provided, we strictly honor it
  if (filter?.questionType) {
    const typeQuestions = availableQuestions.filter(q => q.questionType === filter.questionType);
    const chooseFrom = typeQuestions.length > 0 ? typeQuestions : questions.filter(q => q.questionType === filter.questionType);
    if (chooseFrom.length > 0) {
      const randomIndex = Math.floor(Math.random() * chooseFrom.length);
      return chooseFrom[randomIndex];
    } else if (filter.questionType === 'image') {
      // Fallback default image question to guarantee we never return a text question
      return {
        id: 'default-image-question',
        question: 'Identify the style of this abstract digital painting:',
        options: ['Vibrant Neon Gradient', 'Monochromatic Slate', 'Dotted Pointillism', 'Structured Grid Pattern'],
        correctAnswer: 'Vibrant Neon Gradient',
        difficulty: 'easy',
        category: 'Art',
        gems: 10,
        explanation: 'The abstract card shows a vibrant neon gradient blending hot pinks and soft oranges.',
        imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
        questionType: 'image'
      };
    }
  }
  
  // Randomly decide if we should show an image question.
  // Only ever serve real image questions from Supabase — never the old
  // hardcoded placeholder/mock image questions.
  if (shouldShowImageQuestion()) {
    // 1. Try to get unanswered image questions from Supabase
    const availableImageQuestions = availableQuestions.filter(q => q.questionType === 'image');
    if (availableImageQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableImageQuestions.length);
      return availableImageQuestions[randomIndex];
    }
    
    // 2. Fall back to already completed image questions from Supabase
    const allImageQuestions = questions.filter(q => q.questionType === 'image');
    if (allImageQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * allImageQuestions.length);
      return allImageQuestions[randomIndex];
    }
    // If no real image questions exist, fall through to text questions below.
  }
  
  // Preference for text-based questions if we shouldn't show an image question
  const availableTextQuestions = availableQuestions.filter(q => q.questionType !== 'image');
  const chooseFrom = availableTextQuestions.length > 0 ? availableTextQuestions : availableQuestions;
  
  // Randomly select a question
  const randomIndex = Math.floor(Math.random() * chooseFrom.length);
  return chooseFrom[randomIndex];
};

// Get the list of distinct categories available in the question pool
export const getAvailableCategories = async (): Promise<string[]> => {
  const questions = await fetchQuizQuestions();
  return Array.from(new Set(questions.map(q => q.category).filter(Boolean))).sort();
};

// Get a batch of random questions
export const getBatchQuestions = async (limit: number = 10): Promise<QuizQuestion[]> => {
  let questions = await fetchQuizQuestions();
  
  if (questions.length === 0) {
    return [
      {
        id: 'default-question',
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        difficulty: 'easy',
        category: 'Math',
        gems: 10,
        explanation: 'Basic addition'
      }
    ];
  }
  
  // Filter out questions the user has already completed
  const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
  let availableQuestions = questions.filter(q => !completedQuestions.includes(q.id));
  
  if (availableQuestions.length < limit) {
    availableQuestions = questions; // reset if not enough
  }

  // Shuffle and pick
  availableQuestions = availableQuestions.sort(() => Math.random() - 0.5);
  return availableQuestions.slice(0, limit);
};

// Calculate gems for answers
export const calculateGems = (isCorrect: boolean, difficulty: string = 'easy'): number => {
  if (isCorrect) {
    // Updated gems calculation
    switch (difficulty) {
      case 'easy': return 2;
      case 'medium': return 3;
      case 'hard': return 4;
      default: return 2;
    }
  }
  
  // Wrong answer always gives 0.5 gems
  return 0.5;
};

// Seed additional quiz questions to Supabase (for admin usage)
export const seedAdditionalQuizQuestions = async (): Promise<boolean> => {
  try {
    // Check how many questions we already have
    const { count, error } = await supabase
      .from('quiz_questions')
      .select('id', { count: 'exact', head: true });
      
    if (error) {
      console.error('Error checking question count:', error);
      return false;
    }
    
    console.log(`Current quiz questions count: ${count}`);
    
    // If we already have substantial questions, don't add more
    if (count && count > 200) {
      console.log('Already have enough questions, skipping seeding');
      return true;
    }
    
    // Additional questions by category
    const scienceQuestions = [
      {
        question: 'What is the chemical symbol for water?',
        options: ['H2O', 'CO2', 'NaCl', 'O2'],
        correct_answer: 'H2O',
        category: 'Science',
        difficulty: 'easy',
        explanation: 'H2O represents two hydrogen atoms and one oxygen atom'
      },
      {
        question: 'Which planet has the most moons?',
        options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
        correct_answer: 'Saturn',
        category: 'Science',
        difficulty: 'medium',
        explanation: 'Saturn has 83 confirmed moons, more than any other planet in our solar system'
      }
    ];
    
    const historyQuestions = [
      {
        question: 'Who was the first President of the United States?',
        options: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'John Adams'],
        correct_answer: 'George Washington',
        category: 'History',
        difficulty: 'easy',
        explanation: 'George Washington served as the first President from 1789 to 1797'
      },
      {
        question: 'In which year did World War II end?',
        options: ['1943', '1945', '1947', '1950'],
        correct_answer: '1945',
        category: 'History',
        difficulty: 'easy',
        explanation: 'World War II ended in 1945 with the surrender of Japan after the atomic bombings'
      }
    ];
    
    // Insert the questions
    const { error: insertError } = await supabase
      .from('quiz_questions')
      .insert([...scienceQuestions, ...historyQuestions]);
      
    if (insertError) {
      console.error('Error inserting additional questions:', insertError);
      return false;
    }
    
    console.log('Successfully added additional quiz questions');
    return true;
  } catch (error) {
    console.error('Error in seedAdditionalQuizQuestions:', error);
    return false;
  }
};

// Create utility for admin to add image-based questions
export const createImageBasedQuestion = async (
  question: string,
  options: string[],
  correctAnswer: string,
  category: string,
  difficulty: 'easy' | 'medium' | 'hard',
  imageUrl: string,
  explanation: string = ''
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('quiz_questions')
      .insert([{
        question,
        options,
        correct_answer: correctAnswer,
        category,
        difficulty,
        image_url: imageUrl,
        question_type: 'image',
        explanation
      }]);
      
    if (error) {
      console.error('Error creating image-based question:', error);
      return false;
    }
    
    console.log('Successfully created image-based question');
    return true;
  } catch (err) {
    console.error('Error in createImageBasedQuestion:', err);
    return false;
  }
};
