
import { useState, useEffect } from 'react';
import { AdminNotification } from '@/types/adminNotification';
import { adminNotificationsApi } from '@/utils/supabaseUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await adminNotificationsApi.getAll();
        
      if (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications. Please try again.');
        setNotifications([]);
      } else if (data) {
        setNotifications(data as AdminNotification[]);
        setUnreadCount(data.filter((n: AdminNotification) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('An unexpected error occurred while loading notifications.');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    try {
      // Subscribe to realtime updates
      const channel = adminNotificationsApi.subscribeToNotifications((newNotification) => {
        console.log('New notification received:', newNotification);
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show a toast notification
        toast({
          title: 'New Notification',
          description: newNotification.message,
          variant: 'default',
        });
      });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  }, [toast]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await adminNotificationsApi.markAsRead(id);
        
      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        setNotifications(prev => 
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await adminNotificationsApi.markAllAsRead();
        
      if (error) {
        console.error('Error marking all notifications as read:', error);
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const createNotification = async (type: string, message: string, userId?: string, data?: any) => {
    try {
      const notification = {
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

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification
  };
};
