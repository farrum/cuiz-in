
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AdminRouteGuardProps {
  isAuthenticated: boolean | null;
  userRole: string | null;
  isAdminAuth: boolean;
}

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ 
  isAuthenticated, 
  userRole, 
  isAdminAuth 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Guard for admin routes
    if (isAuthenticated && location.pathname.startsWith('/admin')) {
      // Allow access if user has admin auth in localStorage or has admin/team_leader role
      if (!isAdminAuth && userRole !== 'admin' && userRole !== 'team_leader') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin area",
          variant: "destructive"
        });
        
        // Redirect non-admin users trying to access admin routes
        navigate('/');
      }
    }
    
    // Guard for team leader dashboard
    if (isAuthenticated && location.pathname.startsWith('/team-dashboard')) {
      // Only allow access if user has team_leader role
      if (userRole !== 'team_leader' && userRole !== 'admin') {
        toast({
          title: "Access Denied",
          description: "Only team leaders can access the team dashboard",
          variant: "destructive"
        });
        
        // Redirect non-team-leaders trying to access team dashboard
        navigate('/');
      }
    }
  }, [isAuthenticated, location.pathname, userRole, toast, isAdminAuth, navigate]);

  return null;
};

export default AdminRouteGuard;
