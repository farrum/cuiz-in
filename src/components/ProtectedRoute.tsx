
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'team_leader' | 'player')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { toast } = useToast();
  const location = useLocation();
  const { user, isLoading, isAdmin, userRole } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Access Denied",
        description: "Please log in to access this page",
        variant: "destructive"
      });
    } else if (!isLoading && user && allowedRoles && !allowedRoles.includes(userRole)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive"
      });
    }
  }, [toast, user, isLoading, allowedRoles, userRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Log the attempted access
    const logAccess = async () => {
      try {
        await supabase.from('login_logs').insert({
          username: 'anonymous',
          login_time: new Date().toISOString(),
          device: navigator.userAgent,
          ip_address: '127.0.0.1',
          user_id: null
        });
      } catch (error) {
        console.error('Failed to log access attempt:', error);
      }
    };
    
    logAccess();
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified and user doesn't have the required role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
