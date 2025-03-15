
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { supabase, ensureUserExists, syncUserPoints, syncPointsData } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { toast } = useToast();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isDataSynced, setIsDataSynced] = useState(false);
  const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);

  // Check Supabase session
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking auth session:', error);
        setIsAuthenticated(false);
        return;
      }
      
      if (data.session) {
        setIsAuthenticated(true);
      } else if (userName) {
        // If no Supabase session but we have a userName in localStorage,
        // we'll still consider the user authenticated for backward compatibility
        setIsAuthenticated(true);
        
        // Since we're using localStorage auth, make sure we have a profile in Supabase
        try {
          await ensureUserExists(userName);
        } catch (err) {
          console.error('Error ensuring user exists:', err);
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    
    checkSession();
  }, [userName]);

  // Sync login data with Supabase
  useEffect(() => {
    const syncLoginData = async () => {
      if (!userName || isDataSynced) return;
      
      try {
        // Log the login attempt in Supabase
        const ipAddress = '127.0.0.1'; // In a real app, you would get the actual IP
        const device = navigator.userAgent;
        
        const { error } = await supabase
          .from('login_logs')
          .insert({
            username: userName,
            ip_address: ipAddress,
            device: device,
            login_time: new Date().toISOString(),
            successful: true // Mark as successful login
          });
          
        if (error) {
          console.error('Error logging login data:', error);
        }
        
        // Sync user points
        const userPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
        await syncUserPoints(userName, userPoints);
        
        // Sync daily and monthly points
        await syncPointsData(userName);
        
        setIsDataSynced(true);
        console.log('Data synced with Supabase');
      } catch (err) {
        console.error('Failed to sync data with Supabase:', err);
      }
    };
    
    syncLoginData();
  }, [userName, isDataSynced]);

  useEffect(() => {
    if (isAuthenticated === false) {
      toast({
        title: "Access Denied",
        description: "Please log in to access this page",
        variant: "destructive"
      });
    }
  }, [toast, isAuthenticated]);

  // Listen for points updates and sync them
  useEffect(() => {
    const handlePointsUpdate = async () => {
      if (!userName) return;
      
      const userPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
      await syncUserPoints(userName, userPoints);
    };
    
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
    };
  }, [userName]);

  // Show loading state
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated === false) {
    // Log the attempted access
    const accessAttempt = {
      date: new Date().toISOString(),
      path: location.pathname,
      type: 'access_denied',
      ip: '127.0.0.1' // In a real app, this would be the actual IP
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
            ip_address: '127.0.0.1',
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

  return <>{children}</>;
};

export default ProtectedRoute;
