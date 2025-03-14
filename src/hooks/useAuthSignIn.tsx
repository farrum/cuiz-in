
import { supabase } from '@/integrations/supabase/client';

export const useAuthSignIn = () => {
  const signIn = async (identifier: string, password: string) => {
    try {
      console.log('Signing in with identifier:', identifier);
      
      // Direct authentication attempt with the provided email/identifier
      const response = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
      
      if (response.error) {
        console.error('Auth error:', response.error);
        return { error: response.error, data: null };
      }
      
      // Log login attempt
      if (response.data?.user) {
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
      
      return response;
    } catch (error) {
      console.error('Exception during sign in:', error);
      return { error: error as Error, data: null };
    }
  };

  return signIn;
};

export default useAuthSignIn;
