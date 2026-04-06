import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import UserManagementWithAttendance from '@/components/admin/UserManagementWithAttendance';
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
import RequestsManagementPanel from '@/components/admin/RequestsManagementPanel';
import AdminDailyChallenges from '@/components/admin/AdminDailyChallenges';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, MessageSquare, Megaphone, Image, AlertCircle, Calendar, Book, HelpCircle, Link2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { CacheManagement } from '@/components/admin/CacheManagement';
import AdminNavbar from '@/components/admin/AdminNavbar';
import BlogManagement from '@/components/admin/blog/BlogManagement';
import FaqManagement from '@/components/admin/faq/FaqManagement';
import { ContentPartnerships } from '@/components/admin/partnerships';
import SitemapManagement from '@/components/admin/SitemapManagement';


const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('users');
  const [activeQuizTab, setActiveQuizTab] = useState<string>('questions');
  const [adminName, setAdminName] = useState<string>('Admin');

  useEffect(() => {
    const initializeAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (data?.username) {
          setAdminName(data.username);
        }
      }
    };
    
    initializeAdmin();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    let tab = 'users'; // default tab
    
    if (path.includes('/users')) tab = 'users';
    else if (path.includes('/logs')) tab = 'logs';
    else if (path.includes('/ads')) tab = 'ads';
    else if (path.includes('/payments')) tab = 'payments';
    else if (path.includes('/referrals')) tab = 'referrals';
    else if (path.includes('/quiz')) {
      tab = 'quiz';
      
      // Set active quiz sub-tab based on URL
      if (path.includes('/quiz/challenges')) {
        setActiveQuizTab('challenges');
      } else {
        setActiveQuizTab('questions');
      }
    }
    else if (path.includes('/badges')) tab = 'badges';
    else if (path.includes('/reports')) tab = 'reports';
    else if (path.includes('/messages')) tab = 'messages';
    else if (path.includes('/ticker')) tab = 'ticker';
    else if (path.includes('/icons')) tab = 'icons';
    else if (path.includes('/sync')) tab = 'sync';
    else if (path.includes('/requests')) tab = 'requests';
    else if (path.includes('/blog')) tab = 'blog';
    else if (path.includes('/faq')) tab = 'faq';
    else if (path.includes('/partnerships')) tab = 'partnerships';
    else if (path.includes('/seo')) tab = 'seo';
    else if (path === '/admin') {
      navigate('/admin/users', { replace: true });
      tab = 'users';
    }
    
    setActiveTab(tab);
  }, [location.pathname, navigate]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'quiz') {
      navigate(`/admin/${value}/${activeQuizTab}`);
    } else {
      navigate(`/admin/${value}`);
    }
  };

  const handleQuizTabChange = (value: string) => {
    setActiveQuizTab(value);
    navigate(`/admin/quiz/${value}`);
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
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Quiz Admin Dashboard</h1>
          </div>
          
          <AdminNavbar adminName={adminName} onLogout={handleLogout} />
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
            <TabsTrigger value="blog">
              <Book className="w-4 h-4 mr-1" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="w-4 h-4 mr-1" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="partnerships">
              <Link2 className="w-4 h-4 mr-1" />
              Partnerships
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search className="w-4 h-4 mr-1" />
              SEO
            </TabsTrigger>
          </TabsList>
          
          <Separator className="my-6" />

          <TabsContent value="users">
            <UserManagementWithAttendance />
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
            <Tabs value={activeQuizTab} onValueChange={handleQuizTabChange} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="questions">
                  Questions
                </TabsTrigger>
                <TabsTrigger value="challenges">
                  <Calendar className="w-4 h-4 mr-1" />
                  Daily Challenges
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="questions">
                <QuizManagement />
              </TabsContent>
              <TabsContent value="challenges">
                <AdminDailyChallenges />
              </TabsContent>
            </Tabs>
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
              <CacheManagement />
              <RealtimeStatus />
            </div>
          </TabsContent>
          <TabsContent value="blog">
            <BlogManagement />
          </TabsContent>
          <TabsContent value="faq">
            <FaqManagement />
          </TabsContent>
          <TabsContent value="partnerships">
            <ContentPartnerships />
          </TabsContent>
          <TabsContent value="seo">
            <SitemapManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
