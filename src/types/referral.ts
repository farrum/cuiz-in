
export interface ReferralEntry {
  id: string;
  email: string;
  name: string;
  date: string;
  status: 'pending' | 'active' | 'inactive';
  lastActive: string;
  monthsActive: number;
  totalEarned: number;
}
