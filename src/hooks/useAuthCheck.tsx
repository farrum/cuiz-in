
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  isAuthenticated: boolean | null;
  userRole: string | null;
  isSuspended: boolean;
  userId: string | null;
  userName: string | null;
  isAdminAuth: boolean;
}

export const useAuthCheck = () => {
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: null,
    userRole: null,
    isSuspended: false,
    userId: null,
    userName: null,
    isAdminAuth: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      const isAdminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
      
      // First check if admin auth is present in localStorage
      if (isAdminAuth && location.pathname.startsWith('/admin')) {
        console.log('Admin authenticated via localStorage');
        setAuthState({
          isAuthenticated: true,
          userRole: 'admin',
          isSuspended: false,
          userId,
          userName,
          isAdminAuth
        });
        return;
      }
      
      // Check if we have a userId (custom auth)
      if (userId && userName) {
        console.log('User authenticated via custom auth:', userName);
        
        // Check if user is suspended
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('suspended')
          .eq('id', userId)
          .maybeSingle();
          
        const isSuspended = !profileError && profileData ? (profileData.suspended || false) : false;
        
        if (isSuspended) {
          console.log('User account is suspended:', userName);
        }
        
        // Check user role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
          
        const userRole = !roleError && roleData ? roleData.role : 'player';
        console.log('User role:', userRole || 'player');
        
        // Store the user role in localStorage for easy access
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, userRole || 'player');
        
        setAuthState({
          isAuthenticated: true,
          userRole,
          isSuspended,
          userId,
          userName,
          isAdminAuth
        });
      } else {
        console.log('User not authenticated');
        setAuthState({
          isAuthenticated: false,
          userRole: null,
          isSuspended: false,
          userId: null,
          userName: null,
          isAdminAuth: false
        });
      }
    };
    
    checkAuth();
  }, [location.pathname]);

  return authState;
};
