
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

  const checkAuth = useCallback(async () => {
    // PHASE 1: Check Supabase Auth first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // User is authenticated via Supabase Auth
      const userId = session.user.id;
      
      // Fetch profile data
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
      
      // Store in localStorage for consistency
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
    
    // PHASE 2: Fall back to legacy custom auth
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    const isAdminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
    const storedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    
    if (isAdminAuth && isAdminPath) {
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
    
    if (userId && userName) {
      // Set user context for legacy auth before ANY queries
      try {
        await supabase.rpc('set_user_context', { user_id: userId });
      } catch (err) {
        console.error('Failed to set user context:', err);
      }
      
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('suspended')
          .eq('id', userId)
          .maybeSingle(),
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
      
      let userRole = storedRole || 
        (!roleResult.error && roleResult.data ? roleResult.data.role : 'player');
      
      const isTeamLeader = userRole === 'team_leader' || userRole === 'teamleader';
      
      if (isTeamLeader) {
        userRole = 'team_leader';
      }
      
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
    
    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkAuth();
      }
    });
    
    // Add listener for role updates
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
