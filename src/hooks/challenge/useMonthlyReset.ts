
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMonthlyReset = () => {
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);
  
  useEffect(() => {
    checkAndResetMonthlyScores();
    
    // Set up interval to check for resets daily
    const checkInterval = setInterval(() => {
      checkAndResetMonthlyScores();
    }, 24 * 60 * 60 * 1000); // Check once per day
    
    return () => clearInterval(checkInterval);
  }, []);
  
  const checkAndResetMonthlyScores = async () => {
    try {
      const now = new Date();
      const today = now.getDate();
      const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Only attempt reset on the 1st of the month
      if (today === 1) {
        // Check if we've already run the reset for this month
        const storedLastReset = localStorage.getItem('lastMonthlyReset');
        
        if (storedLastReset !== currentMonth) {
          console.log('Performing monthly score reset for month:', currentMonth);
          
          // Create a new monthly_gems record for active users
          const { data: activeUsers, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .gt('points', 0);
            
          if (userError) throw userError;
          
          if (activeUsers && activeUsers.length > 0) {
            // Reset existing monthly gems if any
            const { error: resetError } = await supabase
              .from('monthly_points')
              .upsert(
                activeUsers.map(user => ({
                  user_id: user.id,
                  month: currentMonth,
                  points: 0
                })),
                { onConflict: 'user_id,month' }
              );
              
            if (resetError) throw resetError;
            
            console.log(`Monthly gems reset completed for ${activeUsers.length} users`);
          }
          
          // Store the last reset date to avoid duplicate resets
          localStorage.setItem('lastMonthlyReset', currentMonth);
          setLastResetDate(currentMonth);
        }
      }
    } catch (error) {
      console.error('Error during monthly score reset:', error);
    }
  };
  
  return {
    lastResetDate
  };
};
