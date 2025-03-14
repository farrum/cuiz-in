import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const useLoginRedirect = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      // If user is admin, redirect to admin page
      if (userRole === 'admin') {
        navigate('/admin');
      } 
      // If user is team leader, redirect to team leader dashboard
      else if (userRole === 'team_leader') {
        navigate('/team-leader');
      } 
      // Otherwise redirect to home
      else {
        navigate('/');
      }
    }
  }, [user, userRole, navigate, isLoading]);

  return { isInitializing, setIsInitializing };
};

export default useLoginRedirect;
