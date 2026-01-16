import React from 'react';
import { Brain, Zap, Flame, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  label: string;
  timer: number;
  multiplier: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { 
    label: 'Easy', 
    timer: 45, 
    multiplier: 1, 
    color: 'text-accent',
    icon: <Brain className="w-5 h-5" />,
    description: 'Relaxed pace, perfect for learning'
  },
  medium: { 
    label: 'Medium', 
    timer: 30, 
    multiplier: 1.5, 
    color: 'text-[hsl(var(--quiz-gold))]',
    icon: <Zap className="w-5 h-5" />,
    description: 'Balanced challenge with bonus points'
  },
  hard: { 
    label: 'Hard', 
    timer: 15, 
    multiplier: 2, 
    color: 'text-destructive',
    icon: <Flame className="w-5 h-5" />,
    description: 'Fast-paced with double points'
  },
};

interface QuizDifficultySelectorProps {
  selectedDifficulty: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  bestScore?: number;
  className?: string;
}

const QuizDifficultySelector: React.FC<QuizDifficultySelectorProps> = ({
  selectedDifficulty,
  onSelect,
  bestScore,
  className
}) => {
  return (
    <div className={cn("bg-card border rounded-2xl p-4 md:p-6", className)}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold mb-1">Select Difficulty</h3>
        <p className="text-sm text-muted-foreground">
          Higher difficulty = more points per question
        </p>
      </div>

      {bestScore !== undefined && bestScore > 0 && (
        <div className="flex items-center justify-center gap-2 mb-4 p-2 rounded-lg bg-[hsl(var(--quiz-gold))]/10 border border-[hsl(var(--quiz-gold))]/20">
          <Award className="w-4 h-4 text-[hsl(var(--quiz-gold))]" />
          <span className="text-sm font-medium text-[hsl(var(--quiz-gold))]">
            Best Score: {bestScore} pts
          </span>
        </div>
      )}

      <div className="space-y-2">
        {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, DifficultyConfig][]).map(([key, cfg]) => (
          <Button
            key={key}
            onClick={() => onSelect(key)}
            variant={selectedDifficulty === key ? "default" : "outline"}
            className={cn(
              "w-full justify-between p-4 h-auto transition-all",
              selectedDifficulty === key && "ring-2 ring-primary ring-offset-2"
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn(
                "p-2 rounded-full",
                selectedDifficulty === key 
                  ? "bg-primary-foreground/20" 
                  : key === 'easy' ? 'bg-accent/10' : key === 'medium' ? 'bg-[hsl(var(--quiz-gold))]/10' : 'bg-destructive/10'
              )}>
                <span className={selectedDifficulty === key ? "text-primary-foreground" : cfg.color}>
                  {cfg.icon}
                </span>
              </span>
              <div className="text-left">
                <div className={cn(
                  "font-semibold",
                  selectedDifficulty === key ? "" : cfg.color
                )}>
                  {cfg.label}
                </div>
                <div className="text-xs opacity-70">{cfg.timer}s per question</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{cfg.multiplier}x</div>
              <div className="text-xs opacity-70">points</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuizDifficultySelector;
