
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import AdminUserManagementEnhanced from '@/components/admin/AdminUserManagementEnhanced';
import AdminLoginLogs from '@/components/admin/AdminLoginLogs';
import AdminAdManagement from '@/components/admin/AdminAdManagement';
import AdminPaymentsOverview from '@/components/admin/AdminPaymentsOverview';
import AdminReferralsTracker from '@/components/admin/AdminReferralsTracker';
import AdminBadgeManagement from '@/components/admin/AdminBadgeManagement';
import AdminTopPerformers from '@/components/admin/AdminTopPerformers';
import { QuizManagement } from '@/components/admin/quiz-management';
import { RealtimeStatus } from '@/components/admin/RealtimeStatus';
import { SyncSettings } from '@/components/admin/SyncSettings';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Settings, User, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('users');
  const [adminName, setAdminName] = useState<string>('Admin');

  // Fetch admin info on load
  useEffect(() => {
    const fetchAdminInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();
          
        if (data?.username) {
          setAdminName(data.username);
        }
      }
    };
    
    fetchAdminInfo();
  }, []);

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
    else if (path.includes('/badges')) tab = 'badges';
    else if (path.includes('/top')) tab = 'top';
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

  // Handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin panel"
      });
      navigate('/admin-login');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Quiz Admin Dashboard</h1>
          </div>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <Bell className="mr-1 h-4 w-4" />
                  Notifications
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[320px] gap-3 p-4">
                    <li className="row-span-3">
                      <div className="text-sm text-muted-foreground">
                        No new notifications
                      </div>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <User className="mr-1 h-4 w-4" />
                  {adminName}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-3 p-4">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          to="/admin/sync"
                          className="flex w-full items-center gap-2 p-2 text-sm hover:bg-muted rounded-md"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 p-2 text-sm hover:bg-muted rounded-md text-red-500"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>

      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your quiz application data and settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-9 lg:w-[1000px]">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logs">Login Logs</TabsTrigger>
            <TabsTrigger value="ads">Ad Slots</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
            <TabsTrigger value="top">Top Players</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
          </TabsList>
          
          <Separator className="my-6" />

          {activeTab === 'users' && <AdminUserManagementEnhanced />}
          {activeTab === 'logs' && <AdminLoginLogs />}
          {activeTab === 'ads' && <AdminAdManagement />}
          {activeTab === 'payments' && <AdminPaymentsOverview />}
          {activeTab === 'referrals' && <AdminReferralsTracker />}
          {activeTab === 'badges' && <AdminBadgeManagement />}
          {activeTab === 'quiz' && <QuizManagement />}
          {activeTab === 'top' && <AdminTopPerformers />}
          {activeTab === 'sync' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SyncSettings />
              <RealtimeStatus />
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
