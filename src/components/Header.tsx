
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, User, Home, UserPlus, Target, Shield, LogIn } from 'lucide-react';
import { cn } from "@/utils/animations";
import { DAILY_TARGET, MONTHLY_TARGET } from '@/utils/quizData';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Header: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [todayPoints, setTodayPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const { user, isAdmin } = useAuth();
  
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

  // Get current points data from database
  useEffect(() => {
    const fetchPointsData = async () => {
      if (!user) {
        setTodayPoints(0);
        setMonthlyPoints(0);
        return;
      }
      
      try {
        // Get today's date in ISO format (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        
        // Get current month in YYYY-MM format
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        // Fetch daily points
        const { data: dailyData } = await supabase
          .from('daily_points')
          .select('points')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();
          
        setTodayPoints(dailyData?.points || 0);
        
        // Fetch monthly points
        const { data: monthlyData } = await supabase
          .from('monthly_points')
          .select('points')
          .eq('user_id', user.id)
          .eq('year_month', currentMonth)
          .single();
          
        setMonthlyPoints(monthlyData?.points || 0);
      } catch (error) {
        console.error('Error fetching points data:', error);
      }
    };

    fetchPointsData();
    
    // Also set up a listener for points updates
    const pointsChannel = supabase
      .channel('points_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'daily_points',
        filter: `user_id=eq.${user?.id}`,
      }, () => {
        fetchPointsData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'monthly_points',
        filter: `user_id=eq.${user?.id}`,
      }, () => {
        fetchPointsData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(pointsChannel);
    };
  }, [user]);

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
          
          {/* Progress bars for daily and monthly targets - only shown when logged in */}
          {user && (
            <div className="hidden md:flex flex-col gap-1 w-44">
              <div className="flex text-xs items-center gap-1">
                <Target className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs whitespace-nowrap">Daily:</span>
                <div className="flex-1">
                  <Progress value={dailyProgress} className="h-1.5" />
                </div>
                <span className="text-xs text-muted-foreground">{todayPoints}/{DAILY_TARGET}</span>
              </div>
              <div className="flex text-xs items-center gap-1">
                <Target className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs whitespace-nowrap">Monthly:</span>
                <div className="flex-1">
                  <Progress value={monthlyProgress} className="h-1.5" />
                </div>
                <span className="text-xs text-muted-foreground">{monthlyPoints}/{MONTHLY_TARGET}</span>
              </div>
            </div>
          )}
        </div>
        
        <nav className="flex items-center space-x-1">
          {/* Public routes */}
          <Link
            to="/"
            className={cn(
              "relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300",
              location.pathname === "/"
                ? "text-primary-foreground bg-primary shadow-md"
                : "text-foreground hover:bg-secondary",
              "animate-slide-up"
            )}
            style={{ animationDelay: "0ms" }}
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          
          {/* Routes for authenticated users */}
          {user ? (
            <>
              <Link
                to="/quiz"
                className={cn(
                  "relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300",
                  location.pathname === "/quiz"
                    ? "text-primary-foreground bg-primary shadow-md"
                    : "text-foreground hover:bg-secondary",
                  "animate-slide-up"
                )}
                style={{ animationDelay: "50ms" }}
              >
                <Award className="w-5 h-5" />
                <span className="hidden sm:inline">Play Quiz</span>
              </Link>
              
              <Link
                to="/referral"
                className={cn(
                  "relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300",
                  location.pathname === "/referral"
                    ? "text-primary-foreground bg-primary shadow-md"
                    : "text-foreground hover:bg-secondary",
                  "animate-slide-up"
                )}
                style={{ animationDelay: "100ms" }}
              >
                <UserPlus className="w-5 h-5" />
                <span className="hidden sm:inline">Referrals</span>
              </Link>
              
              <Link
                to="/profile"
                className={cn(
                  "relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300",
                  location.pathname === "/profile"
                    ? "text-primary-foreground bg-primary shadow-md"
                    : "text-foreground hover:bg-secondary",
                  "animate-slide-up"
                )}
                style={{ animationDelay: "150ms" }}
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              
              {/* Admin route */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    "relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300",
                    location.pathname === "/admin"
                      ? "text-primary-foreground bg-primary shadow-md"
                      : "text-foreground hover:bg-secondary",
                    "animate-slide-up"
                  )}
                  style={{ animationDelay: "200ms" }}
                >
                  <Shield className="w-5 h-5" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
            </>
          ) : (
            // Login button for unauthenticated users
            <Link
              to="/login"
              className={cn(
                "relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300",
                location.pathname === "/login"
                  ? "text-primary-foreground bg-primary shadow-md"
                  : "text-foreground hover:bg-secondary",
                "animate-slide-up"
              )}
              style={{ animationDelay: "50ms" }}
            >
              <LogIn className="w-5 h-5" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
