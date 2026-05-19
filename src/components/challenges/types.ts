
export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  num_questions: number;
  gems_multiplier: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  question_ids: string[];
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
