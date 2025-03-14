
// Custom type definitions to be used alongside the auto-generated types
export interface Profile {
  id: string;
  username: string | null;
  points: number | null;
  upi_id: string | null;
  phone: string | null;
  suspended: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'team_leader' | 'player';
  created_at: string | null;
}

export interface LoginLog {
  id: string;
  username: string;
  user_id: string | null;
  login_time: string | null;
  device: string | null;
  ip_address: string | null;
}

export interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean | null;
  created_at: string | null;
  last_updated: string | null;
}

export interface DailyPoints {
  id: string;
  user_id: string;
  date: string;
  points: number | null;
}

export interface MonthlyPoints {
  id: string;
  user_id: string;
  year_month: string;
  points: number | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string | null;
  category: string;
  explanation: string | null;
  created_at: string | null;
  active: boolean | null;
}
