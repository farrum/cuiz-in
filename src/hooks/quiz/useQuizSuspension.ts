
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from '@/utils/quizData';

export const useQuizSuspension = () => {
  const [isSuspended, setIsSuspended] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const checkSuspensionStatus = async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      navigate('/login');
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('suspended')
        .eq('id', userId)
        .maybeSingle();
        
      // If no profile data or error, assume NOT suspended (allow quiz to continue)
      if (error) {
        console.error('Error checking suspension status:', error);
        setIsSuspended(false);
        return true; // Allow quiz to continue
      }
      
      if (!data) {
        console.log('No profile data found, assuming not suspended');
        setIsSuspended(false);
        return true; // Allow quiz to continue
      }
      
      if (data.suspended) {
        setIsSuspended(true);
        navigate('/profile', { replace: true });
        toast({
          title: "Account Suspended",
          description: "Your account is currently suspended. Please request reactivation from your profile page.",
          variant: "destructive"
        });
        return false;
      }
      
      setIsSuspended(false);
      return true;
    } catch (error) {
      console.error('Failed to check suspension status:', error);
      setIsSuspended(false);
      return true; // Allow quiz to continue on error
    }
  };
  
  return {
    isSuspended,
    checkSuspensionStatus
  };
};
