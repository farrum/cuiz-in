
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { calculatePoints, logPointsForDay, logPointsForMonth } from '@/utils/quizData';

interface LoginStreak {
  id: string;
  user_id: string;
  current_streak: number;
  last_login_date: string;
  highest_streak: number;
  bonus_points_today: number;
  bonus_claimed_today: boolean;
}

/**
 * Checks and updates the user's login streak when they log in
 * Returns the bonus points earned if this is their first login of the day
 */
export const checkAndUpdateLoginStreak = async (userId: string): Promise<number | null> => {
  if (!userId) {
    console.log('No userId provided to checkAndUpdateLoginStreak');
    return null;
  }
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('Checking login streak for user:', userId, 'today:', todayStr);
    
    // Fetch login logs to determine consecutive days
    const { data: loginLogs, error: logsError } = await supabase
      .from('login_logs')
      .select('login_time')
      .eq('username', localStorage.getItem(STORAGE_KEYS.USER_NAME))
      .order('login_time', { ascending: false });
    
    if (logsError) {
      console.error('Error fetching login logs:', logsError);
    }
    
    // Check if the user already has a streak record
    const { data: streakData, error: streakError } = await supabase
      .from('login_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (streakError) {
      console.error('Error checking login streak:', streakError);
      return null;
    }
    
    // Process login logs to determine consecutive days
    let consecutiveDays = 1;
    let lastLoginDate = todayStr;
    
    if (loginLogs && loginLogs.length > 0) {
      // Convert login timestamps to days, removing duplicates
      const uniqueDates = new Set<string>();
      
      loginLogs.forEach(log => {
        if (log && log.login_time) {
          const date = new Date(log.login_time as string);
          const dateStr = date.toISOString().split('T')[0];
          uniqueDates.add(dateStr);
        }
      });
      
      // Sort dates in descending order
      const sortedDates = Array.from(uniqueDates).sort().reverse();
      console.log('Sorted login dates:', sortedDates);
      
      // Calculate consecutive days starting from the latest date
      if (sortedDates.length > 0) {
        lastLoginDate = sortedDates[0];
        
        // Start with 1 day (today)
        consecutiveDays = 1;
        
        // Check for consecutive days
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const currentDate = new Date(sortedDates[i]);
          const prevDate = new Date(sortedDates[i + 1]);
          
          // Calculate the difference in days
          const diffTime = currentDate.getTime() - prevDate.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            consecutiveDays++;
          } else {
            break;
          }
        }
      }
      
      console.log('Calculated consecutive login days:', consecutiveDays);
    }
    
    // If this is the user's first login ever, create a new streak
    if (!streakData) {
      console.log('First login for user, creating new streak record');
      const bonusPoints = 1; // First day gives 1 point
      
      const { data: newStreak, error: createError } = await supabase
        .from('login_streaks')
        .insert({
          user_id: userId,
          current_streak: consecutiveDays,
          highest_streak: consecutiveDays,
          last_login_date: todayStr,
          bonus_points_today: bonusPoints,
          bonus_claimed_today: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating login streak:', createError);
        // Save locally if Supabase fails
        localStorage.setItem('quiz_app_login_streak', JSON.stringify({
          current_streak: consecutiveDays,
          highest_streak: consecutiveDays,
          last_login_date: todayStr
        }));
        
        // Award the bonus points locally
        await awardBonusPoints(userId, bonusPoints);
        return bonusPoints;
      }
      
      // Award the bonus points
      await awardBonusPoints(userId, bonusPoints);
      return bonusPoints;
    }
    
    console.log('Existing streak data:', streakData);
    
    // If streak exists, check if user has already claimed bonus today
    if (streakData.last_login_date === todayStr && streakData.bonus_claimed_today) {
      console.log('User already claimed bonus today');
      return null;
    }
    
    // Update streak with calculated consecutive days
    let newStreak = Math.max(consecutiveDays, streakData.current_streak);
    let bonusPoints = Math.min(newStreak, 30); // Cap at 30 points
    
    console.log('Updating streak record:', {
      current_streak: newStreak,
      highest_streak: Math.max(newStreak, streakData.highest_streak),
      last_login_date: todayStr,
      bonus_points_today: bonusPoints,
      bonus_claimed_today: true
    });
    
    const { error: updateError } = await supabase
      .from('login_streaks')
      .update({
        current_streak: newStreak,
        highest_streak: Math.max(newStreak, streakData.highest_streak),
        last_login_date: todayStr,
        bonus_points_today: bonusPoints,
        bonus_claimed_today: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', streakData.id);
      
    if (updateError) {
      console.error('Error updating login streak:', updateError);
      // Save locally if Supabase fails
      localStorage.setItem('quiz_app_login_streak', JSON.stringify({
        current_streak: newStreak,
        highest_streak: Math.max(newStreak, streakData.highest_streak),
        last_login_date: todayStr
      }));
    }
    
    // Award the bonus points
    await awardBonusPoints(userId, bonusPoints);
    return bonusPoints;
  } catch (error) {
    console.error('Error in checkAndUpdateLoginStreak:', error);
    return null;
  }
};

/**
 * Awards bonus points to the user and updates their total points
 */
const awardBonusPoints = async (userId: string, bonusPoints: number): Promise<void> => {
  try {
    // Update user's points in the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return;
    }
    
    const currentPoints = profileData.points || 0;
    const newPoints = currentPoints + bonusPoints;
    
    await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', userId);
    
    // Update local storage
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, newPoints.toString());
    
    // Also log these points for daily and monthly tracking
    await logPointsForDay(bonusPoints, userId);
    await logPointsForMonth(bonusPoints, userId);
    
    // Trigger points updated event
    window.dispatchEvent(new Event('pointsUpdated'));
    
    console.log(`Awarded ${bonusPoints} login bonus points to user ${userId}`);
  } catch (error) {
    console.error('Error awarding bonus points:', error);
  }
};

/**
 * Gets the current login streak for a user
 */
export const getUserLoginStreak = async (userId: string): Promise<LoginStreak | null> => {
  if (!userId) {
    console.log('No userId provided to getUserLoginStreak');
    return null;
  }
  
  try {
    console.log('Getting login streak for user:', userId);
    const { data, error } = await supabase
      .from('login_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching login streak:', error);
      return null;
    }
    
    console.log('Found login streak:', data);
    return data as LoginStreak;
  } catch (error) {
    console.error('Error in getUserLoginStreak:', error);
    return null;
  }
};
