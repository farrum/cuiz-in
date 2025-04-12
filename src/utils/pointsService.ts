
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from './constants';

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
      // Get the current month's first day
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // If the last reset date is more than 30 days ago, reset the monthly points
      if (!lastReset || new Date(lastReset).getTime() < new Date(firstDayOfMonth).getTime()) {
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
        }
      }
    } catch (error) {
      console.error('Error in monthly points reset:', error);
    }
  }
};

// Log points for daily tracking
export const logPointsForDay = async (points: number, userId?: string | null) => {
  // Check if the daily points should be reset
  await checkDailyPointsReset(userId);

  // Store in localStorage for client-side tracking
  const today = new Date().toISOString().split('T')[0];
  const key = `daily_points_${today}`;
  let dailyPoints = parseFloat(localStorage.getItem(key) || '0');
  dailyPoints += points;
  localStorage.setItem(key, dailyPoints.toString());
  
  // If userId is provided, update the database
  if (userId) {
    try {
      // Check if there's already a record for today for this user
      const { data, error } = await supabase
        .from('daily_points')
        .select('points')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      if (error && error.code !== 'PGSQL_ERROR') {
        console.error('Error checking daily points:', error);
        return;
      }
      
      if (data) {
        // Update existing record
        await supabase
          .from('daily_points')
          .update({ points: Number(data.points) + points })
          .eq('user_id', userId)
          .eq('date', today);
      } else {
        // Create new record
        await supabase
          .from('daily_points')
          .insert({ user_id: userId, date: today, points });
      }
      
      // Also log this in quiz_answers for detailed tracking (already done in QuizCard)
      console.log(`Logged ${points} points for user ${userId} on ${today}`);
    } catch (error) {
      console.error('Error updating daily points:', error);
    }
  }
};

// Log points for monthly tracking
export const logPointsForMonth = async (points: number, userId?: string | null) => {
  // Check if the monthly points should be reset
  await checkMonthlyPointsReset(userId);

  // Store in localStorage for client-side tracking
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
  const key = `monthly_points_${year}_${month}`;
  let monthlyPoints = parseFloat(localStorage.getItem(key) || '0');
  monthlyPoints += points;
  localStorage.setItem(key, monthlyPoints.toString());
  
  // If userId is provided, update the database
  if (userId) {
    try {
      // Check if there's already a record for this month for this user
      const { data, error } = await supabase
        .from('monthly_points')
        .select('points')
        .eq('user_id', userId)
        .eq('month', monthKey)
        .single();
      
      if (error && error.code !== 'PGSQL_ERROR') {
        console.error('Error checking monthly points:', error);
        return;
      }
      
      if (data) {
        // Update existing record
        await supabase
          .from('monthly_points')
          .update({ points: Number(data.points) + points })
          .eq('user_id', userId)
          .eq('month', monthKey);
      } else {
        // Create new record
        await supabase
          .from('monthly_points')
          .insert({ user_id: userId, month: monthKey, points });
      }
      
      // Also update the user's total points in profiles (already handled in QuizCard)
      console.log(`Logged ${points} points for user ${userId} for month ${monthKey}`);
    } catch (error) {
      console.error('Error updating monthly points:', error);
    }
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
