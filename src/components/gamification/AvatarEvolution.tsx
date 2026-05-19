import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface AvatarEvolutionProps {
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
}

export const AvatarEvolution: React.FC<AvatarEvolutionProps> = ({
  currentLevel,
  currentXP,
  xpToNextLevel
}) => {
  const progressPercentage = (currentXP / xpToNextLevel) * 100;
  
  // Logic to determine title and icon based on level
  const getAvatarMeta = (level: number) => {
    if (level < 5) return { title: 'Novice Scholar', color: 'bg-slate-200' };
    if (level < 15) return { title: 'Quiz Adept', color: 'bg-blue-300' };
    if (level < 30) return { title: 'Master Thinker', color: 'bg-purple-400' };
    return { title: 'Grandmaster', color: 'bg-yellow-400' };
  };

  const meta = getAvatarMeta(currentLevel);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full mx-auto">
      <div className="relative">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center shadow-inner transition-colors duration-500",
          meta.color
        )}>
          {/* Placeholder for actual Avatar SVG/Image */}
          <span className="text-3xl">🧑‍🎓</span>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
          Lvl {currentLevel}
        </div>
      </div>

      <div className="text-center">
        <h3 className="font-bold text-lg text-slate-800">{meta.title}</h3>
        <p className="text-sm text-slate-500 font-medium">Keep quizzing to evolve!</p>
      </div>

      <div className="w-full space-y-2 mt-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>{currentXP} XP</span>
          <span>{xpToNextLevel} XP</span>
        </div>
        <Progress value={progressPercentage} className="h-2.5" />
      </div>
    </div>
  );
};
