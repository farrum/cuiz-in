
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
    
    // If this is the user's first login ever, create a new streak
    if (!streakData) {
      console.log('First login for user, creating new streak record');
      const bonusPoints = 1; // First day gives 1 point
      
      const { data: newStreak, error: createError } = await supabase
        .from('login_streaks')
        .insert({
          user_id: userId,
          current_streak: 1,
          highest_streak: 1,
          last_login_date: todayStr,
          bonus_points_today: bonusPoints,
          bonus_claimed_today: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating login streak:', createError);
        return null;
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
    
    // Check if user logged in yesterday
    const lastLoginDate = new Date(streakData.last_login_date);
    lastLoginDate.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    console.log('Last login date:', lastLoginDate.toISOString().split('T')[0]);
    console.log('Yesterday:', yesterday.toISOString().split('T')[0]);
    console.log('Last login timestamp:', lastLoginDate.getTime());
    console.log('Yesterday timestamp:', yesterday.getTime());
    console.log('Are dates equal?', lastLoginDate.getTime() === yesterday.getTime());
    
    let newStreak: number;
    let bonusPoints: number;
    
    if (lastLoginDate.getTime() === yesterday.getTime()) {
      // Consecutive login - increase streak
      newStreak = streakData.current_streak + 1;
      bonusPoints = Math.min(newStreak, 30); // Cap at 30 points
      console.log('Consecutive login, new streak:', newStreak);
    } else if (lastLoginDate.getTime() === today.getTime()) {
      // Already logged in today but hasn't claimed bonus
      newStreak = streakData.current_streak;
      bonusPoints = Math.min(newStreak, 30);
      console.log('Already logged in today, keeping streak:', newStreak);
    } else {
      // Streak broken - reset to 1
      newStreak = 1;
      bonusPoints = 1;
      console.log('Streak broken, resetting to 1. Last login:', lastLoginDate.toDateString(), 'Today:', today.toDateString());
    }
    
    // Update the streak record
    const highestStreak = Math.max(newStreak, streakData.highest_streak);
    
    console.log('Updating streak record:', {
      current_streak: newStreak,
      highest_streak: highestStreak,
      last_login_date: todayStr,
      bonus_points_today: bonusPoints,
      bonus_claimed_today: true
    });
    
    const { error: updateError } = await supabase
      .from('login_streaks')
      .update({
        current_streak: newStreak,
        highest_streak: highestStreak,
        last_login_date: todayStr,
        bonus_points_today: bonusPoints,
        bonus_claimed_today: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', streakData.id);
      
    if (updateError) {
      console.error('Error updating login streak:', updateError);
      return null;
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
