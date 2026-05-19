
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  gems: number;
  explanation: string;
  imageUrl?: string; // URL for image-based questions
  questionType?: 'text' | 'image' | 'multiple-choice' | 'true-false'; // Type of question (default is text)
  createdAt?: string; // Date the question was created
}

export type GameMode = 'normal' | 'time-attack' | 'team-quiz' | 'streak' | 'true-false' | 'flashcards';

export interface GameModeConfig {
  name: string;
  description: string;
  icon: string;
  timeLimit?: number; // in seconds, for time attack mode
  streakMultiplier?: number; // point multiplier for streak mode
  teamSize?: number; // for team mode
}
