
import { useState, useEffect } from 'react';
import { eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

export const useDaysInMonth = (currentMonth: Date) => {
  const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);
  
  // Update days in month when current month changes
  useEffect(() => {
    // Get all days in the current month
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
    setDaysInMonth(days);
  }, [currentMonth]);

  return { daysInMonth };
};
