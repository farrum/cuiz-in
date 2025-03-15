
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points?: number;
  explanation?: string;
}

export interface Achievement {
  id: string;
  type: string;
  month: string;
  reward: number;
  date: string;
  claimed: boolean;
}

export const STORAGE_KEYS = {
  USER_NAME: 'quiz_app_user_name',
  USER_POINTS: 'quiz_app_user_points',
  CURRENT_QUIZ: 'quiz_app_current_quiz',
  COMPLETED_QUIZZES: 'quiz_app_completed_quizzes',
  USER_QUIZ_HISTORY: 'quiz_app_user_quiz_history',
  ADMIN_USERNAME: 'quiz_app_admin_username',
  ADMIN_AUTH: 'quiz_app_admin_auth',
  COMPLETED_QUESTIONS: 'quiz_app_completed_questions',
  REFERRALS: 'quiz_app_referrals'
};
