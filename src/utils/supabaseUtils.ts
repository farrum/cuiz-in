
import { supabase } from '@/integrations/supabase/client';
import { AdminNotificationInsert } from '@/types/adminNotification';
import { RealtimeChannel } from '@supabase/supabase-js';

export const adminNotificationsApi = {
  /**
   * Get all admin notifications
   */
  getAll: async () => {
    console.log('Fetching all admin notifications');
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });
        
      console.log('Fetched admin notifications:', data?.length || 0);
      return { data, error };
    } catch (error) {
      console.error('Error in adminNotificationsApi.getAll:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Create a new notification
   */
  create: async (notification: AdminNotificationInsert) => {
    console.log('Creating admin notification:', notification);
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .insert(notification)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating notification:', error);
      } else {
        console.log('Created notification:', data);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error in adminNotificationsApi.create:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string) => {
    console.log('Marking notification as read:', id);
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        console.log('Notification marked as read:', id);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error in adminNotificationsApi.markAsRead:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    console.log('Marking all notifications as read');
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false);
        
      if (error) {
        console.error('Error marking all notifications as read:', error);
      } else {
        console.log('All notifications marked as read');
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error in adminNotificationsApi.markAllAsRead:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Subscribe to new notifications
   */
  subscribeToNotifications: (callback: (notification: any) => void): RealtimeChannel => {
    console.log('Setting up realtime subscription for admin_notifications');
    
    // Create a channel to listen for database changes
    const channel = supabase
      .channel('admin_notification_changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'admin_notifications' 
        },
        (payload) => {
          console.log('New notification received via realtime:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
      
    return channel;
  }
};
