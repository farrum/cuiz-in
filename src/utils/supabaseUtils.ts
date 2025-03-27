
import { supabase } from '@/integrations/supabase/client';

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
  createChannel: (channelName: string) => {
    return supabase.channel(channelName);
  }
};

/**
 * Safely interact with the admin_notifications table without TypeScript errors
 */
export const adminNotificationsApi = {
  getAll: async () => {
    try {
      const { data, error } = await safeSupabaseOperation
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });
        
      return { data, error };
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return { data: null, error: err };
    }
  },
  
  markAsRead: async (id: string) => {
    try {
      const { error } = await safeSupabaseOperation
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
      const { error } = await safeSupabaseOperation
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false);
        
      return { error };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { error: err };
    }
  },
  
  create: async (notification: any) => {
    try {
      const { error } = await safeSupabaseOperation
        .from('admin_notifications')
        .insert(notification);
        
      return { error };
    } catch (err) {
      console.error('Error creating notification:', err);
      return { error: err };
    }
  }
};
