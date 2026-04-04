
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

  const isAdminPath = useMemo(() => location.pathname.startsWith('/admin'), [location.pathname]);

  const checkAuth = useCallback(async () => {
    // Only authenticate via Supabase Auth session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const userId = session.user.id;
      
      // Fetch profile and role in parallel
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, suspended')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle()
      ]);
      
      const profile = profileResult.data;
      const isSuspended = profile?.suspended || false;
      const userRole = roleResult.data?.role || 'player';
      const isTeamLeader = userRole === 'team_leader';
      const isAdmin = userRole === 'admin';
      
      // Cache in localStorage for display purposes
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      if (profile?.username) {
        localStorage.setItem(STORAGE_KEYS.USER_NAME, profile.username);
      }
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, userRole);
      
      if (isAdmin) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      }
      
      setAuthState({
        isAuthenticated: true,
        userRole,
        isSuspended,
        userId,
        userName: profile?.username || null,
        isAdminAuth: isAdmin,
        isTeamLeader
      });
      return;
    }
    
    // No valid Supabase session - check if admin panel with legacy admin auth
    if (isAdminPath) {
      const isAdminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      
      if (isAdminAuth) {
        setAuthState({
          isAuthenticated: true,
          userRole: 'admin',
          isSuspended: false,
          userId,
          userName,
          isAdminAuth: true,
          isTeamLeader: false
        });
        return;
      }
    }
    
    // No session at all - not authenticated
    // Clear stale localStorage data
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    
    setAuthState({
      isAuthenticated: false,
      userRole: null,
      isSuspended: false,
      userId: null,
      userName: null,
      isAdminAuth: false,
      isTeamLeader: false
    });
  }, [isAdminPath]);
  
  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkAuth();
      }
    });
    
    const handleRoleUpdate = () => {
      console.log('Role update event received, rechecking auth...');
      localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
      checkAuth();
    };
    
    window.addEventListener('currentUserRoleUpdated', handleRoleUpdate);
    window.addEventListener('userRoleUpdated', handleRoleUpdate);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('currentUserRoleUpdated', handleRoleUpdate);
      window.removeEventListener('userRoleUpdated', handleRoleUpdate);
    };
  }, [checkAuth]);

  return authState;
};
