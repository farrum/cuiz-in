
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { DAILY_TARGET, MONTHLY_TARGET } from '@/utils/quizData';

interface TargetProgressProps {
  dailyPoints: number;
  monthlyPoints: number;
}

const TargetProgress: React.FC<TargetProgressProps> = ({ 
  dailyPoints,
  monthlyPoints 
}) => {
  return (
    <div className="glass rounded-2xl p-4 mb-8">
      <h4 className="text-sm font-medium mb-3">Daily Target: {dailyPoints.toFixed(1)} / {DAILY_TARGET} points</h4>
      <Progress value={(dailyPoints / DAILY_TARGET) * 100} className="h-2 mb-4" />
      
      <h4 className="text-sm font-medium mb-3">Monthly Target: {monthlyPoints.toFixed(1)} / {MONTHLY_TARGET} points</h4>
      <Progress value={(monthlyPoints / MONTHLY_TARGET) * 100} className="h-2" />
      
      <div className="mt-3 text-xs text-muted-foreground">
        Complete the monthly target to earn ₹8,000 reward!
      </div>
    </div>
  );
};

export default TargetProgress;
