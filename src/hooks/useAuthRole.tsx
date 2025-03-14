
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
      console.log('User email:', user.email);
      
      // First check for admin role - explicit check for quizadmin
      if (user.email === 'quizadmin@quizpoints.com') {
        console.log('User is quizadmin, ensuring admin role is set');
        
        // Ensure the admin role is set for quizadmin
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
          
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking admin role:', checkError);
        }
          
        if (!existingRole) {
          console.log('Setting admin role for quizadmin');
          
          // Delete any existing roles first
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', user.id);
            
          // Set admin role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'admin'
            });
            
          if (roleError) {
            console.error('Error setting admin role:', roleError);
          }
        }
        
        setIsAdmin(true);
        setUserRole('admin');
        setIsLoading(false);
        return;
      }
      
      // Standard role check for other users
      const { data: adminData, error: adminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
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
        .maybeSingle();
      
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

  return { isAdmin, userRole, refreshUserRole, setIsAdmin, setUserRole };
};

export default useAuthRole;
