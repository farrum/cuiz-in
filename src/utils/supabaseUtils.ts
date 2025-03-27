
import { supabase } from '@/integrations/supabase/client';
import { AdminNotification, AdminNotificationInsert } from '@/types/adminNotification';

/**
 * Direct API functions for admin notifications to avoid TypeScript errors
 * This approach completely bypasses the TypeScript type checking for this table
 */
export const adminNotificationsApi = {
  getAll: async () => {
    try {
      // Use raw query with cast to avoid type issues
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false }) as any;
        
      return { 
        data: data || [], 
        error: error 
      };
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return { data: [], error: err };
    }
  },
  
  markAsRead: async (id: string) => {
    try {
      // Use raw query with cast to avoid type issues
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id) as any;
        
      return { error };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { error: err };
    }
  },
  
  markAllAsRead: async () => {
    try {
      // Use raw query with cast to avoid type issues
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false) as any;
        
      return { error };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { error: err };
    }
  },
  
  create: async (notification: AdminNotificationInsert) => {
    try {
      // Use raw query with cast to avoid type issues
      const { error } = await supabase
        .from('admin_notifications')
        .insert([notification]) as any;
        
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

/**
 * A legacy compatibility layer to maintain backward compatibility
 * with existing code that uses safeSupabaseOperation
 */
export const safeSupabaseOperation = {
  adminNotifications: {
    insert: async (notification: AdminNotificationInsert) => {
      return adminNotificationsApi.create(notification);
    },
    
    update: async (id: string, data: any) => {
      try {
        const { error } = await supabase
          .from('admin_notifications')
          .update(data)
          .eq('id', id) as any;
          
        return { error };
      } catch (err) {
        console.error('Error in adminNotifications.update:', err);
        return { error: err };
      }
    }
  }
};
