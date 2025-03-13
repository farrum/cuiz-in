
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminReferralsTracker from '@/components/admin/AdminReferralsTracker';
import AdminPaymentsOverview from '@/components/admin/AdminPaymentsOverview';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock admin check - in a real app, this would be handled by your auth system
const checkIsAdmin = (): boolean => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER_NAME);
  // For demo purposes, consider "admin" as the admin username
  return userData === 'admin';
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
          <TabsList className="mb-8 w-full max-w-md">
            <TabsTrigger value="users" className="flex-1">User Management</TabsTrigger>
            <TabsTrigger value="referrals" className="flex-1">Referrals</TabsTrigger>
            <TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger>
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
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPage;
