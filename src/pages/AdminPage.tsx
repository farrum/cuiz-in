
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import AdminUserManagementEnhanced from '@/components/admin/AdminUserManagementEnhanced';
import AdminLoginLogs from '@/components/admin/AdminLoginLogs';
import AdminAdManagement from '@/components/admin/AdminAdManagement';
import AdminPaymentsOverview from '@/components/admin/AdminPaymentsOverview';
import AdminReferralsTracker from '@/components/admin/AdminReferralsTracker';
import AdminBadgeManagement from '@/components/admin/AdminBadgeManagement';
import AdminReports from '@/components/admin/AdminReports';
import FunMessagesAdmin from '@/components/admin/FunMessagesAdmin';
import NewsTickerAdmin from '@/components/admin/NewsTickerAdmin';
import { QuizManagement } from '@/components/admin/quiz-management';
import { RealtimeStatus } from '@/components/admin/RealtimeStatus';
import { SyncSettings } from '@/components/admin/SyncSettings';
import ProfileIconsManagement from '@/components/admin/ProfileIconsManagement';
import AdminNotifications from '@/components/admin/AdminNotifications';
import RequestsManagementPanel from '@/components/admin/RequestsManagementPanel';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Settings, User, Bell, BarChart, MessageSquare, Megaphone, Image, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';

const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('users');
  const [adminName, setAdminName] = useState<string>('Admin');

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
    else if (path.includes('/reports')) tab = 'reports';
    else if (path.includes('/messages')) tab = 'messages';
    else if (path.includes('/ticker')) tab = 'ticker';
    else if (path.includes('/icons')) tab = 'icons';
    else if (path.includes('/sync')) tab = 'sync';
    else if (path.includes('/requests')) tab = 'requests';
    else if (path === '/admin') {
      navigate('/admin/users', { replace: true });
      tab = 'users';
    }
    
    setActiveTab(tab);
  }, [location.pathname, navigate]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Handle quiz tab navigation - don't override sub-tabs
    if (value === 'quiz' && location.pathname.includes('/quiz/challenges')) {
      return; // Keep the current URL with the challenges sub-tab
    }
    
    navigate(`/admin/${value}`);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_USERNAME);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
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
    } catch (err) {
      console.error("Error during logout:", err);
      toast({
        title: "Logout error",
        description: "An unexpected error occurred during logout",
        variant: "destructive"
      });
      navigate('/admin-login');
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
                  <ul className="grid w-[400px] gap-3 p-4">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <div className="h-48 overflow-auto">
                          <AdminNotifications />
                        </div>
                      </NavigationMenuLink>
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
          <p className="text-muted-foreground mb-4">Manage your quiz application data and settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-12 lg:w-[1200px]">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logs">Login Logs</TabsTrigger>
            <TabsTrigger value="ads">Ad Slots</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
            <TabsTrigger value="requests">
              <AlertCircle className="w-4 h-4 mr-1" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart className="w-4 h-4 mr-1" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-1" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="ticker">
              <Megaphone className="w-4 h-4 mr-1" />
              News Ticker
            </TabsTrigger>
            <TabsTrigger value="icons">
              <Image className="w-4 h-4 mr-1" />
              Profile Icons
            </TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
          </TabsList>
          
          <Separator className="my-6" />

          <TabsContent value="users">
            <AdminUserManagementEnhanced />
          </TabsContent>
          <TabsContent value="logs">
            <AdminLoginLogs />
          </TabsContent>
          <TabsContent value="ads">
            <AdminAdManagement />
          </TabsContent>
          <TabsContent value="payments">
            <AdminPaymentsOverview />
          </TabsContent>
          <TabsContent value="referrals">
            <AdminReferralsTracker />
          </TabsContent>
          <TabsContent value="badges">
            <AdminBadgeManagement />
          </TabsContent>
          <TabsContent value="quiz">
            <QuizManagement />
          </TabsContent>
          <TabsContent value="requests">
            <RequestsManagementPanel />
          </TabsContent>
          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>
          <TabsContent value="messages">
            <FunMessagesAdmin />
          </TabsContent>
          <TabsContent value="ticker">
            <NewsTickerAdmin />
          </TabsContent>
          <TabsContent value="icons">
            <ProfileIconsManagement />
          </TabsContent>
          <TabsContent value="sync">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SyncSettings />
              <RealtimeStatus />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
