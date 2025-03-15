
import { STORAGE_KEYS } from '../types/quiz';
import { DAILY_TARGET, MONTHLY_TARGET, MONTHLY_REWARD } from '../data/quizQuestions';

export const getPointsForToday = (): number => {
  const today = new Date().toISOString().split('T')[0];
  const dailyLog = JSON.parse(localStorage.getItem('quiz_app_daily_points') || '{}');
  return dailyLog[today] || 0;
};

export const getPointsForMonth = (): number => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyLog = JSON.parse(localStorage.getItem('quiz_app_monthly_points') || '{}');
  return monthlyLog[currentMonth] || 0;
};

export const hasCompletedDailyTarget = (): boolean => {
  const todayPoints = getPointsForToday();
  return todayPoints >= DAILY_TARGET;
};

export const hasCompletedMonthlyTarget = (): boolean => {
  const monthlyPoints = getPointsForMonth();
  return monthlyPoints >= MONTHLY_TARGET;
};

export const logPointsForDay = (pointsEarned: number): void => {
  const today = new Date().toISOString().split('T')[0];
  const dailyLog = JSON.parse(localStorage.getItem('quiz_app_daily_points') || '{}');
  
  if (!dailyLog[today]) {
    dailyLog[today] = 0;
  }
  
  dailyLog[today] += pointsEarned;
  localStorage.setItem('quiz_app_daily_points', JSON.stringify(dailyLog));
  
  if (dailyLog[today] >= DAILY_TARGET) {
    updateDailyStreak();
  }
};

export const logPointsForMonth = (pointsEarned: number): void => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyLog = JSON.parse(localStorage.getItem('quiz_app_monthly_points') || '{}');
  
  if (!monthlyLog[currentMonth]) {
    monthlyLog[currentMonth] = 0;
  }
  
  monthlyLog[currentMonth] += pointsEarned;
  localStorage.setItem('quiz_app_monthly_points', JSON.stringify(monthlyLog));
  
  if (monthlyLog[currentMonth] >= MONTHLY_TARGET) {
    handleMonthlyTargetAchievement(currentMonth);
  }
};

const handleMonthlyTargetAchievement = (month: string): void => {
  const achievements = JSON.parse(localStorage.getItem('quiz_app_achievements') || '[]');
  const alreadyRewarded = achievements.some((a: any) => a.month === month && a.type === 'monthly_target');
  
  if (!alreadyRewarded) {
    achievements.push({
      id: Date.now().toString(),
      type: 'monthly_target',
      month: month,
      reward: MONTHLY_REWARD,
      date: new Date().toISOString(),
      claimed: false
    });
    
    localStorage.setItem('quiz_app_achievements', JSON.stringify(achievements));
  }
};

const updateDailyStreak = (): void => {
  const currentUserName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
  if (!currentUserName) return;
  
  const userId = currentUserName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36).slice(-4);
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];
  
  const dailyLog = JSON.parse(localStorage.getItem('quiz_app_daily_points') || '{}');
  const streakData = JSON.parse(localStorage.getItem('quiz_app_daily_streaks') || '{}');
  
  const currentStreak = streakData[userId] || 0;
  
  if (dailyLog[yesterdayString] >= DAILY_TARGET || currentStreak === 0) {
    streakData[userId] = currentStreak + 1;
    localStorage.setItem('quiz_app_daily_streaks', JSON.stringify(streakData));
  } else {
    streakData[userId] = 1;
    localStorage.setItem('quiz_app_daily_streaks', JSON.stringify(streakData));
  }
};
