
import React, { useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, UserCheck, AlertCircle, Wallet, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AdminNotification } from '@/types/adminNotification';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';

const AdminNotificationsList: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useAdminNotifications();

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'reactivation_request':
      case 'reactivation_approved':
      case 'account_suspend_request':
      case 'account_reactivate_request':
      case 'new_registration':
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case 'withdrawal_request':
      case 'achievement_claim':
      case 'payment_approved':
        return <Wallet className="h-5 w-5 text-green-500" />;
      case 'auto_suspended':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'performance_alert':
        return <Activity className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  }, []);

  const handleNotificationAction = useCallback(async (notification: AdminNotification) => {
    await markAsRead(notification.id);
    
    switch (notification.type) {
      case 'reactivation_request':
      case 'reactivation_approved':
      case 'account_suspend_request':
      case 'account_reactivate_request':
        window.location.href = '/admin/requests?tab=reactivation';
        break;
      case 'withdrawal_request':
      case 'achievement_claim':
      case 'payment_approved':
        window.location.href = '/admin/requests?tab=payment';
        break;
      case 'new_registration':
        window.location.href = '/admin/users';
        break;
      default:
        break;
    }
  }, [markAsRead]);
  
  // Use useMemo to prevent unnecessary re-renders
  const unreadNotifications = useMemo(() => 
    notifications.filter(n => !n.read), [notifications]);

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
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <Bell className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
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
            ) : unreadNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <CheckCircle className="h-10 w-10 mb-2" />
                <h3 className="font-medium">No unread notifications</h3>
                <p>You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className="p-3 rounded-lg border border-primary/20 bg-muted/20 flex items-start gap-3 cursor-pointer"
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

export default AdminNotificationsList;
