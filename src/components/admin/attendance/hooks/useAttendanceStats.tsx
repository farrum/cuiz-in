
import { parseISO, differenceInDays } from 'date-fns';
import { AttendanceRecord } from '../types';

export const useAttendanceStats = (userHistory: Record<string, AttendanceRecord[]>) => {
  const getUserAttendanceStats = (userId: string) => {
    if (!userHistory[userId] || userHistory[userId].length === 0) {
      return {
        totalDays: 0,
        currentStreak: 0,
        lastActiveDate: null
      };
    }

    const records = userHistory[userId];
    
    // Get total unique days
    const uniqueDates = new Set(records.map(r => r.attendance_date));
    const totalDays = uniqueDates.size;
    
    // Calculate current streak
    const sortedDates = [...uniqueDates].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    let currentStreak = 1;
    let lastDate = parseISO(sortedDates[0]);
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = parseISO(sortedDates[i]);
      const diff = differenceInDays(lastDate, currentDate);
      
      if (diff === 1) {
        currentStreak++;
        lastDate = currentDate;
      } else {
        break;
      }
    }
    
    return {
      totalDays,
      currentStreak,
      lastActiveDate: sortedDates[0]
    };
  };

  return {
    getUserAttendanceStats
  };
};
