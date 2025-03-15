
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState<string>(getTabFromPath(location.pathname));

  function getTabFromPath(path: string): string {
    if (path.includes('/users')) return 'users';
    if (path.includes('/logs')) return 'logs';
    if (path.includes('/ads')) return 'ads';
    if (path.includes('/payments')) return 'payments';
    if (path.includes('/referrals')) return 'referrals';
    if (path.includes('/quiz')) return 'quiz';
    if (path.includes('/sync')) return 'sync';
    return 'users';
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your quiz application data and settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-7 lg:w-[800px]">
          <TabsTrigger value="users" asChild>
            <Link to="/admin/users">Users</Link>
          </TabsTrigger>
          <TabsTrigger value="logs" asChild>
            <Link to="/admin/logs">Login Logs</Link>
          </TabsTrigger>
          <TabsTrigger value="ads" asChild>
            <Link to="/admin/ads">Ad Slots</Link>
          </TabsTrigger>
          <TabsTrigger value="payments" asChild>
            <Link to="/admin/payments">Payments</Link>
          </TabsTrigger>
          <TabsTrigger value="referrals" asChild>
            <Link to="/admin/referrals">Referrals</Link>
          </TabsTrigger>
          <TabsTrigger value="quiz" asChild>
            <Link to="/admin/quiz">Quiz</Link>
          </TabsTrigger>
          <TabsTrigger value="sync" asChild>
            <Link to="/admin/sync">Sync</Link>
          </TabsTrigger>
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
