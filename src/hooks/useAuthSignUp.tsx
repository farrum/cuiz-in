
import { supabase } from '@/integrations/supabase/client';

export const useAuthSignUp = (refreshUserRole: () => Promise<void>) => {
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

  return signUp;
};

export default useAuthSignUp;
