
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkAndUpdateLoginStreak } from '@/services/loginStreakService';

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

  useEffect(() => {
    const logLoginActivity = async () => {
      if (!userName || !userId || loginBonusState.bonusChecked) return;
      
      try {
        // Log the login activity in Supabase
        const device = navigator.userAgent;
        
        await supabase
          .from('login_logs')
          .insert({
            username: userName,
            ip_address: "client-side",
            device: device,
            login_time: new Date().toISOString(),
            successful: true
          });
          
        console.log('Login activity logged for user:', userName);
        
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
  }, [userName, userId, isAuthenticated, loginBonusState.bonusChecked]);

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
