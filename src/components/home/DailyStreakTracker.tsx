import React, { useState, useEffect } from 'react';
import { Flame, Gift, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { cn } from '@/lib/utils';

interface StreakData {
  currentStreak: number;
  highestStreak: number;
  bonusGemsToday: number;
  lastLoginDate: string;
}

const DailyStreakTracker: React.FC = () => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    setIsLoggedIn(!!userId);
    
    if (userId) {
      fetchStreakData(userId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchStreakData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('login_streaks')
        .select('current_streak, highest_streak, bonus_points_today, last_login_date')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching streak data:', error);
        // Use default values if no streak exists yet
        setStreakData({
          currentStreak: 1,
          highestStreak: 1,
          bonusGemsToday: 1,
          lastLoginDate: new Date().toISOString()
        });
      } else if (data) {
        setStreakData({
          currentStreak: data.current_streak,
          highestStreak: data.highest_streak,
          bonusGemsToday: data.bonus_points_today,
          lastLoginDate: data.last_login_date
        });
      }
    } catch (err) {
      console.error('Failed to fetch streak data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate week calendar (last 7 days)
  const generateWeekCalendar = () => {
    const days = [];
    const today = new Date();
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayOfWeek = date.getDay();
      const isToday = i === 0;
      const isPast = i > 0;
      const isActive = streakData && i < streakData.currentStreak;
      
      days.push({
        day: dayNames[dayOfWeek],
        date: date.getDate(),
        isToday,
        isPast,
        isActive
      });
    }
    return days;
  };

  const weekCalendar = generateWeekCalendar();
  const nextMilestone = streakData ? Math.ceil(streakData.currentStreak / 7) * 7 : 7;
  const progressToMilestone = streakData ? ((streakData.currentStreak % 7) / 7) * 100 : 0;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border animate-pulse">
        <div className="h-24 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-500/10 via-card to-red-500/10 rounded-2xl p-6 border border-orange-500/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            {streakData && streakData.currentStreak >= 7 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-yellow-900">🔥</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Daily Streak</h3>
            <p className="text-sm text-muted-foreground">Play daily to earn bonus gems!</p>
          </div>
        </div>
        
        {isLoggedIn && streakData && (
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-500">{streakData.currentStreak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
        )}
      </div>

      {isLoggedIn ? (
        <>
          {/* Week Calendar */}
          <div className="flex justify-between gap-1 mb-6">
            {weekCalendar.map((day, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 flex flex-col items-center p-2 rounded-lg transition-all",
                  day.isToday && "ring-2 ring-orange-500",
                  day.isActive 
                    ? "bg-gradient-to-b from-orange-500 to-red-500 text-white" 
                    : day.isPast 
                      ? "bg-muted/50" 
                      : "bg-muted/30"
                )}
              >
                <span className="text-[10px] font-medium opacity-70">{day.day}</span>
                <span className={cn(
                  "text-sm font-bold",
                  day.isActive ? "text-white" : "text-foreground"
                )}>
                  {day.date}
                </span>
                {day.isActive && (
                  <Flame className="w-3 h-3 mt-1 text-yellow-300" />
                )}
              </div>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <TrendingUp className="w-4 h-4 mx-auto text-green-500 mb-1" />
              <div className="text-lg font-bold">{streakData?.highestStreak || 0}</div>
              <div className="text-[10px] text-muted-foreground">Best Streak</div>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <Gift className="w-4 h-4 mx-auto text-purple-500 mb-1" />
              <div className="text-lg font-bold">+{streakData?.bonusGemsToday || 0}</div>
              <div className="text-[10px] text-muted-foreground">Today's Bonus</div>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <Calendar className="w-4 h-4 mx-auto text-blue-500 mb-1" />
              <div className="text-lg font-bold">{nextMilestone}</div>
              <div className="text-[10px] text-muted-foreground">Next Milestone</div>
            </div>
          </div>

          {/* Progress to next milestone */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress to {nextMilestone}-day milestone</span>
              <span className="font-medium text-orange-500">{Math.round(progressToMilestone)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${progressToMilestone}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              🎁 Earn up to 30 bonus gems daily with longer streaks!
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-3">
            Sign up to track your streak and earn daily bonus gems!
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                  day <= 3 
                    ? "bg-gradient-to-b from-orange-500 to-red-500 text-white" 
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>
          <p className="text-xs text-orange-500 mt-3 font-medium">
            +1 point Day 1 → +30 gems Day 30!
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyStreakTracker;
