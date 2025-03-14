
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminReferralsTracker from '@/components/admin/AdminReferralsTracker';
import AdminPaymentsOverview from '@/components/admin/AdminPaymentsOverview';
import AdminLoginLogs from '@/components/admin/AdminLoginLogs';
import AdminAdManagement from '@/components/admin/AdminAdManagement';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Shield, AlertTriangle, Users, BadgeDollarSign, Clock, Layout, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'quizadmin',
  password: '!Quizzer123'
};

// Check if current user is admin based on stored credentials
const checkIsAdmin = (): boolean => {
  const storedUsername = localStorage.getItem(STORAGE_KEYS.ADMIN_USERNAME);
  const storedAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
  
  // For backwards compatibility, also check the old admin check
  const oldAdminCheck = localStorage.getItem(STORAGE_KEYS.USER_NAME) === 'admin';
  
  return (storedUsername === ADMIN_CREDENTIALS.username && 
         storedAuth === btoa(ADMIN_CREDENTIALS.password)) || oldAdminCheck;
};

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  useEffect(() => {
    const adminCheck = checkIsAdmin();
    setIsAdmin(adminCheck);
    
    if (!adminCheck) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin area.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [navigate, toast]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
          <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-muted-foreground mb-6">
              You need administrator privileges to access this page.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24 md:py-24">
        <div className="flex items-center mb-8 gap-4">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold animate-fade-in">Admin Dashboard</h1>
        </div>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="users" className="flex items-center justify-center">
              <Users className="w-4 h-4 mr-2" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center justify-center">
              <UserPlus className="w-4 h-4 mr-2" />
              <span>Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center justify-center">
              <BadgeDollarSign className="w-4 h-4 mr-2" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger value="login-logs" className="flex items-center justify-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>Login Logs</span>
            </TabsTrigger>
            <TabsTrigger value="ad-management" className="flex items-center justify-center">
              <Layout className="w-4 h-4 mr-2" />
              <span>Ads</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-6">
            <AdminUserManagement />
          </TabsContent>
          
          <TabsContent value="referrals" className="space-y-6">
            <AdminReferralsTracker />
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-6">
            <AdminPaymentsOverview />
          </TabsContent>
          
          <TabsContent value="login-logs" className="space-y-6">
            <AdminLoginLogs />
          </TabsContent>
          
          <TabsContent value="ad-management" className="space-y-6">
            <AdminAdManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPage;
