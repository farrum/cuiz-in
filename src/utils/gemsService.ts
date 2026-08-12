
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from './quizData';

// Function to check and reset daily gems if necessary
export const checkDailyGemsReset = async (userId?: string | null) => {
  if (!userId) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check the last reset date from localStorage
  const lastDailyResetKey = `last_daily_reset_${userId}`;
  const lastReset = localStorage.getItem(lastDailyResetKey);
  
  // If no reset has happened yet or it's a different day, reset the gems
  if (!lastReset || lastReset !== today) {
    try {
      console.log('Resetting daily gems for user', userId);
      
      // Get the current date at midnight
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      // Reset in database - update today's record to zero or create a new one
      const { data, error } = await supabase
        .from('daily_points')
        .upsert({ 
          user_id: userId, 
          date: today, 
          points: 0 
        })
        .eq('user_id', userId)
        .eq('date', today);
      
      if (error) {
        console.error('Error resetting daily gems:', error);
      } else {
        console.log('Daily gems have been reset for', userId);
        
        // Also reset in localStorage
        localStorage.setItem(`daily_gems_${today}`, '0');
        localStorage.setItem(lastDailyResetKey, today);
        
        // Notify other components about the update
        window.dispatchEvent(new CustomEvent('gemsUpdated'));
      }
    } catch (error) {
      console.error('Error in daily gems reset:', error);
    }
  }
};

// Function to check and reset monthly gems if necessary
export const checkMonthlyGemsReset = async (userId?: string | null) => {
  if (!userId) return;
  
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  
  // Check the last reset month from localStorage
  const lastMonthlyResetKey = `last_monthly_reset_${userId}`;
  const lastReset = localStorage.getItem(lastMonthlyResetKey);
  
  // If no reset has happened yet or it's a different month, reset the gems
  if (!lastReset || lastReset !== currentMonth) {
    try {
      console.log('Checking monthly gems reset for user', userId, 'current month:', currentMonth, 'last reset:', lastReset);
      
      // Get the current month's first day
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // If the last reset date is more than 30 days ago, reset the monthly gems
      if (!lastReset || new Date(lastReset).getTime() < new Date(firstDayOfMonth).getTime()) {
        console.log('Resetting monthly gems for user', userId);
        
        // Reset in database - update this month's record to zero or create a new one
        const { data, error } = await supabase
          .from('monthly_points')
          .upsert({
            user_id: userId,
            month: currentMonth,
            points: 0
          })
          .eq('user_id', userId)
          .eq('month', currentMonth);
        
        if (error) {
          console.error('Error resetting monthly gems:', error);
        } else {
          console.log('Monthly gems have been reset for', userId);
          
          // Also reset in localStorage
          localStorage.setItem(`monthly_gems_${now.getFullYear()}_${now.getMonth()}`, '0');
          localStorage.setItem(lastMonthlyResetKey, currentMonth);
          
          // Notify other components about the update
          window.dispatchEvent(new CustomEvent('gemsUpdated'));
        }
      }
    } catch (error) {
      console.error('Error in monthly gems reset:', error);
    }
  }
};

// Log gems for daily tracking in a consistent manner
export const logGemsForDay = async (gems: number, userId?: string | null) => {
  if (!userId) return;
  console.log(`Logging ${gems} gems for user ${userId} for today`);

  // Check if the daily gems should be reset
  await checkDailyGemsReset(userId);

  // Get today's date in ISO format
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Check if there's already a record for today for this user
    const { data, error } = await supabase
      .from('daily_points')
      .select('gems:points')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    
    if (error && error.code !== 'PGSQL_ERROR') {
      console.error('Error checking daily gems:', error);
      return;
    }
    
    let dailyGems = 0;
    
    if (data) {
      // Update existing record
      dailyGems = Number(data.gems) + gems;
      
      const { error: updateError } = await supabase
        .from('daily_points')
        .update({ points: dailyGems })
        .eq('user_id', userId)
        .eq('date', today);
        
      if (updateError) {
        console.error('Error updating daily gems:', updateError);
        return;
      }
    } else {
      // Create new record
      dailyGems = gems;
      
      const { error: insertError } = await supabase
        .from('daily_points')
        .insert({ user_id: userId, date: today, points: gems });
        
      if (insertError) {
        console.error('Error inserting daily gems:', insertError);
        return;
      }
    }
    
    // Store in localStorage for client-side tracking
    localStorage.setItem(`daily_gems_${today}`, dailyGems.toString());
    
    console.log(`Updated daily gems for user ${userId} to ${dailyGems}`);
    
    // Notify other components about the update
    window.dispatchEvent(new CustomEvent('gemsUpdated'));
  } catch (error) {
    console.error('Error updating daily gems:', error);
  }
};

// Log gems for monthly tracking in a consistent manner
export const logGemsForMonth = async (gems: number, userId?: string | null) => {
  if (!userId) return;
  console.log(`Logging ${gems} gems for user ${userId} for this month`);

  // Check if the monthly gems should be reset
  await checkMonthlyGemsReset(userId);

  // Get current year and month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
  
  try {
    // Check if there's already a record for this month for this user
    const { data, error } = await supabase
      .from('monthly_points')
      .select('gems:points')
      .eq('user_id', userId)
      .eq('month', monthKey)
      .maybeSingle();
    
    if (error && error.code !== 'PGSQL_ERROR') {
      console.error('Error checking monthly gems:', error);
      return;
    }
    
    let monthlyGems = 0;
    
    if (data) {
      // Update existing record
      monthlyGems = Number(data.gems) + gems;
      
      const { error: updateError } = await supabase
        .from('monthly_points')
        .update({ points: monthlyGems })
        .eq('user_id', userId)
        .eq('month', monthKey);
        
      if (updateError) {
        console.error('Error updating monthly gems:', updateError);
        return;
      }
    } else {
      // Create new record
      monthlyGems = gems;
      
      const { error: insertError } = await supabase
        .from('monthly_points')
        .insert({ user_id: userId, month: monthKey, points: gems });
        
      if (insertError) {
        console.error('Error inserting monthly gems:', insertError);
        return;
      }
    }
    
    // Store in localStorage for client-side tracking
    localStorage.setItem(`monthly_gems_${year}_${month}`, monthlyGems.toString());
    
    console.log(`Updated monthly gems for user ${userId} to ${monthlyGems}`);
    
    // Notify other components about the update
    window.dispatchEvent(new CustomEvent('gemsUpdated'));
  } catch (error) {
    console.error('Error updating monthly gems:', error);
  }
};

// Update total user gems in a consistent manner
export const updateTotalGems = async (gems: number, userId?: string | null) => {
  if (!userId) return;
  console.log(`Adding ${gems} to total gems for user ${userId}`);
  
  try {
    // Balances are only mutable server-side via the award_currency RPC
    const { data: result, error: rpcError } = await (supabase as any).rpc('award_currency', {
      p_points_delta: Math.round(gems),
      p_stars_delta: 0,
      p_reason: 'gems_earned'
    });

    if (rpcError || (result as any)?.error) {
      console.error('Error updating total gems:', rpcError || (result as any)?.error);
      return;
    }

    const newTotal = Number((result as any)?.points ?? 0);
    
    // Update local storage
    localStorage.setItem(STORAGE_KEYS.USER_GEMS, newTotal.toString());
    
    console.log(`Updated total gems for user ${userId} to ${newTotal}`);
    
    // Notify other components about the update
    window.dispatchEvent(new CustomEvent('gemsUpdated'));
  } catch (error) {
    console.error('Error updating total gems:', error);
  }
};

// Log gems across all tracking systems consistently
export const logGemsEarned = async (gems: number, userId?: string | null) => {
  if (!userId || gems <= 0) return;
  
  console.log(`Logging ${gems} gems earned for user ${userId} across all systems`);
  
  try {
    // Update all gems tracking systems
    await Promise.all([
      logGemsForDay(gems, userId),
      logGemsForMonth(gems, userId),
      updateTotalGems(gems, userId)
    ]);
    
    console.log(`Successfully logged ${gems} gems for user ${userId}`);
  } catch (error) {
    console.error('Error in logGemsEarned:', error);
  }
};

// Get gems for today from localStorage
export const getGemsForToday = (): number => {
  const today = new Date().toISOString().split('T')[0];
  const key = `daily_gems_${today}`;
  return parseFloat(localStorage.getItem(key) || '0');
};

// Get gems for month from localStorage
export const getGemsForMonth = (): number => {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const key = `monthly_gems_${year}_${month}`;
  return parseFloat(localStorage.getItem(key) || '0');
};

// Get total user gems from localStorage
export const getTotalGems = (): number => {
  return parseFloat(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '0');
};
