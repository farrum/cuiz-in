import React from 'react';
import { Trophy, Flame, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactStatsBarProps {
  questionsAnswered: number;
  streak: number;
  dailyPoints: number;
  className?: string;
}

const CompactStatsBar: React.FC<CompactStatsBarProps> = ({
  questionsAnswered,
  streak,
  dailyPoints,
  className
}) => {
  return (
    <div className={cn(
      "flex items-center justify-between gap-2 p-3 rounded-xl bg-card border",
      className
    )}>
      {/* Questions Answered */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Target className="w-4 h-4 text-primary" />
        </div>
        <div className="text-sm">
          <span className="font-bold">{questionsAnswered}</span>
          <span className="text-muted-foreground ml-1 hidden sm:inline">answered</span>
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          streak > 0 ? "bg-[hsl(var(--quiz-gold))]/10" : "bg-muted"
        )}>
          <Flame className={cn(
            "w-4 h-4",
            streak > 0 ? "text-[hsl(var(--quiz-gold))]" : "text-muted-foreground"
          )} />
        </div>
        <div className="text-sm">
          <span className={cn(
            "font-bold",
            streak > 0 ? "text-[hsl(var(--quiz-gold))]" : ""
          )}>{streak}</span>
          <span className="text-muted-foreground ml-1 hidden sm:inline">streak</span>
        </div>
      </div>

      {/* Daily Points */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div className="text-sm">
          <span className="font-bold text-accent">{dailyPoints.toFixed(0)}</span>
          <span className="text-muted-foreground ml-1 hidden sm:inline">pts today</span>
        </div>
      </div>
    </div>
  );
};

export default CompactStatsBar;
