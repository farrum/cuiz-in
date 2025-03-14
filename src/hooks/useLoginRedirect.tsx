import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const useLoginRedirect = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // If user is admin, redirect to admin page
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        // Otherwise redirect to home
        navigate('/');
      }
    }
  }, [user, userRole, navigate]);

  return { isInitializing, setIsInitializing };
};

export default useLoginRedirect;
