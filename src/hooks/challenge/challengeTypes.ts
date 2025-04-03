
// Define basic interfaces without complex nesting
export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  num_questions: number;
  points_multiplier: number;
  question_ids: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  completed: boolean;
  score: number;
}

export interface Answer {
  questionId: string;
  correct: boolean;
  selectedAnswer: string;
  explanation?: string;
  correctAnswer?: string;
}

// Simplified explanation interface without nesting
export interface QuestionExplanation {
  question: string;
  explanation: string;
  correctAnswer: string;
}

// Use simple indexed types to avoid deep type instantiation
export interface SimpleMap<T> {
  [key: string]: T;
}

// For QuizQuestion from utils
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}
