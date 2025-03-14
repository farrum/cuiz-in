
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
      console.log('Checking role for user ID:', user.id);
      
      // First check for admin role
      const { data: adminData, error: adminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (adminError) {
        console.log('Admin role check error:', adminError);
        if (adminError.code !== 'PGRST116') { // Not found error
          console.error('Error checking admin role:', adminError);
        }
      }
        
      if (adminData) {
        console.log('User has admin role');
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
      
      if (leaderError) {
        console.log('Team leader role check error:', leaderError);
        if (leaderError.code !== 'PGRST116') { // Not found error
          console.error('Error checking team_leader role:', leaderError);
        }
      }
        
      if (leaderData) {
        console.log('User has team_leader role');
        setIsAdmin(false);
        setUserRole('team_leader');
        setIsLoading(false);
        return;
      }
      
      // Default to player role
      console.log('User defaulting to player role');
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
    
    try {
      // Check if identifier is an email
      if (identifier.includes('@')) {
        console.log('Signing in with email:', identifier);
        response = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
      } else {
        console.log('Signing in with username:', identifier);
        // If not an email, find the user by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', identifier)
          .single();
          
        if (profileError || !profileData) {
          console.error('Profile lookup error:', profileError);
          return { error: new Error('Invalid username or password'), data: null };
        }
        
        // Next, find user with this profile ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', profileData.id)
          .single();
          
        if (userError || !userData) {
          // If we can't find it in the users table, try auth.users through the RPCADDRESS
          // Typically need to look up email directly from profile data
          console.log('User email lookup failed, using profile ID to login');
          
          // Try to sign in with the profile ID directly
          const { data: authUser, error: authError } = await supabase.auth.signInWithPassword({
            email: identifier, // Using identifier as fallback
            password,
          });
          
          if (authError) {
            console.error('Auth error:', authError);
            return { error: new Error('Invalid username or password'), data: null };
          }
          
          response = { data: authUser, error: null };
        } else {
          // Sign in with the email
          console.log('Found email, signing in with:', userData.email);
          response = await supabase.auth.signInWithPassword({
            email: userData.email,
            password,
          });
        }
      }
      
      // Log login attempt
      if (response?.data?.user) {
        try {
          console.log('Logging successful login for user:', response.data.user.id);
          const { error: logError } = await supabase.from('login_logs').insert({
            username: identifier,
            login_time: new Date().toISOString(),
            device: navigator.userAgent,
            ip_address: '127.0.0.1', // This would be set by the server in a real app
            user_id: response.data.user.id
          });
          
          if (logError) {
            console.error('Failed to log login attempt:', logError);
          }
        } catch (logError) {
          console.error('Exception while logging login attempt:', logError);
        }
      } else {
        console.log('No user data available for login logging');
      }
      
      return response || { error: new Error('Unknown error during login'), data: null };
    } catch (error) {
      console.error('Exception during sign in:', error);
      return { error: error as Error, data: null };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('Starting user signup process for:', email);
      
      // Create the user with Supabase Auth
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName,
            phone: userData.phone,
            upi_id: userData.upiId,
          }
        }
      });

      if (response.error) {
        console.error('Auth signup error:', response.error);
        return response;
      }

      if (response.data?.user) {
        console.log('User created with ID:', response.data.user.id);
        
        // Update profile data in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            username: userData.fullName || userData.username || email.split('@')[0],
            updated_at: new Date().toISOString(),
            points: 10 // Start with 10 points
          })
          .eq('id', response.data.user.id);
          
        if (profileError) {
          console.error('Error updating profile:', profileError);
        } else {
          console.log('Profile updated successfully');
        }
          
        // Set new users as 'player' role by default
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: response.data.user.id,
            role: 'player'
          });
          
        if (roleError) {
          console.error('Error setting user role:', roleError);
        } else {
          console.log('User role set to player');
          
          // Initialize daily and monthly points
          const today = new Date().toISOString().split('T')[0];
          const yearMonth = today.substring(0, 7).replace('-', '_');
          
          // Create initial daily points entry
          const { error: dailyPointsError } = await supabase
            .from('daily_points')
            .insert({
              user_id: response.data.user.id,
              date: today,
              points: 0
            });
            
          if (dailyPointsError) {
            console.error('Error creating daily points entry:', dailyPointsError);
          } else {
            console.log('Daily points entry created');
          }
          
          // Create initial monthly points entry
          const { error: monthlyPointsError } = await supabase
            .from('monthly_points')
            .insert({
              user_id: response.data.user.id,
              year_month: yearMonth,
              points: 0
            });
            
          if (monthlyPointsError) {
            console.error('Error creating monthly points entry:', monthlyPointsError);
          } else {
            console.log('Monthly points entry created');
          }
        }
        
        console.log('User registered successfully:', response.data.user.id);
      } else {
        console.log('No user data in response');
      }

      return response;
    } catch (error) {
      console.error('Exception during signup:', error);
      return { error: error as Error, data: null };
    }
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
