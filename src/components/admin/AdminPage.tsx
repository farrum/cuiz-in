
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminUserManagementEnhanced from './AdminUserManagementEnhanced';
import AdminReports from './AdminReports';
import AdminAdManagement from './AdminAdManagement';
import AdminTopPerformers from './AdminTopPerformers';
import AdminLoginLogs from './AdminLoginLogs';
import { SyncSettings } from './SyncSettings';
import { QuizManagement } from './quiz-management';
import AdminReferralsTracker from './AdminReferralsTracker';
import AdminPaymentsOverview from './AdminPaymentsOverview';
import AdminBadgeManagement from './AdminBadgeManagement';
import { RealtimeStatus } from './RealtimeStatus';
import FunMessagesAdmin from './FunMessagesAdmin';
import NewsTickerAdmin from './NewsTickerAdmin';
import ReactivationRequestsPanel from './ReactivationRequestsPanel';
import AdminNotificationsUI from './AdminNotificationsUI';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, Megaphone, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('quiz_app_admin_token');
    navigate('/admin/login');
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
      
      <RealtimeStatus />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 mb-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="ads">Ads</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="performers">Performance</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="ticker">News Ticker</TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-1" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="reactivations">
            <UserCheck className="h-4 w-4 mr-1" />
            Reactivations
          </TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <AdminUserManagementEnhanced />
        </TabsContent>
        
        <TabsContent value="quizzes" className="space-y-4">
          <QuizManagement />
        </TabsContent>
        
        <TabsContent value="ads" className="space-y-4">
          <AdminAdManagement />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <AdminReports />
        </TabsContent>
        
        <TabsContent value="badges" className="space-y-4">
          <AdminBadgeManagement />
        </TabsContent>
        
        <TabsContent value="referrals" className="space-y-4">
          <AdminReferralsTracker />
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <AdminPaymentsOverview />
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <AdminLoginLogs />
        </TabsContent>
        
        <TabsContent value="performers" className="space-y-4">
          <AdminTopPerformers />
        </TabsContent>
        
        <TabsContent value="messages" className="space-y-4">
          <FunMessagesAdmin />
        </TabsContent>
        
        <TabsContent value="ticker" className="space-y-4">
          <NewsTickerAdmin />
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <AdminNotificationsUI />
        </TabsContent>
        
        <TabsContent value="reactivations" className="space-y-4">
          <ReactivationRequestsPanel />
        </TabsContent>
        
        <TabsContent value="sync" className="space-y-4">
          <SyncSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
