
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, Trophy, Target, RefreshCw, UserPlus, LogIn, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface IQResultModalProps {
  isOpen: boolean;
  correctAnswers: number;
  totalQuestions: number;
  totalPoints: number;
  onPlayAgain: () => void;
}

const calculateIQ = (correctAnswers: number, totalQuestions: number): number => {
  const accuracy = correctAnswers / totalQuestions;
  // Base IQ ranges from 85 to 145 based on accuracy
  const baseIQ = 85 + (accuracy * 60);
  // Add small random variation (+-5) for fun
  const variation = Math.floor(Math.random() * 11) - 5;
  return Math.round(baseIQ + variation);
};

const getIQLabel = (iq: number): { label: string; color: string } => {
  if (iq >= 130) return { label: 'Genius Level! 🧠', color: 'text-accent' };
  if (iq >= 115) return { label: 'Above Average! ⭐', color: 'text-primary' };
  if (iq >= 100) return { label: 'Smart Cookie! 🍪', color: 'text-[hsl(var(--quiz-purple))]' };
  return { label: 'Keep Learning! 📚', color: 'text-muted-foreground' };
};

const IQResultModal: React.FC<IQResultModalProps> = ({
  isOpen,
  correctAnswers,
  totalQuestions,
  totalPoints,
  onPlayAgain,
}) => {
  const navigate = useNavigate();
  const iq = calculateIQ(correctAnswers, totalQuestions);
  const { label, color } = getIQLabel(iq);
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

  useEffect(() => {
    if (isOpen && accuracy >= 60) {
      // Trigger confetti for good performance
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ffd700', '#22c55e', '#a855f7'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ffd700', '#22c55e', '#a855f7'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen, accuracy]);

  const handleRegister = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Your Quiz IQ Result
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6 py-4">
          {/* IQ Score */}
          <div className="relative">
            <div className="text-7xl font-bold bg-gradient-to-r from-primary via-[hsl(var(--quiz-purple))] to-accent bg-clip-text text-transparent">
              {iq}
            </div>
            <p className={`text-lg font-semibold mt-2 ${color}`}>{label}</p>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-muted/50">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Target className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold">{correctAnswers}/{totalQuestions}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="w-4 h-4 text-[hsl(var(--quiz-gold))]" />
              </div>
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{accuracy}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Register now to save your score and compete on the leaderboard!
            </p>
            
            <Button
              onClick={handleRegister}
              className="w-full gradient-primary text-white btn-shine"
              size="lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Register to Save Score
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={onPlayAgain}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button
                onClick={handleLogin}
                variant="ghost"
                className="flex-1"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IQResultModal;
