
import { supabase } from '@/integrations/supabase/client';
import { AdminNotification, AdminNotificationInsert } from '@/types/adminNotification';

/**
 * Helper function to perform Supabase operations on tables that might not be 
 * in the generated TypeScript types
 */
export const safeSupabaseOperation = {
  /**
   * Safely select from a table, with type assertion
   */
  from: <T = any>(table: string) => {
    // @ts-ignore - We're deliberately bypassing TypeScript's type checking here
    return supabase.from(table);
  },
  
  /**
   * Safely create a realtime channel subscription
   */
  channel: (channelName: string) => {
    return supabase.channel(channelName);
  }
};

/**
 * Safely interact with the admin_notifications table without TypeScript errors
 */
export const adminNotificationsApi = {
  getAll: async () => {
    try {
      // Using a more direct approach to avoid type issues
      const result = await safeSupabaseOperation
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });
        
      return { 
        data: result.data as AdminNotification[] | null, 
        error: result.error 
      };
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return { data: null, error: err };
    }
  },
  
  markAsRead: async (id: string) => {
    try {
      const result = await safeSupabaseOperation
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);
        
      return { error: result.error };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { error: err };
    }
  },
  
  markAllAsRead: async () => {
    try {
      const result = await safeSupabaseOperation
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false);
        
      return { error: result.error };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { error: err };
    }
  },
  
  create: async (notification: AdminNotificationInsert) => {
    try {
      const result = await safeSupabaseOperation
        .from('admin_notifications')
        .insert(notification);
        
      return { error: result.error };
    } catch (err) {
      console.error('Error creating notification:', err);
      return { error: err };
    }
  },

  // Add a channel subscription for notifications
  subscribeToNotifications: (callback: (notification: AdminNotification) => void) => {
    return safeSupabaseOperation.channel('admin_notification_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          callback(payload.new as AdminNotification);
        }
      )
      .subscribe();
  }
};
