import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Award, User, Home, Target, Shield, LogIn, BarChartIcon, Menu, X, Play, BookOpen, HelpCircle, Landmark, Volume2, VolumeX } from 'lucide-react';
import { cn } from "@/lib/utils";
import { DAILY_TARGET, MONTHLY_TARGET, STORAGE_KEYS } from '@/utils/quizData';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import GuestGemsDisplay from './GuestGemsDisplay';
import { audioManager } from '@/utils/audioManager';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(audioManager.isBgmEnabled());
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
        setMonthlyGems(0); // Used for Stars now
        return;
      }
      
      try {
        const { data } = await supabase.from('profiles').select('points, stars').eq('id', userId).maybeSingle();
        
        if (data) {
          setTodayGems(data.points ?? 0);
          setMonthlyGems(data.stars ?? 0);
          
          // Update local storage too for consistency
          localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(data.points ?? 0));
          localStorage.setItem(STORAGE_KEYS.USER_STARS, String(data.stars ?? 0));
        }
      } catch (error) {
        console.error('Error fetching gems/stars:', error);
      }
    };
    
    if (isLoggedIn) {
      updateGems();
      window.addEventListener('gemsUpdated', updateGems);
      window.addEventListener('shardsUpdated', updateGems); // Optional, trigger generic refresh
      const intervalId = setInterval(updateGems, 15000);
      return () => {
        window.removeEventListener('gemsUpdated', updateGems);
        window.removeEventListener('shardsUpdated', updateGems);
        clearInterval(intervalId);
      };
    }
  }, [isLoggedIn]);

  // Simplified navigation (decluttered - Categories, FAQ, Games moved to footer)
  const mainNavItems = [
    { path: '/', label: 'Home', icon: Home },
  ];

  const loggedInNavItems = [
    { path: '/quiz', label: 'Play', icon: Award },
    { path: '/empire-quests', label: 'Quests', icon: Target },
    { path: '/kingdoms', label: 'Kingdoms', icon: Landmark },
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
              alt="CuizIN - Quiz and Learning Platform Logo"
              width={36}
              height={36}
              fetchPriority="high"
              loading="eager"
              className="w-9 h-9 rounded-xl shadow-lg group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-black font-serif tracking-widest text-slate-800 dark:text-white flex items-center">
              CUIZ<span className="bg-green-600 text-white px-1 rounded-sm ml-[1px]">IN</span>
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
                  "px-3 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-wider",
                  location.pathname === item.path
                    ? "text-amber-700 bg-amber-500/20 border-b-2 border-amber-700 rounded-b-none"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Gems + CTA */}
          <div className="flex items-center gap-3">
            {/* Gems & Stars display - desktop only */}
            {isLoggedIn ? (
              <div className="hidden lg:flex flex-col gap-1 w-32">
                <div className="flex text-xs items-center justify-between gap-1 bg-sky-100/50 px-2 py-0.5 rounded-md border border-sky-200 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] drop-shadow-sm">💎</span>
                    <span className="text-[10px] font-black tracking-widest uppercase text-sky-800">Gems</span>
                  </div>
                  <span className="text-xs font-black text-sky-600 drop-shadow-sm">{todayGems.toFixed(0)}</span>
                </div>
                <div className="flex text-xs items-center justify-between gap-1 bg-amber-100/50 px-2 py-0.5 rounded-md border border-amber-200 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] drop-shadow-sm">⭐</span>
                    <span className="text-[10px] font-black tracking-widest uppercase text-amber-800">Stars</span>
                  </div>
                  <span className="text-xs font-black text-amber-600 drop-shadow-sm">{monthlyGems.toFixed(0)}</span>
                </div>
              </div>
            ) : (
              <GuestGemsDisplay className="hidden lg:flex" />
            )}

            {/* Background Music Mute Button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
              onClick={() => {
                audioManager.toggleBGM();
                setBgmEnabled(audioManager.isBgmEnabled());
              }}
              title={bgmEnabled ? "Mute Background Music" : "Unmute Background Music"}
              aria-label={bgmEnabled ? "Mute background music" : "Unmute background music"}
              aria-pressed={!bgmEnabled}
            >
              {bgmEnabled ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5 text-red-500" aria-hidden="true" />}
            </Button>

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
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  audioManager.toggleBGM();
                  setBgmEnabled(audioManager.isBgmEnabled());
                }}
              >
                {bgmEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-500" />}
                {bgmEnabled ? 'Mute Music' : 'Unmute Music'}
              </Button>

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
