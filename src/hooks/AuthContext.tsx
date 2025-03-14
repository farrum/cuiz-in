
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useAuthSignIn } from './useAuthSignIn';
import { useAuthSignUp } from './useAuthSignUp';
import { useAuthRole } from './useAuthRole';

export type UserRole = 'admin' | 'team_leader' | 'player';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: ReturnType<typeof useAuthSignIn>;
  signUp: ReturnType<typeof useAuthSignUp>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  userRole: UserRole;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    isAdmin, 
    userRole, 
    refreshUserRole,
    setIsAdmin,
    setUserRole,
  } = useAuthRole(user, setIsLoading);
  
  const signIn = useAuthSignIn();
  const signUp = useAuthSignUp(refreshUserRole);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshUserRole();
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshUserRole();
      } else {
        setIsAdmin(false);
        setUserRole('player');
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    userRole,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
