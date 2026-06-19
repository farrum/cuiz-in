import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import UserManagementWithAttendance from '@/components/admin/UserManagementWithAttendance';
import ResetLegacyPlayersButton from '@/components/admin/ResetLegacyPlayersButton';
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
import { 
  BarChart, MessageSquare, Megaphone, Image, AlertCircle, Calendar, Book, 
  HelpCircle, Link2, Search, Gamepad2, UserSearch, Clock, RefreshCw, 
  Users, Award, DollarSign, Volume2, Shield, LogOut, Menu, User, Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { CacheManagement } from '@/components/admin/CacheManagement';
import BlogManagement from '@/components/admin/blog/BlogManagement';
import FaqManagement from '@/components/admin/faq/FaqManagement';
import { ContentPartnerships } from '@/components/admin/partnerships';
import SitemapManagement from '@/components/admin/SitemapManagement';
import AdminGamificationPanel from '@/components/admin/gamification/AdminGamificationPanel';
import GuestActivityPanel from '@/components/admin/GuestActivityPanel';
import { cn } from '@/lib/utils';

const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('users');
  const [activeQuizTab, setActiveQuizTab] = useState<string>('questions');
  const [adminName, setAdminName] = useState<string>('Admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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
    else if (path.includes('/gamification')) tab = 'gamification';
    else if (path.includes('/guests')) tab = 'guests';
    else if (path === '/admin') {
      navigate('/admin/users', { replace: true });
      tab = 'users';
    }
    
    setActiveTab(tab);
  }, [location.pathname, navigate]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setMobileMenuOpen(false);
    
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

  // Sidebar navigation sections
  const navGroups = [
    {
      title: 'Overview & Analytics',
      items: [
        { value: 'reports', label: 'Reports & Analytics', icon: BarChart },
        { value: 'logs', label: 'Login Logs', icon: Clock },
        { value: 'sync', label: 'Cache & Sync Settings', icon: RefreshCw },
      ]
    },
    {
      title: 'Quiz & Content',
      items: [
        { value: 'quiz', label: 'Quiz Questions', icon: Award },
        { value: 'gamification', label: 'Gamification', icon: Gamepad2 },
        { value: 'icons', label: 'Profile Icons', icon: Image },
        { value: 'blog', label: 'Blog Articles', icon: Book },
        { value: 'faq', label: 'FAQ Setup', icon: HelpCircle },
      ]
    },
    {
      title: 'User Management',
      items: [
        { value: 'users', label: 'User Directory', icon: UserSearch },
        { value: 'guests', label: 'Guest Activity', icon: Eye },
        { value: 'referrals', label: 'Referrals Program', icon: Users },
        { value: 'badges', label: 'Badge Config', icon: Shield },
      ]
    },
    {
      title: 'Growth & Ads',
      items: [
        { value: 'ads', label: 'Ad Placements', icon: Megaphone },
        { value: 'payments', label: 'Withdrawal Approvals', icon: DollarSign },
        { value: 'partnerships', label: 'Content Partnerships', icon: Link2 },
      ]
    },
    {
      title: 'Support & Settings',
      items: [
        { value: 'requests', label: 'Support Requests', icon: AlertCircle },
        { value: 'ticker', label: 'News Tickers', icon: Volume2 },
        { value: 'messages', label: 'Fun Feedback Msg', icon: MessageSquare },
        { value: 'seo', label: 'SEO & Sitemap', icon: Search },
      ]
    }
  ];

  const getActiveTabTitle = () => {
    for (const group of navGroups) {
      const match = group.items.find(item => item.value === activeTab);
      if (match) return match.label;
    }
    return 'Dashboard';
  };

  const renderNavItems = () => {
    return (
      <div className="space-y-6">
        {navGroups.map((group, gIndex) => (
          <div key={gIndex} className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 block">
              {group.title}
            </span>
            <div className="space-y-0.5 mt-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => handleTabChange(item.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 relative group",
                      isActive 
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-900/30" 
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Branding Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wider text-white uppercase">CuizIN Admin</h2>
            <p className="text-[10px] text-slate-400 font-bold">CONTROL CENTER</p>
          </div>
        </div>
      </div>

      {/* Grouped Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {renderNavItems()}
      </div>

      {/* Footer Profile Badge */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20 shrink-0">
        <div className="flex items-center justify-between gap-3 p-2 bg-slate-800/30 rounded-2xl border border-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <User className="w-4 h-4" />
            </div>
            <div className="max-w-[120px]">
              <p className="text-xs font-bold text-slate-200 truncate">{adminName}</p>
              <p className="text-[9px] font-bold text-slate-400 tracking-wide uppercase">Administrator</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="w-8 h-8 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50/50 dark:bg-slate-950/20">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header / Mobile Bar */}
        <header className="sticky top-0 z-30 bg-card/85 backdrop-blur-md border-b h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Sheet Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden w-9 h-9 rounded-xl">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-slate-900 border-none">
                {sidebarContent}
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-sm font-bold text-foreground capitalize tracking-wide flex items-center gap-1.5 lg:text-base">
                <span className="text-muted-foreground font-normal">Admin /</span>
                {getActiveTabTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full font-bold">
              ⚡ Live Control
            </span>
          </div>
        </header>

        {/* Tab contents wrapped inside standard Tab view */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="users" className="mt-0 outline-none space-y-4">
              <div className="flex justify-between items-center mb-2">
                <ResetLegacyPlayersButton />
              </div>
              <UserManagementWithAttendance />
            </TabsContent>
            <TabsContent value="logs" className="mt-0 outline-none">
              <AdminLoginLogs />
            </TabsContent>
            <TabsContent value="ads" className="mt-0 outline-none">
              <AdminAdManagement />
            </TabsContent>
            <TabsContent value="payments" className="mt-0 outline-none">
              <AdminPaymentsOverview />
            </TabsContent>
            <TabsContent value="referrals" className="mt-0 outline-none">
              <AdminReferralsTracker />
            </TabsContent>
            <TabsContent value="badges" className="mt-0 outline-none">
              <AdminBadgeManagement />
            </TabsContent>
            <TabsContent value="quiz" className="mt-0 outline-none">
              <Tabs value={activeQuizTab} onValueChange={handleQuizTabChange} className="w-full">
                <div className="flex items-center justify-between border-b pb-3 mb-6">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                    <button
                      onClick={() => handleQuizTabChange('questions')}
                      className={cn(
                        "px-4 py-2 text-xs font-bold rounded-xl transition-all",
                        activeQuizTab === 'questions' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Questions Directory
                    </button>
                    <button
                      onClick={() => handleQuizTabChange('challenges')}
                      className={cn(
                        "px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5",
                        activeQuizTab === 'challenges' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Daily Challenges
                    </button>
                  </div>
                </div>
                
                <TabsContent value="questions" className="mt-0 outline-none">
                  <QuizManagement />
                </TabsContent>
                <TabsContent value="challenges" className="mt-0 outline-none">
                  <AdminDailyChallenges />
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="requests" className="mt-0 outline-none">
              <RequestsManagementPanel />
            </TabsContent>
            <TabsContent value="reports" className="mt-0 outline-none">
              <AdminReports />
            </TabsContent>
            <TabsContent value="messages" className="mt-0 outline-none">
              <FunMessagesAdmin />
            </TabsContent>
            <TabsContent value="ticker" className="mt-0 outline-none">
              <NewsTickerAdmin />
            </TabsContent>
            <TabsContent value="icons" className="mt-0 outline-none">
              <ProfileIconsManagement />
            </TabsContent>
            <TabsContent value="sync" className="mt-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SyncSettings />
                <CacheManagement />
                <RealtimeStatus />
              </div>
            </TabsContent>
            <TabsContent value="blog" className="mt-0 outline-none">
              <BlogManagement />
            </TabsContent>
            <TabsContent value="faq" className="mt-0 outline-none">
              <FaqManagement />
            </TabsContent>
            <TabsContent value="partnerships" className="mt-0 outline-none">
              <ContentPartnerships />
            </TabsContent>
            <TabsContent value="seo" className="mt-0 outline-none">
              <SitemapManagement />
            </TabsContent>
            <TabsContent value="gamification" className="mt-0 outline-none">
              <AdminGamificationPanel />
            </TabsContent>
            <TabsContent value="guests" className="mt-0 outline-none">
              <GuestActivityPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
