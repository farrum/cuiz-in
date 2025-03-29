
import React, { useState, useEffect } from 'react';
import { adminNotificationsApi } from '@/utils/supabaseUtils';
import { AdminNotification } from '@/types/adminNotification';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Bell, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { format } from 'date-fns';

const AdminNotificationsUI: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  // Set up realtime updates
  const { lastUpdate } = useSupabaseRealtime('admin_notifications', {
    showToasts: false
  });
  
  // Fetch notifications initially and when realtime updates occur
  useEffect(() => {
    fetchNotifications();
  }, [lastUpdate]);
  
  // Function to load notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await adminNotificationsApi.getAll();
      
      if (error) {
        throw error;
      }
      
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Failed to load notifications",
        description: "There was an error loading the notifications.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle marking a notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await adminNotificationsApi.markAsRead(id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      toast({
        title: "Notification marked as read",
        description: "The notification has been marked as read."
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Failed to update notification",
        description: "There was an error marking the notification as read.",
        variant: "destructive"
      });
    }
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await adminNotificationsApi.markAllAsRead();
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read."
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Failed to update notifications",
        description: "There was an error marking all notifications as read.",
        variant: "destructive"
      });
    }
  };
  
  // Table columns configuration
  const columns = [
    {
      header: "Status",
      accessorKey: "read",
      cell: (row: any) => (
        <Badge variant={row.read ? "outline" : "default"}>
          {row.read ? "Read" : "Unread"}
        </Badge>
      )
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (row: any) => (
        <Badge variant="secondary">
          {row.type}
        </Badge>
      )
    },
    {
      header: "Message",
      accessorKey: "message"
    },
    {
      header: "Date",
      accessorKey: "created_at",
      cell: (row: any) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.created_at), 'MMM d, yyyy h:mm a')}
        </span>
      )
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: any) => (
        <Button
          size="sm"
          variant="ghost"
          disabled={row.read}
          onClick={() => handleMarkAsRead(row.id)}
        >
          <Check className="h-4 w-4 mr-1" />
          Mark Read
        </Button>
      )
    }
  ];
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          <h2 className="text-xl font-semibold">
            Admin Notifications 
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={notifications}
        isLoading={isLoading}
      />
    </Card>
  );
};

export default AdminNotificationsUI;
