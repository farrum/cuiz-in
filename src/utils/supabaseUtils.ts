
import { supabase } from '@/integrations/supabase/client';
import { AdminNotification, AdminNotificationInsert } from '@/types/adminNotification';

/**
 * A helper function to safely perform operations on tables that may not be fully 
 * typed in the generated TypeScript definitions
 */
export const safeSupabaseOperation = {
  /**
   * Execute a raw query on the admin_notifications table
   */
  adminNotifications: {
    insert: async (notification: AdminNotificationInsert) => {
      try {
        // Use a more direct approach with type assertions
        const result = await supabase
          .from('admin_notifications')
          .insert([notification as any]);
          
        return { error: result.error };
      } catch (err) {
        console.error('Error in adminNotifications.insert:', err);
        return { error: err };
      }
    },
    
    update: async (id: string, data: any) => {
      try {
        const result = await supabase
          .from('admin_notifications')
          .update(data)
          .eq('id', id);
          
        return { error: result.error };
      } catch (err) {
        console.error('Error in adminNotifications.update:', err);
        return { error: err };
      }
    },
    
    // Add other operations as needed
  }
};

/**
 * Safely interact with the admin_notifications table without TypeScript errors
 */
export const adminNotificationsApi = {
  getAll: async () => {
    try {
      // Use raw query approach to avoid type issues
      const result = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false }) as any;
        
      return { 
        data: result.data || [], 
        error: result.error 
      };
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return { data: [], error: err };
    }
  },
  
  markAsRead: async (id: string) => {
    try {
      const result = await supabase
        .from('admin_notifications')
        .update({ read: true } as any)
        .eq('id', id);
        
      return { error: result.error };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { error: err };
    }
  },
  
  markAllAsRead: async () => {
    try {
      const result = await supabase
        .from('admin_notifications')
        .update({ read: true } as any)
        .eq('read', false) as any;
        
      return { error: result.error };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { error: err };
    }
  },
  
  create: async (notification: AdminNotificationInsert) => {
    try {
      // Use direct method with type assertions to avoid TypeScript errors
      const result = await supabase
        .from('admin_notifications')
        .insert([notification as any]);
        
      return { error: result.error };
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
