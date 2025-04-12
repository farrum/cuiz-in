
import { supabase } from '@/integrations/supabase/client';
import { AdminNotification, AdminNotificationInsert } from '@/types/adminNotification';

/**
 * Direct API functions for admin notifications to avoid TypeScript errors
 * This approach completely bypasses the TypeScript type checking for this table
 */
export const adminNotificationsApi = {
  getAll: async () => {
    try {
      // Use raw query with explicit type casting to avoid TypeScript errors
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false }) as unknown as { 
          data: AdminNotification[] | null, 
          error: any 
        };
      
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
      // Use raw query with explicit type casting to avoid TypeScript errors
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id) as unknown as { error: any };
        
      return { error };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { error: err };
    }
  },
  
  markAllAsRead: async () => {
    try {
      // Use raw query with explicit type casting to avoid TypeScript errors
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false) as unknown as { error: any };
        
      return { error };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { error: err };
    }
  },
  
  create: async (notification: AdminNotificationInsert) => {
    try {
      // Validate notification data
      if (!notification.type || !notification.message) {
        console.error('Invalid notification data:', notification);
        return { data: null, error: new Error('Invalid notification data') };
      }
      
      // Use raw query with explicit type casting to avoid TypeScript errors
      const { data, error } = await supabase
        .from('admin_notifications')
        .insert([notification])
        .select() as unknown as { data: any, error: any };
        
      if (error) {
        console.error('Error creating notification:', error);
      } else {
        console.log('Notification created successfully:', data);
      }
      
      return { data, error };
    } catch (err) {
      console.error('Error creating notification:', err);
      return { data: null, error: err };
    }
  },

  // Add a channel subscription for notifications
  subscribeToNotifications: (callback: (notification: AdminNotification) => void) => {
    try {
      const channel = supabase.channel('admin_notification_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_notifications',
          },
          (payload) => {
            console.log('Real-time notification received:', payload);
            callback(payload.new as AdminNotification);
          }
        )
        .subscribe((status) => {
          console.log('Admin notification subscription status:', status);
        });
        
      return channel;
    } catch (error) {
      console.error('Error setting up real-time notification subscription:', error);
      throw error;
    }
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
        console.log('Updating notification:', id, data);
        const { error } = await supabase
          .from('admin_notifications')
          .update(data)
          .eq('id', id) as unknown as { error: any };
          
        return { error };
      } catch (err) {
        console.error('Error in adminNotifications.update:', err);
        return { error: err };
      }
    }
  }
};
