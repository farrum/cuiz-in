
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useAuthSignIn } from './useAuthSignIn';
import { useAuthSignUp } from './useAuthSignUp';
import { useAuthRole } from './useAuthRole';
import { useToast } from './use-toast';
import { UserRole } from '@/types/supabase';

export type UserRoleType = 'admin' | 'team_leader' | 'player';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: ReturnType<typeof useAuthSignIn>;
  signUp: ReturnType<typeof useAuthSignUp>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  userRole: UserRoleType;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
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
    console.log('Setting up auth state listener');
    
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }
        
        console.log('Initial session check:', session ? 'Session exists' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          refreshUserRole();
        } else {
          setIsAdmin(false);
          setUserRole('player');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        if (event === 'SIGNED_IN') {
          toast({
            title: "Signed In",
            description: "Welcome back!",
          });
        }
        refreshUserRole();
      } else {
        if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed Out",
            description: "You have been signed out",
          });
        }
        setIsAdmin(false);
        setUserRole('player');
        setIsLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: "Error",
          description: "Failed to sign out properly",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Exception during sign out:', error);
    }
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
