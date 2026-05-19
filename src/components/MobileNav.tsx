
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, User, Award, Gift, LogIn, LogOut, Settings, Target, Sparkles, PartyPopper, Brain, BarChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS, DAILY_TARGET, MONTHLY_TARGET } from '@/utils/quizData';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(STORAGE_KEYS.USER_NAME));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem(STORAGE_KEYS.USER_ROLE) === 'admin');
  const [isTeamLeader, setIsTeamLeader] = useState(
    localStorage.getItem(STORAGE_KEYS.USER_ROLE) === 'team_leader' || 
    localStorage.getItem(STORAGE_KEYS.USER_ROLE) === 'teamleader'
  );
  const location = useLocation();
  const isMobile = useIsMobile();
  const [todayGems, setTodayGems] = useState(0);
  const [monthlyGems, setMonthlyGems] = useState(0);

  // Sync auth state from localStorage (populated by App.tsx auth listener)
  useEffect(() => {
    const syncAuth = () => {
      const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
      setIsAuthenticated(!!userName && !!userId);
      setIsAdmin(role === 'admin');
      setIsTeamLeader(role === 'team_leader' || role === 'teamleader');
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(syncAuth, 50);
    });

    return () => { subscription.unsubscribe(); };
  }, []);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const closeMenu = () => {
    setIsOpen(false);
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    closeMenu();
    window.location.href = '/';
  };
  
  useEffect(() => {
    const updateGems = async () => {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const { data: dailyData } = await supabase
          .from('daily_points')
          .select('gems:points')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();
          
        if (dailyData) {
          setTodayGems(Number(dailyData.gems));
        } else {
          setTodayGems(0);
        }
        
        const { data: monthlyData } = await supabase
          .from('monthly_points')
          .select('gems:points')
          .eq('user_id', userId)
          .eq('month', currentMonth)
          .maybeSingle();
          
        if (monthlyData) {
          setMonthlyGems(Number(monthlyData.gems));
        } else {
          setMonthlyGems(0);
        }
      } catch (error) {
        console.error('Error fetching gems data:', error);
      }
    };
    
    if (isAuthenticated) {
      updateGems();
      
      const handleGemsUpdate = () => {
        updateGems();
      };
      
      window.addEventListener('gemsUpdated', handleGemsUpdate);
      
      const intervalId = setInterval(updateGems, 10000);
      
      return () => {
        window.removeEventListener('gemsUpdated', handleGemsUpdate);
        clearInterval(intervalId);
      };
    }
  }, [isAuthenticated]);

  // Listen for role updates
  useEffect(() => {
    const handleRoleUpdate = () => {
      console.log('Role update received in MobileNav');
      // Force re-render by setting state
      setIsOpen(isOpen);
    };
    
    window.addEventListener('userRoleUpdated', handleRoleUpdate);
    window.addEventListener('currentUserRoleUpdated', handleRoleUpdate);
    
    return () => {
      window.removeEventListener('userRoleUpdated', handleRoleUpdate);
      window.removeEventListener('currentUserRoleUpdated', handleRoleUpdate);
    };
  }, [isOpen]);
  
  if (!isMobile) return null;
  
  const dailyProgress = Math.min(100, (todayGems / DAILY_TARGET) * 100);
  const monthlyProgress = Math.min(100, (monthlyGems / MONTHLY_TARGET) * 100);
  
  const menuGradient = "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950";
  
  return (
    <div className="md:hidden">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMenu} 
        className="z-50 relative"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} className="text-primary" /> : <Menu size={24} />}
      </Button>
      
      <div 
        className={`fixed inset-0 ${menuGradient} z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-xl`}
      >
        <div className="flex flex-col h-full pt-16 px-6">
          <div className="space-y-1 flex-1">
            <div className="mb-6 text-center">
              <PartyPopper className="h-12 w-12 mx-auto text-primary mb-2" />
              <h2 className="text-xl font-bold text-primary">
                Cuiz<span className="text-green-500">IN</span>
              </h2>
              <p className="text-sm text-muted-foreground">Play, Learn & Earn!</p>
            </div>
            
            <Link 
              to="/" 
              className={`flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors ${
                location.pathname === '/' ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={closeMenu}
            >
              <Home className="mr-3 h-5 w-5" />
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/quiz" 
                  className={`flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors ${
                    location.pathname === '/quiz' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={closeMenu}
                >
                  <Brain className="mr-3 h-5 w-5" />
                  Quiz
                  <Sparkles className="ml-2 h-4 w-4 text-yellow-500" />
                </Link>
                
                <Link 
                  to="/profile" 
                  className={`flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors ${
                    location.pathname === '/profile' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={closeMenu}
                >
                  <User className="mr-3 h-5 w-5" />
                  Profile
                </Link>
                
                <Link 
                  to="/referral" 
                  className={`flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors ${
                    location.pathname === '/referral' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={closeMenu}
                >
                  <Gift className="mr-3 h-5 w-5" />
                  Referrals
                </Link>

                {isTeamLeader && (
                  <Link 
                    to="/team-dashboard" 
                    className={`flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors ${
                      location.pathname === '/team-dashboard' ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={closeMenu}
                  >
                    <BarChartIcon className="mr-3 h-5 w-5" />
                    Team Dashboard
                  </Link>
                )}
                
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors ${
                      location.pathname === '/admin' ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={closeMenu}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Admin
                  </Link>
                )}
                
                <div className="mt-6 space-y-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl shadow-sm backdrop-blur-sm">
                  <h3 className="flex items-center text-sm font-medium mb-2">
                    <Target className="w-4 h-4 mr-2 text-primary" />
                    Progress Targets
                  </h3>
                  
                  <div className="space-y-1">
                    <div className="flex text-xs items-center justify-between mb-1">
                      <span className="font-medium">Daily Target:</span>
                      <span className="font-bold">{todayGems.toFixed(1)}/{DAILY_TARGET}</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden">
                      <Progress value={dailyProgress} className="h-full" />
                      {dailyProgress > 15 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                          {dailyProgress.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex text-xs items-center justify-between mb-1">
                      <span className="font-medium">Monthly Target:</span>
                      <span className="font-bold">{monthlyGems.toFixed(1)}/{MONTHLY_TARGET}</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden">
                      <Progress value={monthlyProgress} className="h-full" />
                      {monthlyProgress > 15 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                          {monthlyProgress.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full text-left p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors text-red-500 mt-4"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors ${
                    location.pathname === '/login' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={closeMenu}
                >
                  <LogIn className="mr-3 h-5 w-5" />
                  Login
                </Link>
                
                <Link 
                  to="/register" 
                  className={`flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors ${
                    location.pathname === '/register' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={closeMenu}
                >
                  <User className="mr-3 h-5 w-5" />
                  Register
                  <Sparkles className="ml-2 h-4 w-4 text-yellow-500" />
                </Link>
              </>
            )}
          </div>
          
          <div className="py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-muted-foreground">© 2023 Cuiz<span className="text-green-500">IN</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
