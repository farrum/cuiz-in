
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, User, Award, Gift, LogIn, LogOut, Settings, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS, DAILY_TARGET, MONTHLY_TARGET } from '@/utils/quizData';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.USER_NAME) !== null;
  const isAdmin = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  const location = useLocation();
  const isMobile = useIsMobile();
  const [todayPoints, setTodayPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const closeMenu = () => {
    setIsOpen(false);
  };
  
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    closeMenu();
    window.location.href = '/';
  };
  
  // Get current points data
  useEffect(() => {
    const updatePoints = async () => {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) return;
      
      try {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        
        // Get current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Fetch daily points
        const { data: dailyData } = await supabase
          .from('daily_points')
          .select('points')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();
          
        if (dailyData) {
          setTodayPoints(Number(dailyData.points));
        } else {
          setTodayPoints(0);
        }
        
        // Fetch monthly points
        const { data: monthlyData } = await supabase
          .from('monthly_points')
          .select('points')
          .eq('user_id', userId)
          .eq('month', currentMonth)
          .maybeSingle();
          
        if (monthlyData) {
          setMonthlyPoints(Number(monthlyData.points));
        } else {
          setMonthlyPoints(0);
        }
      } catch (error) {
        console.error('Error fetching points data:', error);
      }
    };
    
    if (isAuthenticated) {
      updatePoints();
      
      // Set up a listener for point updates
      const handlePointsUpdate = () => {
        updatePoints();
      };
      
      window.addEventListener('pointsUpdated', handlePointsUpdate);
      
      // Refresh points every 10 seconds
      const intervalId = setInterval(updatePoints, 10000);
      
      return () => {
        window.removeEventListener('pointsUpdated', handlePointsUpdate);
        clearInterval(intervalId);
      };
    }
  }, [isAuthenticated]);
  
  if (!isMobile) return null;
  
  const dailyProgress = Math.min(100, (todayPoints / DAILY_TARGET) * 100);
  const monthlyProgress = Math.min(100, (monthlyPoints / MONTHLY_TARGET) * 100);
  
  return (
    <div className="md:hidden">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMenu} 
        className="z-50 relative"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>
      
      {/* Slide-in menu */}
      <div 
        className={`fixed inset-0 bg-background z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-16 px-6">
          <div className="space-y-1 flex-1">
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
                  <Award className="mr-3 h-5 w-5" />
                  Quiz
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
                
                {/* Progress bars for mobile */}
                <div className="mt-4 space-y-3 p-3 bg-secondary/30 rounded-lg">
                  <h3 className="flex items-center text-sm font-medium mb-2">
                    <Target className="w-4 h-4 mr-2" />
                    Progress Targets
                  </h3>
                  
                  <div className="space-y-1">
                    <div className="flex text-xs items-center justify-between mb-1">
                      <span>Daily Target:</span>
                      <span>{todayPoints.toFixed(1)}/{DAILY_TARGET}</span>
                    </div>
                    <Progress value={dailyProgress} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex text-xs items-center justify-between mb-1">
                      <span>Monthly Target:</span>
                      <span>{monthlyPoints.toFixed(1)}/{MONTHLY_TARGET}</span>
                    </div>
                    <Progress value={monthlyProgress} className="h-2" />
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
                </Link>
              </>
            )}
          </div>
          
          <div className="py-4 border-t">
            <p className="text-xs text-center text-muted-foreground">© 2023 Quiz Points</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
