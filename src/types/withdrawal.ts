
export interface WithdrawalRequest {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'rejected' | 'approved';
  type?: 'regular' | 'achievement';
}
