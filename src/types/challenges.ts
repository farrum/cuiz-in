
export interface DailyChallenge {
  id: string;
  title: string;
  description: string | null;
  num_questions: number;
  points_multiplier: number;
  question_ids: string[];
  is_active: boolean;
  start_date: string;
  end_date: string;
  created_at?: string;
  created_by?: string;
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  user_id: string;
  completed: boolean;
  score: number;
  started_at: string;
  completed_at: string | null;
}

export interface CreateChallengeInput {
  title: string;
  description: string | null;
  num_questions: number;
  points_multiplier: number;
  question_ids: string[];
  is_active: boolean;
  start_date: string;
  end_date: string;
  created_by: string;
}

export type QuestionDifficulty = "easy" | "medium" | "hard";
