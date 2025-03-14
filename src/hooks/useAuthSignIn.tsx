
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthSignIn = () => {
  const { toast } = useToast();

  const signIn = async (identifier: string, password: string) => {
    try {
      console.log('Signing in with identifier:', identifier);
      
      // Direct authentication attempt with the provided email/identifier
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
      
      if (error) {
        console.error('Auth error:', error);
        
        // Display a user-friendly error message
        toast({
          title: "Authentication Failed",
          description: error.message || "Invalid username or password",
          variant: "destructive"
        });
        
        return { error, data: null };
      }
      
      // Log login attempt
      if (data?.user) {
        try {
          console.log('Logging successful login for user:', data.user.id);
          const { error: logError } = await supabase.from('login_logs').insert({
            username: identifier,
            login_time: new Date().toISOString(),
            device: navigator.userAgent,
            ip_address: '127.0.0.1', // This would be set by the server in a real app
            user_id: data.user.id
          });
          
          if (logError) {
            console.error('Failed to log login attempt:', logError);
          }
        } catch (logError) {
          console.error('Exception while logging login attempt:', logError);
        }
        
        // Show success message
        toast({
          title: "Login Successful",
          description: "You have successfully logged in",
        });
      } else {
        console.log('No user data available for login logging');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception during sign in:', error);
      
      toast({
        title: "Authentication Failed",
        description: "An unexpected error occurred during login",
        variant: "destructive"
      });
      
      return { error: error as Error, data: null };
    }
  };

  return signIn;
};

export default useAuthSignIn;
