import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, User, Home, UserPlus, Target, Shield, LogIn } from 'lucide-react';
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
      
      setIsLoggedIn(!!userName && !!userId);
      setIsAdmin(userName === 'admin' || userName === 'quizadmin');
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    const updatePoints = async () => {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        
        console.log("Fetching points for:", today, currentMonth);
        
        const { data: dailyData, error: dailyError } = await supabase
          .from('daily_points')
          .select('points')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();
          
        console.log("Daily points response:", { dailyData, dailyError });
          
        if (dailyData) {
          setTodayPoints(Number(dailyData.points));
        } else {
          setTodayPoints(0);
        }
        
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('monthly_points')
          .select('points')
          .eq('user_id', userId)
          .eq('month', currentMonth)
          .maybeSingle();
          
        console.log("Monthly points response:", { monthlyData, monthlyError });
          
        if (monthlyData) {
          setMonthlyPoints(Number(monthlyData.points));
        } else {
          setMonthlyPoints(0);
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
      
      const intervalId = setInterval(updatePoints, 10000);
      
      return () => {
        window.removeEventListener('pointsUpdated', handlePointsUpdate);
        clearInterval(intervalId);
      };
    }
  }, [isLoggedIn]);

  const dailyProgress = Math.min(100, (todayPoints / DAILY_TARGET) * 100);
  const monthlyProgress = Math.min(100, (monthlyPoints / MONTHLY_TARGET) * 100);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300",
        scrolled 
          ? "glass shadow-sm backdrop-blur-md" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center space-x-2 animate-fade-in">
            <Award className="w-8 h-8 text-primary" />
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
          {isLoggedIn ? (
            [
              { path: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
              { path: '/quiz', label: 'Play Quiz', icon: <Award className="w-5 h-5" /> },
              { path: '/referral', label: 'Referrals', icon: <UserPlus className="w-5 h-5" /> },
              { path: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
              ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: <Shield className="w-5 h-5" /> }] : []),
            ].map((item, index) => (
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
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))
          ) : (
            [
              { path: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
              { path: '/login', label: 'Login', icon: <LogIn className="w-5 h-5" /> },
              { path: '/register', label: 'Register', icon: <User className="w-5 h-5" /> },
            ].map((item, index) => (
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
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
