
export interface WithdrawalRequest {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'rejected' | 'approved' | 'paid';
  type?: 'regular' | 'achievement' | 'quiz' | 'referral';
  userId?: string;
}
