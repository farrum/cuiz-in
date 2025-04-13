
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  isTeamLeader: boolean;
}

export const useAuthCheck = () => {
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: null,
    userRole: null,
    isSuspended: false,
    userId: null,
    userName: null,
    isAdminAuth: false,
    isTeamLeader: false
  });

  // Extract path pattern for more efficient checks
  const isAdminPath = useMemo(() => location.pathname.startsWith('/admin'), [location.pathname]);

  // Optimize the auth check with useCallback
  const checkAuth = useCallback(async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    const isAdminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
    const storedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    
    // First check if admin auth is present in localStorage
    if (isAdminAuth && isAdminPath) {
      console.log('Admin authenticated via localStorage');
      setAuthState({
        isAuthenticated: true,
        userRole: 'admin',
        isSuspended: false,
        userId,
        userName,
        isAdminAuth,
        isTeamLeader: false
      });
      return;
    }
    
    // Check if we have a userId (custom auth)
    if (userId && userName) {
      console.log('User authenticated via custom auth:', userName);
      
      // Make a single query to get both suspension status and role
      // Use Promise.all to run queries in parallel for better performance
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('suspended')
          .eq('id', userId)
          .maybeSingle(),
          
        // Only fetch role if not already in localStorage
        !storedRole ? 
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle() : 
          Promise.resolve({ data: { role: storedRole }, error: null })
      ]);
      
      const isSuspended = !profileResult.error && profileResult.data ? 
        (profileResult.data.suspended || false) : false;
      
      if (isSuspended) {
        console.log('User account is suspended:', userName);
      }
      
      // Use stored role if available, otherwise use database result
      let userRole = storedRole || 
        (!roleResult.error && roleResult.data ? roleResult.data.role : 'player');
      
      // Log the role for debugging
      console.log('User role:', userRole);
      
      // Check if user is a team leader
      const isTeamLeader = userRole === 'team_leader' || userRole === 'teamleader';
      
      if (isTeamLeader) {
        // Normalize the role name to 'team_leader'
        userRole = 'team_leader';
        console.log('User is a team leader');
      }
      
      // Store the user role in localStorage for easy access
      if (!storedRole) {
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, userRole || 'player');
      }
      
      setAuthState({
        isAuthenticated: true,
        userRole,
        isSuspended,
        userId,
        userName,
        isAdminAuth,
        isTeamLeader
      });
    } else {
      console.log('User not authenticated');
      setAuthState({
        isAuthenticated: false,
        userRole: null,
        isSuspended: false,
        userId: null,
        userName: null,
        isAdminAuth: false,
        isTeamLeader: false
      });
    }
  }, [isAdminPath]);
  
  useEffect(() => {
    checkAuth();
    
    // Add listener for role updates
    const handleRoleUpdate = () => {
      console.log('Role update event received, rechecking auth...');
      // Remove the stored role so we fetch a fresh one
      localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
      checkAuth();
    };
    
    window.addEventListener('currentUserRoleUpdated', handleRoleUpdate);
    window.addEventListener('userRoleUpdated', handleRoleUpdate);
    
    return () => {
      window.removeEventListener('currentUserRoleUpdated', handleRoleUpdate);
      window.removeEventListener('userRoleUpdated', handleRoleUpdate);
    };
  }, [checkAuth]);

  return authState;
};
