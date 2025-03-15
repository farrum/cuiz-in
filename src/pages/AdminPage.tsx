
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminPaymentsOverview from '@/components/admin/AdminPaymentsOverview';
import AdminAdManagement from '@/components/admin/AdminAdManagement';
import AdminReferralsTracker from '@/components/admin/AdminReferralsTracker';
import AdminLoginLogs from '@/components/admin/AdminLoginLogs';
import AdminBadgeManagement from '@/components/admin/AdminBadgeManagement';
import { Users, DollarSign, MonitorSmartphone, Link2, KeyRound, Medal, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useFetchSupabaseData } from '@/hooks/useFetchSupabaseData';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("users");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const { isLoading, lastFetched, fetchData } = useFetchSupabaseData(true);
  
  // Check if admin is logged in using useEffect instead of during render
  useEffect(() => {
    const adminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    setIsLoggedIn(adminAuth === 'true');
    
    if (adminAuth !== 'true') {
      navigate('/admin-login');
    }
  }, [navigate]);
  
  // Show loading state while checking authentication
  if (isLoggedIn === null) {
    return <div className="flex justify-center items-center min-h-screen">Loading admin dashboard...</div>;
  }
  
  // Only render the admin page if logged in
  if (!isLoggedIn) {
    return null; // This won't render but navigation will happen in useEffect
  }
  
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USERNAME);
    
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin area.",
    });
    
    navigate('/admin-login');
  };
  
  const adminTabs = [
    { id: "users", label: "Users", icon: <Users className="w-4 h-4 mr-2" /> },
    { id: "payments", label: "Payments", icon: <DollarSign className="w-4 h-4 mr-2" /> },
    { id: "ads", label: "Quiz & Ads", icon: <MonitorSmartphone className="w-4 h-4 mr-2" /> },
    { id: "referrals", label: "Referrals", icon: <Link2 className="w-4 h-4 mr-2" /> },
    { id: "badges", label: "Badges", icon: <Medal className="w-4 h-4 mr-2" /> },
    { id: "security", label: "Security", icon: <KeyRound className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            
            {lastFetched && (
              <span className="text-sm text-muted-foreground">
                Last updated: {lastFetched.toLocaleTimeString()}
              </span>
            )}
            
            <span className="text-sm text-muted-foreground">
              Logged in as <span className="font-semibold">{localStorage.getItem(STORAGE_KEYS.ADMIN_USERNAME)}</span>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-6">
        <div className="tabs-container mb-8 overflow-auto">
          <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              {adminTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center">
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="users">
                <AdminUserManagement />
              </TabsContent>
              
              <TabsContent value="payments">
                <AdminPaymentsOverview />
              </TabsContent>
              
              <TabsContent value="ads">
                <AdminAdManagement />
              </TabsContent>
              
              <TabsContent value="referrals">
                <AdminReferralsTracker />
              </TabsContent>
              
              <TabsContent value="badges">
                <AdminBadgeManagement />
              </TabsContent>
              
              <TabsContent value="security">
                <AdminLoginLogs />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
