import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming shadcn/utils pattern is used

interface DailyStreakProps {
  currentStreak: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DailyStreak: React.FC<DailyStreakProps> = ({ 
  currentStreak, 
  className,
  size = 'md' 
}) => {
  const isActive = currentStreak > 0;

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-12 h-12 text-xl',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 font-bold transition-all",
        isActive ? "text-orange-500 drop-shadow-sm" : "text-gray-400 opacity-50",
        className
      )}
      title={isActive ? `You are on a ${currentStreak} day streak!` : "Complete a quiz to start your daily streak!"}
    >
      <div className={cn(
        "flex items-center justify-center rounded-full bg-orange-100/20",
        sizeClasses[size]
      )}>
        <Flame 
          size={iconSizes[size]} 
          className={cn(
            "transition-all duration-300",
            isActive && "fill-orange-500 animate-pulse"
          )} 
        />
      </div>
      <span className="tabular-nums tracking-tight">
        {currentStreak}
      </span>
    </div>
  );
};
