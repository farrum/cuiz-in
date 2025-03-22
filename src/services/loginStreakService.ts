
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
    let consecutiveDays = 0; // Start with 0 and add today if needed
    const uniqueDates = new Set<string>();
    
    if (loginLogs && loginLogs.length > 0) {
      // Convert login timestamps to days, removing duplicates
      loginLogs.forEach(log => {
        if (log && log.login_time && typeof log.login_time === 'string') {
          const date = new Date(log.login_time);
          const dateStr = date.toISOString().split('T')[0];
          uniqueDates.add(dateStr);
        }
      });
      
      // Add today if user has logged in
      uniqueDates.add(todayStr);
      
      // Sort dates in descending order (newest first)
      const sortedDates = Array.from(uniqueDates).sort().reverse();
      console.log('Sorted login dates:', sortedDates);
      
      // Calculate consecutive days starting from today
      if (sortedDates.includes(todayStr)) {
        consecutiveDays = 1; // Start with today
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Check if there are previous consecutive days
        let currentDate = yesterdayStr;
        
        for (let i = 1; i < sortedDates.length; i++) {
          if (sortedDates.includes(currentDate)) {
            consecutiveDays++;
            // Move to the previous day
            const tempDate = new Date(currentDate);
            tempDate.setDate(tempDate.getDate() - 1);
            currentDate = tempDate.toISOString().split('T')[0];
          } else {
            // Break the streak if a day is missed
            break;
          }
        }
      } else {
        // If the user hasn't logged in today, streak is 0
        consecutiveDays = 0;
      }
      
      console.log('Calculated consecutive login days:', consecutiveDays);
    }
    
    // If this is the user's first login ever, create a new streak
    if (!streakData) {
      console.log('First login for user, creating new streak record');
      const bonusPoints = consecutiveDays > 0 ? consecutiveDays : 0; // Points based on streak
      
      const { data: newStreak, error: createError } = await supabase
        .from('login_streaks')
        .insert({
          user_id: userId,
          current_streak: consecutiveDays,
          highest_streak: consecutiveDays,
          last_login_date: todayStr,
          bonus_points_today: bonusPoints,
          bonus_claimed_today: bonusPoints > 0
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
        
        // Award the bonus points locally if applicable
        if (bonusPoints > 0) {
          await awardBonusPoints(userId, bonusPoints);
        }
        return bonusPoints > 0 ? bonusPoints : null;
      }
      
      console.log('Created new streak record:', newStreak);
      
      // Award the bonus points if applicable
      if (bonusPoints > 0) {
        await awardBonusPoints(userId, bonusPoints);
      }
      return bonusPoints > 0 ? bonusPoints : null;
    }
    
    console.log('Existing streak data:', streakData);
    
    // If streak exists, check if user has already claimed bonus today
    if (streakData.last_login_date === todayStr && streakData.bonus_claimed_today) {
      console.log('User already claimed bonus today');
      return null;
    }
    
    // Get the date from last_login_date
    const lastLoginDate = new Date(streakData.last_login_date);
    lastLoginDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days between last login and today
    const diffTime = today.getTime() - lastLoginDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('Days since last login:', diffDays);
    
    let newStreak: number;
    let bonusPoints: number;
    
    if (diffDays === 0) {
      // Already logged in today, but haven't claimed bonus
      newStreak = streakData.current_streak;
      bonusPoints = Math.min(newStreak, 30); // Cap at 30 points
    } else if (diffDays === 1) {
      // Consecutive day login - increment the streak
      newStreak = streakData.current_streak + 1;
      bonusPoints = Math.min(newStreak, 30); // Cap at 30 points
    } else {
      // Streak broken (more than 1 day since last login)
      newStreak = 1; // Reset streak to 1 (today)
      bonusPoints = 1; // First day gives 1 point
    }
    
    // Use the calculated consecutiveDays if it's valid and different
    if (consecutiveDays > 0 && consecutiveDays !== newStreak) {
      console.log('Using login logs consecutive days:', consecutiveDays, 'instead of calculated:', newStreak);
      newStreak = consecutiveDays;
      bonusPoints = Math.min(newStreak, 30); // Cap at 30 points
    }
    
    console.log('Updating streak record:', {
      current_streak: newStreak,
      highest_streak: Math.max(newStreak, streakData.highest_streak),
      last_login_date: todayStr,
      bonus_points_today: bonusPoints,
      bonus_claimed_today: true
    });
    
    // Make sure we update the login_streaks table properly
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
      .eq('user_id', userId);  // Changed from streakData.id to userId for better reliability
      
    if (updateError) {
      console.error('Error updating login streak:', updateError);
      // Save locally if Supabase fails
      localStorage.setItem('quiz_app_login_streak', JSON.stringify({
        current_streak: newStreak,
        highest_streak: Math.max(newStreak, streakData.highest_streak),
        last_login_date: todayStr
      }));
    } else {
      console.log('Successfully updated login streak in database');
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
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user points:', updateError);
      return;
    }
    
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
    
    // Fetch the user's login streak record
    const { data, error } = await supabase
      .from('login_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching login streak:', error);
      return null;
    }
    
    if (!data) {
      console.log('No login streak found for user:', userId);
      return null;
    }
    
    // Check if the streak is still active by comparing last_login_date with today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const lastLoginDate = new Date(data.last_login_date);
    lastLoginDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = today.getTime() - lastLoginDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('Days since last login:', diffDays, 'for streak record:', data);
    
    // If the user hasn't logged in today or yesterday, mark the streak as inactive (0)
    if (diffDays > 1) {
      console.log('Streak is inactive due to missed login days:', diffDays);
      
      // Update the streak to 0 in the database
      const { error: updateError } = await supabase
        .from('login_streaks')
        .update({
          current_streak: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
        
      if (updateError) {
        console.error('Error updating inactive streak:', updateError);
      } else {
        console.log('Updated streak to inactive (0) in database');
      }
      
      // Return the updated data with current_streak set to 0
      return {
        ...data,
        current_streak: 0
      };
    }
    
    console.log('Found login streak:', data);
    return data as LoginStreak;
  } catch (error) {
    console.error('Error in getUserLoginStreak:', error);
    return null;
  }
};
