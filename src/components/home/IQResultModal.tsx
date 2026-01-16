
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, Trophy, Target, RefreshCw, UserPlus, LogIn, Sparkles, Award, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useQuizSounds } from '@/hooks/useQuizSounds';

type Difficulty = 'easy' | 'medium' | 'hard';

interface IQResultModalProps {
  isOpen: boolean;
  correctAnswers: number;
  totalQuestions: number;
  totalPoints: number;
  bestIQ: number | null;
  difficulty: Difficulty | null;
  onPlayAgain: () => void;
  onNewBestIQ: (iq: number) => void;
  soundEnabled?: boolean;
}

const calculateIQ = (correctAnswers: number, totalQuestions: number, difficulty: Difficulty | null): number => {
  const accuracy = correctAnswers / totalQuestions;
  // Base IQ calculation
  let baseIQ = 85 + (accuracy * 60);
  
  // Difficulty bonus
  if (difficulty === 'medium') baseIQ += 5;
  if (difficulty === 'hard') baseIQ += 10;
  
  // Add small random variation
  const variation = Math.floor(Math.random() * 11) - 5;
  return Math.round(baseIQ + variation);
};

const getIQLabel = (iq: number): { label: string; color: string } => {
  if (iq >= 135) return { label: 'Genius Level! 🧠', color: 'text-accent' };
  if (iq >= 120) return { label: 'Above Average! ⭐', color: 'text-primary' };
  if (iq >= 100) return { label: 'Smart Cookie! 🍪', color: 'text-[hsl(var(--quiz-purple))]' };
  return { label: 'Keep Learning! 📚', color: 'text-muted-foreground' };
};

const getDifficultyLabel = (difficulty: Difficulty | null): string => {
  if (difficulty === 'easy') return '🌱 Easy';
  if (difficulty === 'medium') return '⚡ Medium';
  if (difficulty === 'hard') return '🔥 Hard';
  return '';
};

const IQResultModal: React.FC<IQResultModalProps> = ({
  isOpen,
  correctAnswers,
  totalQuestions,
  totalPoints,
  bestIQ,
  difficulty,
  onPlayAgain,
  onNewBestIQ,
  soundEnabled = true,
}) => {
  const navigate = useNavigate();
  const { playNewBestSound, playCorrectSound } = useQuizSounds();
  
  const iq = useMemo(() => {
    if (!isOpen) return 0;
    return calculateIQ(correctAnswers, totalQuestions, difficulty);
  }, [isOpen, correctAnswers, totalQuestions, difficulty]);
  
  const { label, color } = getIQLabel(iq);
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
  const isNewBest = !bestIQ || iq > bestIQ;

  useEffect(() => {
    if (isOpen && iq > 0) {
      // Update best IQ if it's a new record
      if (isNewBest) {
        onNewBestIQ(iq);
        if (soundEnabled) playNewBestSound();
      } else if (accuracy >= 60 && soundEnabled) {
        playCorrectSound();
      }

      // Trigger confetti for good performance
      if (accuracy >= 60) {
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
    }
  }, [isOpen, iq, accuracy, isNewBest, onNewBestIQ, soundEnabled]);

  const handleRegister = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const difficultyLabel = getDifficultyLabel(difficulty);
  const shareText = `🧠 I scored ${iq} IQ on CuizIN Quiz (${difficultyLabel})! ${correctAnswers}/${totalQuestions} correct with ${totalPoints} points. Can you beat me?`;
  const shareUrl = 'https://cuiz-in.lovable.app';

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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

        <div className="text-center space-y-5 py-4">
          {/* New Best Badge */}
          {isNewBest && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--quiz-gold))]/10 border border-[hsl(var(--quiz-gold))]/30 animate-pulse">
              <Award className="w-4 h-4 text-[hsl(var(--quiz-gold))]" />
              <span className="text-sm font-semibold text-[hsl(var(--quiz-gold))]">New Personal Best!</span>
            </div>
          )}

          {/* Difficulty badge */}
          {difficulty && (
            <div className="text-sm text-muted-foreground">
              Played on {difficultyLabel} mode
            </div>
          )}

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

          {/* Social Share Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Share2 className="w-3 h-3" />
              Share your score
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleShareTwitter}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Button>
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
