
import { supabase } from '@/integrations/supabase/client';
import { AdminNotification, AdminNotificationInsert } from '@/types/adminNotification';

/**
 * Safely interact with the admin_notifications table without TypeScript errors
 */
export const adminNotificationsApi = {
  getAll: async () => {
    try {
      // Use raw query approach to avoid type issues
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });
        
      return { 
        data: data || [], 
        error 
      };
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return { data: [], error: err };
    }
  },
  
  markAsRead: async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);
        
      return { error };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { error: err };
    }
  },
  
  markAllAsRead: async () => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false);
        
      return { error };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { error: err };
    }
  },
  
  create: async (notification: AdminNotificationInsert) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .insert(notification);
        
      return { error };
    } catch (err) {
      console.error('Error creating notification:', err);
      return { error: err };
    }
  },

  // Add a channel subscription for notifications
  subscribeToNotifications: (callback: (notification: AdminNotification) => void) => {
    return supabase.channel('admin_notification_changes')
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
