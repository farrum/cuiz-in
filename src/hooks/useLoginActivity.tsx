
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkAndUpdateLoginStreak } from '@/services/loginStreakService';
import { useToast } from '@/hooks/use-toast';

interface LoginBonusState {
  showBonusPopup: boolean;
  bonusPoints: number;
  streakDays: number;
  bonusChecked: boolean;
}

export const useLoginActivity = (
  userId: string | null, 
  userName: string | null, 
  isAuthenticated: boolean | null
) => {
  const [loginBonusState, setLoginBonusState] = useState<LoginBonusState>({
    showBonusPopup: false,
    bonusPoints: 0,
    streakDays: 1,
    bonusChecked: false
  });
  const { toast } = useToast();

  useEffect(() => {
    const logLoginActivity = async () => {
      if (!userName || !userId || loginBonusState.bonusChecked) return;
      
      try {
        // Log the login activity to trigger attendance tracking
        const device = navigator.userAgent;
        const loginTime = new Date().toISOString();
        
        const { error: loginLogError } = await supabase
          .from('login_logs')
          .insert({
            username: userName,
            ip_address: "client-side",
            device: device,
            login_time: loginTime,
            successful: true
          });
          
        if (loginLogError) {
          console.error('Error logging login activity:', loginLogError);
          toast({
            variant: "destructive",
            title: "Login tracking failed",
            description: "Your login was recorded but attendance tracking failed"
          });
        } else {
          console.log('Login activity logged for user:', userName);
        }
        
        // Check and update login streak - only do this once per session
        const bonus = await checkAndUpdateLoginStreak(userId);
        
        // If bonus points were awarded (first login of the day)
        if (bonus !== null && bonus > 0) {
          console.log(`User earned ${bonus} bonus points for logging in today`);
          setLoginBonusState({
            bonusChecked: true,
            bonusPoints: bonus,
            streakDays: Math.min(bonus, 30), // Streak days = bonus points (capped at 30)
            showBonusPopup: true
          });
          
          // Inform user about the bonus streak
          if (bonus > 1) {
            toast({
              title: `${bonus} Day Streak! 🔥`,
              description: `You've logged in ${bonus} days in a row. Keep it up!`,
            });
          }
        } else {
          setLoginBonusState(prev => ({
            ...prev,
            bonusChecked: true
          }));
        }
      } catch (err) {
        console.error('Failed to log login activity:', err);
        setLoginBonusState(prev => ({
          ...prev,
          bonusChecked: true
        }));
      }
    };
    
    if (isAuthenticated === true) {
      logLoginActivity();
    }
  }, [userName, userId, isAuthenticated, loginBonusState.bonusChecked, toast]);

  const closeBonusPopup = () => {
    setLoginBonusState(prev => ({
      ...prev,
      showBonusPopup: false
    }));
  };

  return {
    ...loginBonusState,
    closeBonusPopup
  };
};
