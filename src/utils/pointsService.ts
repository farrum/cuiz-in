
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from './quizData';

// Function to check and reset daily points if necessary
export const checkDailyPointsReset = async (userId?: string | null) => {
  if (!userId) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check the last reset date from localStorage
  const lastDailyResetKey = `last_daily_reset_${userId}`;
  const lastReset = localStorage.getItem(lastDailyResetKey);
  
  // If no reset has happened yet or it's a different day, reset the points
  if (!lastReset || lastReset !== today) {
    try {
      console.log('Resetting daily points for user', userId);
      
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
        console.error('Error resetting daily points:', error);
      } else {
        console.log('Daily points have been reset for', userId);
        
        // Also reset in localStorage
        localStorage.setItem(`daily_points_${today}`, '0');
        localStorage.setItem(lastDailyResetKey, today);
        
        // Notify other components about the update
        window.dispatchEvent(new CustomEvent('pointsUpdated'));
      }
    } catch (error) {
      console.error('Error in daily points reset:', error);
    }
  }
};

// Function to check and reset monthly points if necessary
export const checkMonthlyPointsReset = async (userId?: string | null) => {
  if (!userId) return;
  
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  
  // Check the last reset month from localStorage
  const lastMonthlyResetKey = `last_monthly_reset_${userId}`;
  const lastReset = localStorage.getItem(lastMonthlyResetKey);
  
  // If no reset has happened yet or it's a different month, reset the points
  if (!lastReset || lastReset !== currentMonth) {
    try {
      console.log('Checking monthly points reset for user', userId, 'current month:', currentMonth, 'last reset:', lastReset);
      
      // Get the current month's first day
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // If the last reset date is more than 30 days ago, reset the monthly points
      if (!lastReset || new Date(lastReset).getTime() < new Date(firstDayOfMonth).getTime()) {
        console.log('Resetting monthly points for user', userId);
        
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
          console.error('Error resetting monthly points:', error);
        } else {
          console.log('Monthly points have been reset for', userId);
          
          // Also reset in localStorage
          localStorage.setItem(`monthly_points_${now.getFullYear()}_${now.getMonth()}`, '0');
          localStorage.setItem(lastMonthlyResetKey, currentMonth);
          
          // Notify other components about the update
          window.dispatchEvent(new CustomEvent('pointsUpdated'));
        }
      }
    } catch (error) {
      console.error('Error in monthly points reset:', error);
    }
  }
};

// Log points for daily tracking in a consistent manner
export const logPointsForDay = async (points: number, userId?: string | null) => {
  if (!userId) return;
  console.log(`Logging ${points} points for user ${userId} for today`);

  // Check if the daily points should be reset
  await checkDailyPointsReset(userId);

  // Get today's date in ISO format
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Check if there's already a record for today for this user
    const { data, error } = await supabase
      .from('daily_points')
      .select('points')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    
    if (error && error.code !== 'PGSQL_ERROR') {
      console.error('Error checking daily points:', error);
      return;
    }
    
    let dailyPoints = 0;
    
    if (data) {
      // Update existing record
      dailyPoints = Number(data.points) + points;
      
      const { error: updateError } = await supabase
        .from('daily_points')
        .update({ points: dailyPoints })
        .eq('user_id', userId)
        .eq('date', today);
        
      if (updateError) {
        console.error('Error updating daily points:', updateError);
        return;
      }
    } else {
      // Create new record
      dailyPoints = points;
      
      const { error: insertError } = await supabase
        .from('daily_points')
        .insert({ user_id: userId, date: today, points });
        
      if (insertError) {
        console.error('Error inserting daily points:', insertError);
        return;
      }
    }
    
    // Store in localStorage for client-side tracking
    localStorage.setItem(`daily_points_${today}`, dailyPoints.toString());
    
    console.log(`Updated daily points for user ${userId} to ${dailyPoints}`);
    
    // Notify other components about the update
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
  } catch (error) {
    console.error('Error updating daily points:', error);
  }
};

// Log points for monthly tracking in a consistent manner
export const logPointsForMonth = async (points: number, userId?: string | null) => {
  if (!userId) return;
  console.log(`Logging ${points} points for user ${userId} for this month`);

  // Check if the monthly points should be reset
  await checkMonthlyPointsReset(userId);

  // Get current year and month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
  
  try {
    // Check if there's already a record for this month for this user
    const { data, error } = await supabase
      .from('monthly_points')
      .select('points')
      .eq('user_id', userId)
      .eq('month', monthKey)
      .maybeSingle();
    
    if (error && error.code !== 'PGSQL_ERROR') {
      console.error('Error checking monthly points:', error);
      return;
    }
    
    let monthlyPoints = 0;
    
    if (data) {
      // Update existing record
      monthlyPoints = Number(data.points) + points;
      
      const { error: updateError } = await supabase
        .from('monthly_points')
        .update({ points: monthlyPoints })
        .eq('user_id', userId)
        .eq('month', monthKey);
        
      if (updateError) {
        console.error('Error updating monthly points:', updateError);
        return;
      }
    } else {
      // Create new record
      monthlyPoints = points;
      
      const { error: insertError } = await supabase
        .from('monthly_points')
        .insert({ user_id: userId, month: monthKey, points });
        
      if (insertError) {
        console.error('Error inserting monthly points:', insertError);
        return;
      }
    }
    
    // Store in localStorage for client-side tracking
    localStorage.setItem(`monthly_points_${year}_${month}`, monthlyPoints.toString());
    
    console.log(`Updated monthly points for user ${userId} to ${monthlyPoints}`);
    
    // Notify other components about the update
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
  } catch (error) {
    console.error('Error updating monthly points:', error);
  }
};

// Update total user points in a consistent manner
export const updateTotalPoints = async (points: number, userId?: string | null) => {
  if (!userId) return;
  console.log(`Adding ${points} to total points for user ${userId}`);
  
  try {
    // Get current points
    const { data, error } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching total points:', error);
      return;
    }
    
    const currentPoints = data?.points || 0;
    const newTotal = Number(currentPoints) + points;
    
    // Update points in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ points: newTotal })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating total points:', updateError);
      return;
    }
    
    // Update local storage
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, newTotal.toString());
    
    console.log(`Updated total points for user ${userId} from ${currentPoints} to ${newTotal}`);
    
    // Notify other components about the update
    window.dispatchEvent(new CustomEvent('pointsUpdated'));
  } catch (error) {
    console.error('Error updating total points:', error);
  }
};

// Log points across all tracking systems consistently
export const logPointsEarned = async (points: number, userId?: string | null) => {
  if (!userId || points <= 0) return;
  
  console.log(`Logging ${points} points earned for user ${userId} across all systems`);
  
  try {
    // Update all points tracking systems
    await Promise.all([
      logPointsForDay(points, userId),
      logPointsForMonth(points, userId),
      updateTotalPoints(points, userId)
    ]);
    
    console.log(`Successfully logged ${points} points for user ${userId}`);
  } catch (error) {
    console.error('Error in logPointsEarned:', error);
  }
};

// Get points for today from localStorage
export const getPointsForToday = (): number => {
  const today = new Date().toISOString().split('T')[0];
  const key = `daily_points_${today}`;
  return parseFloat(localStorage.getItem(key) || '0');
};

// Get points for month from localStorage
export const getPointsForMonth = (): number => {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const key = `monthly_points_${year}_${month}`;
  return parseFloat(localStorage.getItem(key) || '0');
};

// Get total user points from localStorage
export const getTotalPoints = (): number => {
  return parseFloat(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
};
