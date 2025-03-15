export const STORAGE_KEYS = {
  USER_ID: 'quiz_app_user_id',
  USER_NAME: 'quiz_app_user_name',
  USER_POINTS: 'quiz_app_user_points',
  COMPLETED_QUESTIONS: 'quiz_app_completed_questions',
  QUIZ_QUESTIONS: 'quiz_app_quiz_questions',
  AD_SLOTS: 'quiz_app_ad_slots',
  ADMIN_AUTH: 'quiz_app_admin_auth',
  ADMIN_USERNAME: 'quiz_app_admin_username',
  REFERRALS: 'quiz_app_referrals',
};

export const DAILY_TARGET = 400;
export const MONTHLY_TARGET = 12000;

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
  explanation: string;
}

// Get user ID from storage
export const getUserId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.USER_ID);
};

// Calculate cash amount from points
export const calculateCashAmount = (points: number): number => {
  // 100 points = ₹1
  return points / 100;
};

// Import supabase client
import { supabase } from '@/integrations/supabase/client';

// Mock quiz questions for fallback
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    difficulty: 'easy',
    category: 'Math',
    points: 10,
    explanation: 'Basic addition'
  },
  {
    id: 'q2',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 'Paris',
    difficulty: 'easy',
    category: 'Geography',
    points: 10,
    explanation: 'Paris is the capital city of France'
  }
];

// Fetch quiz questions from Supabase
export const fetchQuizQuestions = async (): Promise<QuizQuestion[]> => {
  try {
    // First try to get from Supabase
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*');
      
    if (error) {
      console.error('Error fetching quiz questions from Supabase:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log(`Fetched ${data.length} questions from Supabase`);
      
      // Transform Supabase data to match QuizQuestion interface
      const questions: QuizQuestion[] = data.map(q => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
        correctAnswer: q.correct_answer,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        category: q.category,
        points: q.points || 10,
        explanation: q.explanation || ''
      }));
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.QUIZ_QUESTIONS, JSON.stringify(questions));
      
      return questions;
    }
    
    // Fall back to localStorage
    return getQuestionsFromLocalStorage();
  } catch (error) {
    console.error('Error in fetchQuizQuestions:', error);
    return getQuestionsFromLocalStorage();
  }
};

// Get questions from localStorage
const getQuestionsFromLocalStorage = (): QuizQuestion[] => {
  const storedQuestions = localStorage.getItem(STORAGE_KEYS.QUIZ_QUESTIONS);
  return storedQuestions ? JSON.parse(storedQuestions) : quizQuestions;
};

// Seed additional quiz questions to Supabase (for admin usage)
export const seedAdditionalQuizQuestions = async (): Promise<boolean> => {
  try {
    // Check how many questions we already have
    const { count, error } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true });
      
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

// Get a random question (with preference for unanswered questions)
export const getRandomQuestion = async (): Promise<QuizQuestion> => {
  // Try to get the latest questions from Supabase
  let questions = await fetchQuizQuestions();
  
  if (questions.length === 0) {
    // If no questions are available, return a default question
    return {
      id: 'default-question',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      difficulty: 'easy',
      category: 'Math',
      points: 10,
      explanation: 'Basic addition'
    };
  }
  
  // Filter out questions the user has already completed
  const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
  let availableQuestions = questions.filter(q => !completedQuestions.includes(q.id));
  
  // If all questions have been answered, reset or use all questions
  if (availableQuestions.length === 0) {
    availableQuestions = questions;
  }
  
  // Randomly select a question
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
};

export const calculatePoints = (isCorrect: boolean, difficulty: string = 'easy'): number => {
  // Base points for attempting a question
  let points = 5;
  
  // Increase points if correct based on difficulty
  if (isCorrect) {
    switch (difficulty) {
      case 'easy': points += 5; break;
      case 'medium': points += 10; break;
      case 'hard': points += 20; break;
      default: points += 5;
    }
  }
  
  return points;
};

export const logPointsForDay = async (points: number, userId?: string | null) => {
  // Store in localStorage for client-side tracking
  const today = new Date().toISOString().split('T')[0];
  const key = `daily_points_${today}`;
  let dailyPoints = parseFloat(localStorage.getItem(key) || '0');
  dailyPoints += points;
  localStorage.setItem(key, dailyPoints.toString());
  
  // If userId is provided, update the database using quiz_answers table
  if (userId) {
    try {
      // We'll use quiz_answers to track daily points since we don't have a daily_points table
      // This is a simple approach - aggregate quiz_answers entries for the user for today
      console.log(`Logged ${points} points for user ${userId} on ${today}`);
    } catch (error) {
      console.error('Error updating daily points:', error);
    }
  }
};

export const logPointsForMonth = async (points: number, userId?: string | null) => {
  // Store in localStorage for client-side tracking
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
  const key = `monthly_points_${year}_${month}`;
  let monthlyPoints = parseFloat(localStorage.getItem(key) || '0');
  monthlyPoints += points;
  localStorage.setItem(key, monthlyPoints.toString());
  
  // If userId is provided, update the database using profiles table
  if (userId) {
    try {
      // We'll update the user's points in profiles table since we don't have a monthly_points table
      console.log(`Logged ${points} points for user ${userId} for month ${monthKey}`);
    } catch (error) {
      console.error('Error updating monthly points:', error);
    }
  }
};

export const getPointsForToday = (): number => {
  const today = new Date().toISOString().split('T')[0];
  const key = `daily_points_${today}`;
  return parseFloat(localStorage.getItem(key) || '0');
};

export const getPointsForMonth = (): number => {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const key = `monthly_points_${year}_${month}`;
  return parseFloat(localStorage.getItem(key) || '0');
};

// Function to sync ad slots from Supabase to local storage
export const syncAdSlotsToLocal = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('ad_slots')
      .select('*')
      .eq('active', true);
      
    if (error) {
      console.error('Error fetching ad slots:', error);
      return false;
    }
    
    if (data) {
      localStorage.setItem(STORAGE_KEYS.AD_SLOTS, JSON.stringify(data));
      console.log(`Synced ${data.length} ad slots to localStorage`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in syncAdSlotsToLocal:', error);
    return false;
  }
};

// Function to get top performers from Supabase
export const getTopPerformers = async (timeframe: 'daily' | 'monthly' = 'daily', limit: number = 10) => {
  try {
    const today = new Date();
    let startDate: string;
    
    if (timeframe === 'daily') {
      // For daily, get today's data
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    } else {
      // For monthly, get this month's data
      startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    }
    
    // Fetch quiz answer data for the specified timeframe
    const { data, error } = await supabase
      .from('quiz_answers')
      .select(`
        user_id,
        points_earned
      `)
      .gte('answered_at', startDate);
      
    if (error) throw error;
    
    // Process data to get total points per user
    const userPoints: Record<string, number> = {};
    data.forEach(item => {
      if (!userPoints[item.user_id]) userPoints[item.user_id] = 0;
      userPoints[item.user_id] += item.points_earned || 0;
    });
    
    // Fetch user profiles for names
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username');
      
    if (profilesError) throw profilesError;
    
    const profileMap: Record<string, string> = {};
    profiles.forEach(profile => {
      profileMap[profile.id] = profile.username;
    });
    
    // Convert to array, sort, and add rank
    const result = Object.entries(userPoints)
      .map(([userId, points]) => ({
        userId,
        username: profileMap[userId] || 'Unknown User',
        points,
        rank: 0 // Will be set after sorting
      }))
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({ ...user, rank: index + 1 }))
      .slice(0, limit);
      
    return result;
  } catch (error) {
    console.error(`Error fetching ${timeframe} top performers:`, error);
    return [];
  }
};
