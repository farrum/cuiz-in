
import React, { useMemo } from 'react';
import { Clock, Users, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuizMode } from '@/hooks/quiz/useQuizTypes';

interface GameModeBannerProps {
  mode: QuizMode;
  timeRemaining: number | null;
  opponentName?: string;
}

export const GameModeBanner: React.FC<GameModeBannerProps> = ({
  mode,
  timeRemaining,
  opponentName
}) => {
  const { icon, label, colorClass, timeDisplay } = useMemo(() => {
    let icon = <Zap className="h-5 w-5" />;
    let label = 'Standard Mode';
    let colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
    
    switch (mode) {
      case 'time-attack':
        icon = <Clock className="h-5 w-5" />;
        label = 'Time Attack Mode';
        colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
        break;
      case 'challenge':
        icon = <Trophy className="h-5 w-5" />;
        label = 'Challenge Mode';
        colorClass = 'bg-purple-100 text-purple-800 border-purple-200';
        break;
      case 'multiplayer':
        icon = <Users className="h-5 w-5" />;
        label = opponentName ? `Playing against ${opponentName}` : 'Multiplayer Mode';
        colorClass = 'bg-green-100 text-green-800 border-green-200';
        break;
    }
    
    // Format time display
    let timeDisplay = null;
    if (timeRemaining !== null) {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return { icon, label, colorClass, timeDisplay };
  }, [mode, timeRemaining, opponentName]);

  return (
    <div className={cn(
      "rounded-md border p-2 px-3 mb-4 flex justify-between items-center",
      colorClass
    )}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      
      {timeDisplay && (
        <div className="flex items-center gap-1 font-mono">
          <Clock className="h-4 w-4" />
          <span className="font-bold">{timeDisplay}</span>
        </div>
      )}
    </div>
  );
};
