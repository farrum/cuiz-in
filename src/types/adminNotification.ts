
export interface AdminNotification {
  id: string;
  created_at: string;
  type: 'reactivation_request' | 'withdrawal_request' | 'achievement_claim' | 'system';
  message: string;
  read: boolean;
  user_id: string | null;
  data?: any;
}

// Define the shape of what we send to the database
export interface AdminNotificationInsert {
  type: AdminNotification['type'];
  message: string;
  read: boolean;
  user_id?: string | null;
  data?: any;
}
