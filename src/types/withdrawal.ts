
export interface WithdrawalRequest {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'rejected';
  type?: 'regular' | 'achievement';
}

export interface Achievement {
  id: string;
  type: string;
  month: string;
  reward: number;
  date: string;
  claimed: boolean;
}

export interface SyncStats {
  startTime?: Date;
  endTime?: Date;
  syncedItems?: number;
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  error?: string;
  lastSyncTime?: Date;
}
