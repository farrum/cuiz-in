import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Award, User, Home, Target, Shield, LogIn, BarChartIcon, 
  Menu, X, Play, Landmark, Volume2, VolumeX, Bell, Flame, Sparkles, Gamepad2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { STORAGE_KEYS } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import GuestGemsDisplay from './GuestGemsDisplay';
import { audioManager } from '@/utils/audioManager';
import { getUnreadCount, checkScheduledReminders } from '@/utils/notificationManager';
import { NotificationCenterModal } from '@/components/notifications/NotificationCenterModal';
import { GooglePlayBadge } from '@/components/app-promo/GooglePlay';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { streak } = usePersistentQuizStats();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(audioManager.isBgmEnabled());
  const [todayGems, setTodayGems] = useState(0);
  const [monthlyGems, setMonthlyGems] = useState(0);
  const [userName, setUserName] = useState('Adventurer');
  const [userRole, setUserRole] = useState('player');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [notifModalOpen, setNotifModalOpen] = useState(false);

  useEffect(() => {
    checkScheduledReminders();
    setUnreadNotifCount(getUnreadCount());

    const handleNotifUpdate = () => setUnreadNotifCount(getUnreadCount());
    window.addEventListener('cuizinNotificationUpdate', handleNotifUpdate);
    return () => window.removeEventListener('cuizinNotificationUpdate', handleNotifUpdate);
  }, []);
  
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
      const name = localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Adventurer';
      const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE) || 'player';
      
      const userLoggedIn = !!userId;
      setIsLoggedIn(userLoggedIn);
      setUserName(name);
      setUserRole(role);
      setIsAdmin(role === 'admin');
      setIsTeamLeader(role === 'team_leader' || role === 'teamleader');
      
      if (!userLoggedIn) {
        setTodayGems(0);
        setMonthlyGems(0);
      }
    };
    
    syncFromCache();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
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
        const { data } = await supabase.from('profiles').select('points, stars').eq('id', userId).maybeSingle();
        if (data) {
          setTodayGems(data.points ?? 0);
          setMonthlyGems(data.stars ?? 0);
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
      window.addEventListener('advisorShardsUpdated', updateGems);
      const intervalId = setInterval(updateGems, 15000);
      return () => {
        window.removeEventListener('gemsUpdated', updateGems);
        window.removeEventListener('advisorShardsUpdated', updateGems);
        clearInterval(intervalId);
      };
    }
  }, [isLoggedIn]);

  // Grand Citadel navigation
  const mainNavItems = [
    { path: '/', label: 'Citadel', icon: Home },
    { path: '/quiz', label: 'Play & Quests', icon: Award },
    { path: '/kingdoms', label: 'Kingdoms', icon: Landmark },
    { path: '/minigames', label: 'Mini-Games', icon: Gamepad2 },
  ];

  const loggedInNavItems = [
    { path: '/profile', label: 'Crest & Profile', icon: User },
  ];

  const adminNavItems = isAdmin ? [{ path: '/admin', label: 'Grand Admin', icon: Shield }] : [];
  const teamLeaderNavItems = isTeamLeader ? [{ path: '/team-dashboard', label: 'Squad', icon: BarChartIcon }] : [];
  
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
        ? "bg-[#18130E]/95 backdrop-blur-md shadow-2xl border-b border-amber-600/30" 
        : "bg-[#1C1611]/90 backdrop-blur-sm border-b border-amber-800/30 shadow-md"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Realm Badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center group" aria-label="CuizIN Home - Royal Citadel">
              <img
                src="/cuizin-logo.png"
                alt="CuizIN - Royal Quiz Platform Logo"
                width={150}
                height={40}
                fetchPriority="high"
                loading="eager"
                className="h-9 md:h-10 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-[0_2px_8px_rgba(245,158,11,0.25)]"
              />
            </Link>

            <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-400 border border-amber-500/30">
              👑 Royal Citadel
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider",
                    isActive
                      ? "text-amber-300 bg-amber-500/20 border border-amber-500/40 shadow-sm"
                      : "text-amber-200/70 hover:text-amber-100 hover:bg-white/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 opacity-80" strokeWidth={2.2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side: Player Realm Stats + CTA */}
          <div className="flex items-center gap-2.5">
            {/* Player Currencies (Desktop Web) */}
            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                {/* Gems */}
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-200 shadow-sm"
                  title="Royal Gems"
                >
                  <span className="text-xs">💎</span>
                  <span className="text-xs font-black">{todayGems.toLocaleString()}</span>
                </div>

                {/* Stars */}
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-200 shadow-sm"
                  title="Imperial Stars"
                >
                  <span className="text-xs">⭐</span>
                  <span className="text-xs font-black">{monthlyGems.toLocaleString()}</span>
                </div>

                {/* Streak */}
                {streak > 0 && (
                  <div 
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-200 shadow-sm"
                    title="Daily Streak"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span className="text-xs font-black">{streak}</span>
                  </div>
                )}
              </div>
            ) : (
              <GuestGemsDisplay className="hidden md:flex" />
            )}

            {/* Background Music Toggle */}
            <button
              onClick={() => {
                audioManager.toggleBGM();
                setBgmEnabled(audioManager.isBgmEnabled());
              }}
              title={bgmEnabled ? "Mute Citadel Music" : "Play Citadel Music"}
              className="w-8 h-8 rounded-full bg-white/5 border border-amber-700/30 text-amber-200/80 hover:text-amber-100 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              aria-label="Toggle background music"
            >
              {bgmEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setNotifModalOpen(true)}
              title="Royal Decrees"
              className="w-8 h-8 rounded-full bg-white/5 border border-amber-700/30 text-amber-200/80 hover:text-amber-100 relative flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-stone-900 animate-pulse">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>

            {/* Google Play App Badge */}
            <GooglePlayBadge size="sm" className="hidden xl:inline-flex" />

            {/* Embark / Play CTA */}
            <Button
              onClick={handlePlayNow}
              size="sm"
              className="btn-3d font-black uppercase text-xs tracking-wider border-0 shadow-md text-stone-950"
              style={{
                background: 'linear-gradient(135deg, hsl(42 90% 50%) 0%, hsl(34 92% 44%) 100%)',
                boxShadow: '0 2px 0 hsl(34 92% 28%), 0 4px 12px rgba(245, 158, 11, 0.25)',
              }}
            >
              <Play className="w-3.5 h-3.5 mr-1 fill-current" />
              {isLoggedIn ? 'Play Quiz' : 'Embark'}
            </Button>

            {/* Login for guests */}
            {!isLoggedIn && (
              <Link to="/login" className="hidden sm:block">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs font-bold border-amber-700/40 bg-white/5 text-amber-200 hover:bg-white/10 hover:text-white"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu hamburger */}
            <button
              className="lg:hidden w-8 h-8 rounded-lg bg-white/5 border border-amber-700/30 text-amber-200 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Dropdown Menu */}
      {mobileMenuOpen && (
        <nav className="lg:hidden bg-[#18130E]/98 backdrop-blur-xl border-t border-amber-800/40 p-4 space-y-2 animate-fade-in">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors",
                location.pathname === item.path
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-amber-100/70 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
          
          <div className="pt-3 border-t border-amber-800/30 flex flex-col gap-2">
            <Button
              onClick={handlePlayNow}
              className="w-full btn-3d font-black uppercase text-xs tracking-wider text-stone-950"
              style={{
                background: 'linear-gradient(135deg, hsl(42 90% 50%) 0%, hsl(34 92% 44%) 100%)',
              }}
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              {isLoggedIn ? 'Play Quiz' : 'Embark Quest'}
            </Button>

            {!isLoggedIn && (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full border-amber-700/40 text-amber-200">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </nav>
      )}

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
      />
    </header>
  );
};

export default Header;

