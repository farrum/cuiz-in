
export interface AnsweredQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  selected_answer: string;
  answered_at: string;
  explanation: string;
  category: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[] | Record<string, string> | string;
  correct_answer: string;
  explanation: string;
  category: string;
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  selected_answer: string;
  correct: boolean;
  answered_at: string;
  quiz_questions: QuizQuestion | null;
}

export interface RecentlyAnsweredQuestionsProps {
  userId: string;
  limit?: number;
}
