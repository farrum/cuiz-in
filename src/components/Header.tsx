
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, User, Home, UserPlus, Target, Shield } from 'lucide-react';
import { cn } from "@/utils/animations";
import { DAILY_TARGET, MONTHLY_TARGET, getPointsForToday, getPointsForMonth } from '@/utils/quizData';
import { Progress } from '@/components/ui/progress';

const Header: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [todayPoints, setTodayPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  
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

  // Get current points data
  useEffect(() => {
    const updatePoints = () => {
      setTodayPoints(getPointsForToday());
      setMonthlyPoints(getPointsForMonth());
    };

    updatePoints();
    window.addEventListener('pointsUpdated', updatePoints);
    
    // Check if user is admin
    const userData = localStorage.getItem('quiz_app_user_name');
    setIsAdmin(userData === 'admin');
    
    return () => window.removeEventListener('pointsUpdated', updatePoints);
  }, []);

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
          
          {/* Smaller progress bars for daily and monthly targets */}
          <div className="hidden md:flex flex-col gap-1 w-40">
            <div className="flex text-xs items-center gap-1">
              <Target className="w-3 h-3 text-muted-foreground" />
              <div className="flex-1">
                <Progress value={dailyProgress} className="h-1.5" />
              </div>
              <span className="text-xs text-muted-foreground">{todayPoints}/{DAILY_TARGET}</span>
            </div>
            <div className="flex text-xs items-center gap-1">
              <Target className="w-3 h-3 text-muted-foreground" />
              <div className="flex-1">
                <Progress value={monthlyProgress} className="h-1.5" />
              </div>
              <span className="text-xs text-muted-foreground">{monthlyPoints}/{MONTHLY_TARGET}</span>
            </div>
          </div>
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
