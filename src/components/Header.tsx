import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Award, User, Home, Target, Shield, LogIn, BarChartIcon, Menu, X, Play, BookOpen, HelpCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { DAILY_TARGET, MONTHLY_TARGET, STORAGE_KEYS } from '@/utils/quizData';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import GuestGemsDisplay from './GuestGemsDisplay';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [todayGems, setTodayGems] = useState(0);
  const [monthlyGems, setMonthlyGems] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    const syncFromCache = () => {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
      
      const userLoggedIn = !!userName && !!userId;
      setIsLoggedIn(userLoggedIn);
      setIsAdmin(userRole === 'admin');
      setIsTeamLeader(userRole === 'team_leader' || userRole === 'teamleader');
      
      if (!userLoggedIn) {
        setTodayGems(0);
        setMonthlyGems(0);
      }
    };
    
    // Initial sync from localStorage (populated by App.tsx auth listener)
    syncFromCache();

    // Re-sync when auth state changes (App.tsx updates localStorage, then this fires)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Defer to let App.tsx hydration complete first
      setTimeout(syncFromCache, 50);
    });
    
    const handleRoleUpdate = () => syncFromCache();
    window.addEventListener('currentUserRoleUpdated', handleRoleUpdate);
    window.addEventListener('userRoleUpdated', handleRoleUpdate);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('currentUserRoleUpdated', handleRoleUpdate);
      window.removeEventListener('userRoleUpdated', handleRoleUpdate);
    };
  }, []);
  
  useEffect(() => {
    const updateGems = async () => {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) {
        setTodayGems(0);
        setMonthlyGems(0);
        return;
      }
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const [dailyResponse, monthlyResponse] = await Promise.all([
          supabase.from('daily_points').select('gems:points').eq('user_id', userId).eq('date', today).maybeSingle(),
          supabase.from('monthly_points').select('gems:points').eq('user_id', userId).eq('month', currentMonth).maybeSingle()
        ]);
        
        setTodayGems(dailyResponse.data?.gems ?? 0);
        setMonthlyGems(monthlyResponse.data?.gems ?? 0);
        
      } catch (error) {
        console.error('Error fetching gems:', error);
      }
    };
    
    if (isLoggedIn) {
      updateGems();
      window.addEventListener('gemsUpdated', updateGems);
      const intervalId = setInterval(updateGems, 30000);
      return () => {
        window.removeEventListener('gemsUpdated', updateGems);
        clearInterval(intervalId);
      };
    }
  }, [isLoggedIn]);
  
  const dailyProgress = Math.min(100, todayGems / DAILY_TARGET * 100);
  const monthlyProgress = Math.min(100, monthlyGems / MONTHLY_TARGET * 100);

  // Simplified navigation
  const mainNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/categories', label: 'Categories', icon: BookOpen },
    { path: '/faq', label: 'FAQ', icon: HelpCircle },
    { path: '/minigames', label: 'Games', icon: Play },
  ];

  const loggedInNavItems = [
    { path: '/quiz', label: 'Play', icon: Award },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const adminNavItems = isAdmin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : [];
  const teamLeaderNavItems = isTeamLeader ? [{ path: '/team-dashboard', label: 'Team', icon: BarChartIcon }] : [];
  
  const navItems = isLoggedIn 
    ? [...mainNavItems, ...loggedInNavItems, ...teamLeaderNavItems, ...adminNavItems]
    : mainNavItems;

  const handlePlayNow = () => {
    navigate(isLoggedIn ? '/quiz' : '/register');
    setMobileMenuOpen(false);
  };
  
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-background/95 backdrop-blur-md shadow-md border-b border-border/50" 
        : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" aria-label="CuizIN Home - Go to homepage">
            <img
              src="/cuizin-logo.png"
              alt="CuizIN logo"
              width={36}
              height={36}
              fetchPriority="high"
              loading="eager"
              className="w-9 h-9 rounded-xl shadow-lg group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold">
              Cuiz<span className="text-primary">IN</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={location.pathname === item.path ? "page" : undefined}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Gems + CTA */}
          <div className="flex items-center gap-3">
            {/* Gems display - desktop only */}
            {isLoggedIn ? (
              <div className="hidden lg:flex flex-col gap-1 w-36">
                <div className="flex text-xs items-center gap-1">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">Daily:</span>
                  <Progress value={dailyProgress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">{todayGems.toFixed(0)}</span>
                </div>
                <div className="flex text-xs items-center gap-1">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">Monthly:</span>
                  <Progress value={monthlyProgress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">{monthlyGems.toFixed(0)}</span>
                </div>
              </div>
            ) : (
              <GuestGemsDisplay className="hidden lg:flex" />
            )}

            {/* Play Now CTA - always visible */}
            <Button
              onClick={handlePlayNow}
              size="sm"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hidden sm:flex"
            >
              <Play className="w-4 h-4 mr-1.5 fill-current" />
              Play Now
            </Button>

            {/* Auth buttons for logged out users */}
            {!isLoggedIn && (
              <Link to="/login" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav id="mobile-menu" className="md:hidden bg-background/98 backdrop-blur-lg border-t border-border animate-fade-in" aria-label="Mobile navigation">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={location.pathname === item.path ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
            
            <div className="pt-4 space-y-2">
              <Button onClick={handlePlayNow} className="w-full">
                <Play className="w-4 h-4 mr-2 fill-current" />
                Play Now
              </Button>
              
              {!isLoggedIn && (
                <Link to="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
