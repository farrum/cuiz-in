
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { toast } = useToast();
  const location = useLocation();
  const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);

  useEffect(() => {
    if (!userName) {
      toast({
        title: "Access Denied",
        description: "Please log in to access this page",
        variant: "destructive"
      });
    }
  }, [toast, userName]);

  if (!userName) {
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
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
