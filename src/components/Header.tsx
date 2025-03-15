
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, User, Home, UserPlus, Target, Shield } from 'lucide-react';
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
  
  // Handle scroll event to change header appearance
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

  // Get current points data and check login status
  useEffect(() => {
    const checkAuth = async () => {
      // Check localStorage for backward compatibility
      const userData = localStorage.getItem('quiz_app_user_name');
      setIsLoggedIn(!!userData);
      setIsAdmin(userData === 'admin' || userData === 'quizadmin');
      
      // Also check Supabase session
      try {
        const { data } = await supabase.auth.getSession();
        if (data && data.session) {
          setIsLoggedIn(true);
          
          // Check if user has admin role
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.session.user.id);
            
          if (userRoles && userRoles.some(role => role.role === 'admin')) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Failed to check Supabase session:', err);
      }
    };
    
    checkAuth();
  }, []);

  // Get current points data
  useEffect(() => {
    const updatePoints = async () => {
      if (isLoggedIn) {
        const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (userId) {
          // Get today's date
          const today = new Date().toISOString().split('T')[0];
          
          // Get current month
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
          
          console.log("Fetching points for:", today, currentMonth);
          
          // Fetch daily points
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
          
          // Fetch monthly points
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
        }
      } else {
        // Reset points if not logged in
        setTodayPoints(0);
        setMonthlyPoints(0);
      }
    };
    
    if (isLoggedIn) {
      updatePoints();
      
      // Set up a listener for point updates
      const handlePointsUpdate = () => {
        console.log("Points updated event received in Header");
        updatePoints();
      };
      
      window.addEventListener('pointsUpdated', handlePointsUpdate);
      
      // Refresh points every minute
      const intervalId = setInterval(updatePoints, 60000);
      
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
            <span className="text-xl font-semibold">QuizPoints</span>
          </Link>
          
          {/* Progress bars for daily and monthly targets with clearer labels - only show when logged in */}
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
          {[
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
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
