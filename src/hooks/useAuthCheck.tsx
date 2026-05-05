
import { useState, useEffect, useCallback } from 'react';
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

const getHighestRole = (roles?: { role: string | null }[] | null): string => {
  const roleSet = new Set((roles || []).map((item) => item.role).filter(Boolean));
  if (roleSet.has('admin')) return 'admin';
  if (roleSet.has('team_leader') || roleSet.has('teamleader')) return 'team_leader';
  return 'player';
};

export const useAuthCheck = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: null,
    userRole: null,
    isSuspended: false,
    userId: null,
    userName: null,
    isAdminAuth: false,
    isTeamLeader: false
  });

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userId = session.user.id;
        
        // Fetch profile and role in parallel using maybeSingle
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
        ]);
        
        const profile = profileResult.data;
        const isSuspended = profile?.suspended || false;
        const userRole = getHighestRole(roleResult.data);
        const isTeamLeader = userRole === 'team_leader';
        const isAdmin = userRole === 'admin';
        
        // Cache in localStorage for display purposes
        localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
        if (profile?.username) {
          localStorage.setItem(STORAGE_KEYS.USER_NAME, profile.username);
        }
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, userRole);
        
        // Note: admin status is derived from user_roles + Supabase session.
        // We no longer rely on a localStorage admin flag.
        
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
      
      // Not authenticated — clear stale localStorage data
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem(STORAGE_KEYS.USER_NAME);
      localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      localStorage.removeItem('quiz_app_admin_auth_time');
      
      setAuthState({
        isAuthenticated: false,
        userRole: null,
        isSuspended: false,
        userId: null,
        userName: null,
        isAdminAuth: false,
        isTeamLeader: false
      });
    } catch (err) {
      console.error('Auth check error:', err);
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
  }, []);
  
  useEffect(() => {
    checkAuth();
    
    // CRITICAL: Do NOT await anything inside onAuthStateChange callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('useAuthCheck: Auth state changed:', event);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Defer to avoid deadlocking setSession/getSession
        setTimeout(() => {
          checkAuth();
        }, 0);
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
