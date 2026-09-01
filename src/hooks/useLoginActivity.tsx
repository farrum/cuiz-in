
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkAndUpdateLoginStreak } from '@/services/loginStreakService';
import { recordAttendance } from '@/services/attendanceService';
import { useToast } from '@/hooks/use-toast';

interface LoginBonusState {
  showBonusPopup: boolean;
  bonusGems: number;
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
    bonusGems: 0,
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
        const userHandle = localStorage.getItem('cuizin_username') || userName;
        
        const { error: loginLogError } = await supabase
          .from('login_logs')
          .insert({
            username: userHandle,
            ip_address: "client-side",
            device: device,
            login_time: loginTime,
            successful: true
          });
          
        if (loginLogError) {
          console.warn('Login activity log notice:', loginLogError.message);
        } else {
          console.log('Login activity logged for user:', userHandle);
        }
        
        // Mark attendance server-side (works even when login_logs insert is blocked)
        await recordAttendance();

        // Check and update login streak - only do this once per session
        const bonus = await checkAndUpdateLoginStreak(userId);
        
        // If bonus gems were awarded (first login of the day)
        if (bonus !== null && bonus > 0) {
          console.log(`User earned ${bonus} bonus gems for logging in today`);
          setLoginBonusState({
            bonusChecked: true,
            bonusGems: bonus,
            streakDays: Math.min(bonus, 30), // Streak days = bonus gems (capped at 30)
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
