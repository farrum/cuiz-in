
export interface WithdrawalRequest {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'rejected';
  type?: 'regular' | 'achievement';
}
