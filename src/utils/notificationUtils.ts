
import { adminNotificationsApi } from '@/utils/supabaseUtils';
import { AdminNotificationInsert } from '@/types/adminNotification';

/**
 * Creates a notification for the admin panel
 */
export const createAdminNotification = async (
  type: AdminNotificationInsert['type'],
  message: string,
  userId?: string | null,
  data?: any
): Promise<boolean> => {
  try {
    const notification: AdminNotificationInsert = {
      type,
      message,
      read: false,
      user_id: userId || null,
      data
    };
    
    const { error } = await adminNotificationsApi.create(notification);
    
    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

/**
 * User Management Notifications
 */
export const notifyNewRegistration = async (username: string, userId: string): Promise<boolean> => {
  return createAdminNotification(
    'new_registration',
    `New user registered: ${username}`,
    userId,
    { username }
  );
};

export const notifyReactivationRequest = async (username: string, userId: string): Promise<boolean> => {
  return createAdminNotification(
    'reactivation_request',
    `${username} has requested account reactivation`,
    userId,
    { username }
  );
};

export const notifyAutoSuspended = async (username: string, userId: string, reason: string): Promise<boolean> => {
  return createAdminNotification(
    'auto_suspended',
    `${username}'s account was automatically suspended due to ${reason}`,
    userId,
    { username, reason }
  );
};

export const notifySuspensionRequest = async (
  requesterUsername: string, 
  targetUsername: string, 
  targetUserId: string,
  reason: string
): Promise<boolean> => {
  return createAdminNotification(
    'account_suspend_request',
    `Team leader ${requesterUsername} requested suspension for ${targetUsername}`,
    targetUserId,
    { requesterUsername, targetUsername, reason }
  );
};

/**
 * Payment & Achievement Notifications
 */
export const notifyWithdrawalRequest = async (username: string, userId: string, amount: number): Promise<boolean> => {
  return createAdminNotification(
    'withdrawal_request',
    `${username} has requested a withdrawal of ₹${amount}`,
    userId,
    { username, amount }
  );
};

export const notifyAchievementClaim = async (
  username: string, 
  userId: string, 
  achievement: string, 
  gems: number
): Promise<boolean> => {
  return createAdminNotification(
    'achievement_claim',
    `${username} has claimed achievement: ${achievement} for ${gems} gems`,
    userId,
    { username, achievement, gems }
  );
};

/**
 * System & Performance Notifications
 */
export const notifyPerformanceAlert = async (metric: string, value: number, threshold: number): Promise<boolean> => {
  return createAdminNotification(
    'performance_alert',
    `System alert: ${metric} has reached ${value} (threshold: ${threshold})`,
    null,
    { metric, value, threshold }
  );
};

export const notifySystemEvent = async (event: string, details: any): Promise<boolean> => {
  return createAdminNotification(
    'system',
    `System event: ${event}`,
    null,
    details
  );
};
