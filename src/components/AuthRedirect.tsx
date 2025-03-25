
import { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthRedirectProps {
  isAuthenticated: boolean | null;
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ isAuthenticated }) => {
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated === false && !location.pathname.includes('/login')) {
      toast({
        title: "Access Denied",
        description: "Please log in to access this page",
        variant: "destructive"
      });
    }
  }, [toast, isAuthenticated, location.pathname]);

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

  return null;
};

export default AuthRedirect;
