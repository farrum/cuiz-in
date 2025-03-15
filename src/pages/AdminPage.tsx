
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminLoginLogs from '@/components/admin/AdminLoginLogs';
import AdminAdManagement from '@/components/admin/AdminAdManagement';
import AdminPaymentsOverview from '@/components/admin/AdminPaymentsOverview';
import AdminReferralsTracker from '@/components/admin/AdminReferralsTracker';
import { QuizManagement } from '@/components/admin/quiz-management';
import { RealtimeStatus } from '@/components/admin/RealtimeStatus';
import { SyncSettings } from '@/components/admin/SyncSettings';

const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('users');

  // Set the active tab based on the URL when component mounts or URL changes
  useEffect(() => {
    const path = location.pathname;
    let tab = 'users'; // default tab
    
    if (path.includes('/users')) tab = 'users';
    else if (path.includes('/logs')) tab = 'logs';
    else if (path.includes('/ads')) tab = 'ads';
    else if (path.includes('/payments')) tab = 'payments';
    else if (path.includes('/referrals')) tab = 'referrals';
    else if (path.includes('/quiz')) tab = 'quiz';
    else if (path.includes('/sync')) tab = 'sync';
    else if (path === '/admin') {
      // If just at /admin, redirect to /admin/users
      navigate('/admin/users', { replace: true });
      tab = 'users';
    }
    
    setActiveTab(tab);
  }, [location.pathname, navigate]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/admin/${value}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your quiz application data and settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-7 lg:w-[800px]">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logs">Login Logs</TabsTrigger>
          <TabsTrigger value="ads">Ad Slots</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
        </TabsList>
        
        <Separator className="my-6" />

        {activeTab === 'users' && <AdminUserManagement />}
        {activeTab === 'logs' && <AdminLoginLogs />}
        {activeTab === 'ads' && <AdminAdManagement />}
        {activeTab === 'payments' && <AdminPaymentsOverview />}
        {activeTab === 'referrals' && <AdminReferralsTracker />}
        {activeTab === 'quiz' && <QuizManagement />}
        {activeTab === 'sync' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SyncSettings />
            <RealtimeStatus />
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default AdminPage;
