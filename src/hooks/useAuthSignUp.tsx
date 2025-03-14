
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
            username: userData.fullName || userData.username || email.split('@')[0],
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

      // Trigger handle_new_user() will automatically create profile and set player role
      console.log('User registered successfully:', response?.data?.user?.id || 'No ID found');
      
      return response;
    } catch (error) {
      console.error('Exception during signup:', error);
      return { error: error as Error, data: null };
    }
  };

  return signUp;
};

export default useAuthSignUp;
