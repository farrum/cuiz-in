
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, User, Home, UserPlus, Target, Shield, LogIn, BarChartIcon } from 'lucide-react';
import { cn } from "@/utils/animations";
import { DAILY_TARGET, MONTHLY_TARGET, STORAGE_KEYS } from '@/utils/quizData';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

const Header: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [todayPoints, setTodayPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    const checkAuth = () => {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
      
      const userLoggedIn = !!userName && !!userId;
      setIsLoggedIn(userLoggedIn);
      setIsAdmin(userName === 'admin' || userName === 'quizadmin' || userRole === 'admin');
      setIsTeamLeader(userRole === 'team_leader' || userRole === 'teamleader');
      
      // Reset points to 0 if user is not logged in
      if (!userLoggedIn) {
        setTodayPoints(0);
        setMonthlyPoints(0);
      }
      
      console.log('Current user role:', userRole);
      console.log('Is team leader:', userRole === 'team_leader' || userRole === 'teamleader');
    };
    
    checkAuth();
    
    // Listen for role updates
    const handleRoleUpdate = () => {
      console.log('Role update event received in Header');
      checkAuth();
    };
    
    window.addEventListener('currentUserRoleUpdated', handleRoleUpdate);
    window.addEventListener('userRoleUpdated', handleRoleUpdate);
    
    return () => {
      window.removeEventListener('currentUserRoleUpdated', handleRoleUpdate);
      window.removeEventListener('userRoleUpdated', handleRoleUpdate);
    };
  }, []);
  
  useEffect(() => {
    const updatePoints = async () => {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) {
        setTodayPoints(0);
        setMonthlyPoints(0);
        return;
      }
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        console.log("Fetching points for:", today, currentMonth);
        
        // Use Promise.all to fetch both daily and monthly points simultaneously
        const [dailyResponse, monthlyResponse] = await Promise.all([
          supabase
            .from('daily_points')
            .select('points')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle(),
            
          supabase
            .from('monthly_points')
            .select('points')
            .eq('user_id', userId)
            .eq('month', currentMonth)
            .maybeSingle()
        ]);
        
        // Process daily points
        if (dailyResponse.data) {
          setTodayPoints(Number(dailyResponse.data.points));
        } else {
          setTodayPoints(0);
        }
        
        // Process monthly points
        if (monthlyResponse.data) {
          setMonthlyPoints(Number(monthlyResponse.data.points));
        } else {
          setMonthlyPoints(0);
        }
        
        // Update local storage for other components to use
        if (dailyResponse.data) {
          localStorage.setItem(`daily_points_${today}`, dailyResponse.data.points.toString());
        }
        
        if (monthlyResponse.data) {
          localStorage.setItem(`monthly_points_${now.getFullYear()}_${now.getMonth()}`, 
            monthlyResponse.data.points.toString());
        }
        
      } catch (error) {
        console.error('Error fetching points data:', error);
      }
    };
    
    if (isLoggedIn) {
      updatePoints();
      const handlePointsUpdate = () => {
        console.log("Points updated event received in Header");
        updatePoints();
      };
      window.addEventListener('pointsUpdated', handlePointsUpdate);
      const intervalId = setInterval(updatePoints, 30000);
      return () => {
        window.removeEventListener('pointsUpdated', handlePointsUpdate);
        clearInterval(intervalId);
      };
    } else {
      // Reset points to 0 if not logged in
      setTodayPoints(0);
      setMonthlyPoints(0);
    }
  }, [isLoggedIn]);
  
  const dailyProgress = Math.min(100, todayPoints / DAILY_TARGET * 100);
  const monthlyProgress = Math.min(100, monthlyPoints / MONTHLY_TARGET * 100);
  
  // Navigation items for logged-in users
  const loggedInNavItems = [
    {
      path: '/',
      label: 'Home',
      icon: <Home className="w-5 h-5" />
    },
    {
      path: '/quiz',
      label: 'Play Quiz',
      icon: <Award className="w-5 h-5" />
    },
    {
      path: '/referral',
      label: 'Referrals',
      icon: <UserPlus className="w-5 h-5" />
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />
    }
  ];
  
  // Add team dashboard if user is team leader
  const teamLeaderItems = isTeamLeader ? [
    {
      path: '/team-dashboard',
      label: 'Team Dashboard',
      icon: <BarChartIcon className="w-5 h-5" />
    }
  ] : [];
  
  // Add admin links if user is admin
  const adminItems = isAdmin ? [
    {
      path: '/admin',
      label: 'Admin',
      icon: <Shield className="w-5 h-5" />
    }
  ] : [];
  
  // Navigation items for logged-out users
  const loggedOutNavItems = [
    {
      path: '/',
      label: 'Home',
      icon: <Home className="w-5 h-5" />
    },
    {
      path: '/login',
      label: 'Login',
      icon: <LogIn className="w-5 h-5" />
    },
    {
      path: '/register',
      label: 'Register',
      icon: <User className="w-5 h-5" />
    },
    {
      path: '/faq',
      label: 'FAQ',
      icon: <Award className="w-5 h-5" />
    },
    {
      path: '/blog',
      label: 'Blog',
      icon: <Award className="w-5 h-5" />
    },
    {
      path: '/categories',
      label: 'Categories',
      icon: <Award className="w-5 h-5" />
    }
  ];
  
  // Combine the navigation items
  const navItems = isLoggedIn
    ? [...loggedInNavItems, ...teamLeaderItems, ...adminItems]
    : loggedOutNavItems;
  
  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300", 
      scrolled ? "glass shadow-sm backdrop-blur-md" : "bg-transparent")}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center space-x-2 animate-fade-in">
            <Award className="w-8 h-8 text-primary bg-transparent" />
            <span className="text-xl font-semibold">
              Cuiz<span className="text-green-500">IN</span>
            </span>
          </Link>
          
          {isLoggedIn && (
            <div className="hidden md:flex flex-col gap-1 w-44">
              <div className="flex text-xs items-center gap-1">
                <Target className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs whitespace-nowrap">Daily:</span>
                <div className="flex-1">
                  <Progress value={dailyProgress} className="h-1.5" />
                </div>
                <span className="text-xs text-muted-foreground">{todayPoints.toFixed(1)}/{DAILY_TARGET}</span>
              </div>
              <div className="flex text-xs items-center gap-1">
                <Target className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs whitespace-nowrap">Monthly:</span>
                <div className="flex-1">
                  <Progress value={monthlyProgress} className="h-1.5" />
                </div>
                <span className="text-xs text-muted-foreground">{monthlyPoints.toFixed(1)}/{MONTHLY_TARGET}</span>
              </div>
            </div>
          )}
        </div>
        
        <nav className="flex items-center space-x-1">
          {navItems.map((item, index) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={cn(
                "relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300", 
                location.pathname === item.path 
                  ? "text-primary-foreground bg-primary shadow-md" 
                  : "text-foreground hover:bg-secondary",
                `animate-slide-up delay-[${index * 100}ms]`
              )}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
