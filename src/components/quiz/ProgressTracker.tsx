
import React from 'react';
import { cn } from '@/utils/animations';

interface ProgressTrackerProps {
  questionsAnswered: number;
  streak: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  questionsAnswered,
  streak 
}) => {
  return (
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
  );
};

export default ProgressTracker;
