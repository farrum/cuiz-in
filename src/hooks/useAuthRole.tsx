
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from './AuthContext';

export const useAuthRole = (
  user: User | null,
  setIsLoading: (loading: boolean) => void
) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('player');

  const refreshUserRole = async () => {
    if (!user) {
      setIsAdmin(false);
      setUserRole('player');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Checking role for user ID:', user.id);
      
      // Check for admin role
      const { data: adminRole, error: adminError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (adminError && adminError.code !== 'PGRST116') { // Not found error
        console.error('Error checking admin role:', adminError);
      }
        
      if (adminRole) {
        console.log('User has admin role');
        setIsAdmin(true);
        setUserRole('admin');
        setIsLoading(false);
        return;
      }
      
      // Check for team_leader role
      const { data: leaderRole, error: leaderError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'team_leader')
        .maybeSingle();
      
      if (leaderError && leaderError.code !== 'PGRST116') { // Not found error
        console.error('Error checking team_leader role:', leaderError);
      }
        
      if (leaderRole) {
        console.log('User has team_leader role');
        setIsAdmin(false);
        setUserRole('team_leader');
        setIsLoading(false);
        return;
      }
      
      // Default to player role
      console.log('User has player role');
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

  return { isAdmin, userRole, refreshUserRole, setIsAdmin, setUserRole };
};

export default useAuthRole;
