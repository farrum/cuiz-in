
import React from 'react';
import PointsDisplay from '@/components/PointsDisplay';
import { Progress } from '@/components/ui/progress';
import { DAILY_TARGET, MONTHLY_TARGET } from '@/utils/quizData';

interface PointsAndProgressProps {
  questionsAnswered: number;
  streak: number;
  dailyPoints: number;
  monthlyPoints: number;
  nextBadgeThreshold: number;
}

const PointsAndProgress: React.FC<PointsAndProgressProps> = ({
  questionsAnswered,
  streak,
  dailyPoints,
  monthlyPoints,
  nextBadgeThreshold
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <PointsDisplay animateUpdate className="flex-1" />
        
        <div className="glass rounded-2xl p-4 flex-1">
          <div className="flex flex-col items-center">
            <h4 className="text-sm text-muted-foreground mb-1">Questions Answered</h4>
            <div className="text-3xl font-bold">{questionsAnswered}</div>
            
            {streak > 0 && (
              <div className="mt-2 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                {streak} question streak!
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="glass rounded-2xl p-4 mb-8">
        <h4 className="text-sm font-medium mb-3">Daily Target: {dailyPoints.toFixed(1)} / {DAILY_TARGET} points</h4>
        <Progress value={(dailyPoints / DAILY_TARGET) * 100} className="h-2 mb-4" />
        
        <h4 className="text-sm font-medium mb-3">Monthly Target: {monthlyPoints.toFixed(1)} / {MONTHLY_TARGET} points</h4>
        <Progress value={(monthlyPoints / MONTHLY_TARGET) * 100} className="h-2" />
        
        <div className="mt-3 text-xs text-muted-foreground">
          Complete the monthly target to earn ₹8,000 reward!
        </div>
      </div>
      
      <div className="mb-6 mt-6">
        <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mb-2">
          <div 
            className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000"
            style={{ width: `${Math.min(((questionsAnswered % nextBadgeThreshold) / nextBadgeThreshold) * 100, 100)}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground text-right">
          {nextBadgeThreshold - (questionsAnswered % nextBadgeThreshold)} more questions until next milestone
        </div>
      </div>
    </>
  );
};

export default PointsAndProgress;
