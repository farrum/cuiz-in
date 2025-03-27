
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, UserCheck, AlertCircle, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { AdminNotification } from '@/types/adminNotification';
import { adminNotificationsApi } from '@/utils/supabaseUtils';
import { supabase } from '@/integrations/supabase/client';

const AdminNotifications: React.FC = () => {
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
        setNotifications(data as unknown as AdminNotification[]);
        setUnreadCount(data.filter((n: any) => !n.read).length);
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
      const channel = adminNotificationsApi.subscribeToNotifications((newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        toast({
          title: 'New Notification',
          description: newNotification.message,
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

  const handleNotificationAction = async (notification: AdminNotification) => {
    await markAsRead(notification.id);
    
    switch (notification.type) {
      case 'reactivation_request':
        window.location.href = '/admin/users?tab=reactivation';
        break;
      case 'withdrawal_request':
      case 'achievement_claim':
        window.location.href = '/admin/payments';
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reactivation_request':
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case 'withdrawal_request':
      case 'achievement_claim':
        return <Wallet className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" /> 
          Notifications
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-1">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              <Badge variant="secondary" className="ml-1">
                {unreadCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          {error && (
            <div className="p-4 mb-4 border border-red-200 bg-red-50 rounded-lg text-red-800">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={fetchNotifications}
              >
                Try Again
              </Button>
            </div>
          )}
          
          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <Bell className="h-10 w-10 mb-2" />
                <h3 className="font-medium">No notifications</h3>
                <p>You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-card' 
                        : 'bg-muted/20 border-primary/20'
                    }`}
                    onClick={() => handleNotificationAction(notification)}
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {notification.message}
                        </div>
                        {!notification.read && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unread">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : notifications.filter(n => !n.read).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <CheckCircle className="h-10 w-10 mb-2" />
                <h3 className="font-medium">No unread notifications</h3>
                <p>You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications
                  .filter(n => !n.read)
                  .map((notification) => (
                    <div 
                      key={notification.id}
                      className="p-3 rounded-lg border border-primary/20 bg-muted/20 flex items-start gap-3 cursor-pointer transition-colors"
                      onClick={() => handleNotificationAction(notification)}
                    >
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {notification.message}
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            New
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminNotifications;
