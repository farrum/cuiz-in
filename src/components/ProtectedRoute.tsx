
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { checkAndUpdateLoginStreak } from '@/services/loginStreakService';
import LoginBonusPopup from '@/components/LoginBonusPopup';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { toast } = useToast();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
  const isAdminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  
  // Login bonus state
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [streakDays, setStreakDays] = useState(1);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      // First check if admin auth is present in localStorage
      if (isAdminAuth && location.pathname.startsWith('/admin')) {
        console.log('Admin authenticated via localStorage');
        setIsAuthenticated(true);
        setUserRole('admin');
        return;
      }
      
      // Check if we have a userId (custom auth)
      if (userId && userName) {
        console.log('User authenticated via custom auth:', userName);
        setIsAuthenticated(true);
        
        // Check user role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (!roleError && roleData) {
          setUserRole(roleData.role);
          console.log('User role:', roleData.role);
        } else {
          console.log('No role found for user, assuming player role');
          setUserRole('player');
        }
      } else {
        console.log('User not authenticated');
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [userId, userName, isAdminAuth, location.pathname]);

  // Check access to admin routes
  useEffect(() => {
    if (isAuthenticated && location.pathname.startsWith('/admin')) {
      // Allow access if user has admin auth in localStorage or has admin/team_leader role
      if (!isAdminAuth && userRole !== 'admin' && userRole !== 'team_leader') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin area",
          variant: "destructive"
        });
        
        // Redirect non-admin users trying to access admin routes
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, location.pathname, userRole, toast, isAdminAuth]);

  // Log login activity and check streak
  useEffect(() => {
    const logLoginActivity = async () => {
      if (!userName || !userId) return;
      
      try {
        // Log the login activity in Supabase
        const device = navigator.userAgent;
        
        await supabase
          .from('login_logs')
          .insert({
            username: userName,
            ip_address: "client-side",
            device: device,
            login_time: new Date().toISOString(),
            successful: true
          });
          
        console.log('Login activity logged for user:', userName);
        
        // Check and update login streak
        const bonus = await checkAndUpdateLoginStreak(userId);
        
        // If bonus points were awarded (first login of the day)
        if (bonus !== null && bonus > 0 && !location.pathname.includes('/login')) {
          console.log(`User earned ${bonus} bonus points for logging in today`);
          setBonusPoints(bonus);
          setStreakDays(Math.min(bonus, 30)); // Streak days = bonus points (capped at 30)
          setShowBonusPopup(true);
        }
      } catch (err) {
        console.error('Failed to log login activity:', err);
      }
    };
    
    if (isAuthenticated === true) {
      logLoginActivity();
    }
  }, [userName, userId, isAuthenticated, location.pathname]);

  // Show access denied toast
  useEffect(() => {
    if (isAuthenticated === false && !location.pathname.includes('/login')) {
      toast({
        title: "Access Denied",
        description: "Please log in to access this page",
        variant: "destructive"
      });
    }
  }, [toast, isAuthenticated, location.pathname]);

  // Show loading state
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false && !location.pathname.includes('/login')) {
    // Log the attempted access
    const accessAttempt = {
      date: new Date().toISOString(),
      path: location.pathname,
      type: 'access_denied'
    };
    
    const accessLog = JSON.parse(localStorage.getItem('quiz_app_access_log') || '[]');
    accessLog.push(accessAttempt);
    localStorage.setItem('quiz_app_access_log', JSON.stringify(accessLog));
    
    // Also log the failed login attempt to Supabase
    (async () => {
      try {
        await supabase
          .from('login_logs')
          .insert({
            username: 'anonymous',
            ip_address: 'client-side',
            device: navigator.userAgent,
            login_time: new Date().toISOString(),
            successful: false
          });
      } catch (err) {
        console.error('Failed to log failed access to Supabase:', err);
      }
    })();
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle popup close
  const handleBonusPopupClose = () => {
    setShowBonusPopup(false);
    
    toast({
      title: "Login Bonus!",
      description: `You earned ${bonusPoints} bonus points for your ${streakDays}-day streak!`,
    });
  };

  return (
    <>
      {children}
      
      {/* Login Bonus Popup */}
      <LoginBonusPopup
        isOpen={showBonusPopup}
        onClose={handleBonusPopupClose}
        bonusPoints={bonusPoints}
        streakDays={streakDays}
      />
    </>
  );
};

export default ProtectedRoute;
