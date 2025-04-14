
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface TimeAttackTimerProps {
  initialTime: number;
  isActive: boolean;
  onTimeUp: () => void;
}

const TimeAttackTimer: React.FC<TimeAttackTimerProps> = ({ initialTime, isActive, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Alert when time is running low
        if (newTime === 10) {
          toast({
            title: "Time running low!",
            description: "Only 10 seconds remaining!",
            variant: "warning",
          });
        }
        
        // Handle time up
        if (newTime <= 0) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, onTimeUp, toast]);
  
  useEffect(() => {
    // Reset timer when initial time changes (mode switch)
    setTimeLeft(initialTime);
  }, [initialTime]);
  
  const percentRemaining = (timeLeft / initialTime) * 100;
  
  // Change color based on remaining time
  let progressColor = "bg-green-500";
  if (percentRemaining < 50) progressColor = "bg-yellow-500";
  if (percentRemaining < 20) progressColor = "bg-red-500";
  
  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">Time Remaining</span>
        <span className="text-sm font-medium">{timeLeft}s</span>
      </div>
      <Progress 
        value={percentRemaining} 
        className="h-2 transition-all" 
        indicatorClassName={progressColor} 
      />
    </div>
  );
};

export default TimeAttackTimer;
