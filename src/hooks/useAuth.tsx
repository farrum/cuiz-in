
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'team_leader' | 'player';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
  signUp: (email: string, password: string, userData: any) => Promise<{
    error: Error | null;
    data: any;
  }>;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('player');

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

  const refreshUserRole = async () => {
    if (!user) {
      setIsAdmin(false);
      setUserRole('player');
      setIsLoading(false);
      return;
    }

    try {
      // First check for admin role
      const { data: adminData, error: adminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
        
      if (adminData) {
        setIsAdmin(true);
        setUserRole('admin');
        setIsLoading(false);
        return;
      }
      
      // Then check for team_leader role
      const { data: leaderData, error: leaderError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'team_leader')
        .single();
        
      if (leaderData) {
        setIsAdmin(false);
        setUserRole('team_leader');
        setIsLoading(false);
        return;
      }
      
      // Default to player role
      setIsAdmin(false);
      setUserRole('player');
      setIsLoading(false);
      
    } catch (error) {
      console.error('Failed to check user role:', error);
      setIsAdmin(false);
      setUserRole('player');
      setIsLoading(false);
    }
  };

  const signIn = async (identifier: string, password: string) => {
    let response;
    
    // Check if identifier is an email
    if (identifier.includes('@')) {
      response = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
    } else {
      // If not an email, find the user by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', identifier)
        .single();
        
      if (profileError || !profileData) {
        return { error: new Error('Invalid username or password'), data: null };
      }
      
      // Look up the email for this user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', profileData.id)
        .single();
        
      if (userError || !userData) {
        return { error: new Error('User email not found'), data: null };
      }
      
      // Sign in with the email
      response = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });
    }
    
    // Log login attempt
    try {
      await supabase.from('login_logs').insert({
        username: identifier,
        login_time: new Date().toISOString(),
        device: navigator.userAgent,
        ip_address: '127.0.0.1', // This would be set by the server in a real app
        user_id: response.data.user?.id
      });
    } catch (logError) {
      console.error('Failed to log login attempt:', logError);
    }
    
    return response;
  };

  const signUp = async (email: string, password: string, userData: any) => {
    // Supabase doesn't currently allow us to pass custom user metadata during signup
    // So we'll sign up the user first and update their profile separately
    const response = await supabase.auth.signUp({
      email,
      password,
    });

    if (response.data.user && !response.error) {
      // Update profile data in the profiles table
      await supabase
        .from('profiles')
        .update({
          username: userData.fullName || userData.username || email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', response.data.user.id);
        
      // Set new users as 'player' role by default
      await supabase
        .from('user_roles')
        .insert({
          user_id: response.data.user.id,
          role: 'player'
        });
    }

    return response;
  };

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
