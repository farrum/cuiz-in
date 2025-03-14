
import React from 'react';
import { CalendarCheck, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PointsDisplayProps {
  animateUpdate?: boolean;
  className?: string;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ animateUpdate, className }) => {
  const { user } = useAuth();
  
  // If user is not logged in, don't display points
  if (!user) {
    return null;
  }
  
  return (
    <div className={`hidden sm:flex items-center gap-4 ${className || ''}`}>
      <div className="flex items-center gap-2 bg-accent/80 p-1.5 pl-2 pr-3 rounded-full">
        <div className="rounded-full p-1 bg-primary w-6 h-6 flex items-center justify-center">
          <CalendarCheck className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium">Daily:</span>
          <span className="text-xs font-bold">100/500</span>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-accent/80 p-1.5 pl-2 pr-3 rounded-full">
        <div className="rounded-full p-1 bg-primary w-6 h-6 flex items-center justify-center">
          <Trophy className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium">Monthly:</span>
          <span className="text-xs font-bold">1.2K/10K</span>
        </div>
      </div>
    </div>
  );
};

export default PointsDisplay;
