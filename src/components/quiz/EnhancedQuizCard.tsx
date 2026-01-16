import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Sparkles, Loader2, Clock, Award, Brain, ZapIcon, Flame, Volume2, VolumeX, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuizQuestion, STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { useQuizSounds } from '@/hooks/useQuizSounds';
import { logPointsEarned } from '@/utils/pointsService';
import { isUserLoggedIn, canGuestPlay, incrementGuestPlay, getRemainingGuestPlays } from '@/utils/guestPlayService';
import GuestPlayLimitModal from '@/components/GuestPlayLimitModal';
import { Link } from 'react-router-dom';

// Streak bonus multipliers
const STREAK_BONUSES = [
  { threshold: 3, multiplier: 1.5, label: '1.5x', emoji: '🔥' },
  { threshold: 5, multiplier: 2, label: '2x', emoji: '⚡' },
  { threshold: 10, multiplier: 2.5, label: '2.5x', emoji: '💎' },
  { threshold: 15, multiplier: 3, label: '3x', emoji: '🏆' },
];

const getStreakBonus = (streak: number) => {
  for (let i = STREAK_BONUSES.length - 1; i >= 0; i--) {
    if (streak >= STREAK_BONUSES[i].threshold) {
      return STREAK_BONUSES[i];
    }
  }
  return null;
};

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  label: string;
  timer: number;
  multiplier: number;
  color: string;
  icon: string;
  bgColor: string;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { label: 'Easy', timer: 45, multiplier: 1, color: 'text-accent', icon: '🌱', bgColor: 'bg-accent/10' },
  medium: { label: 'Medium', timer: 30, multiplier: 1.5, color: 'text-[hsl(var(--quiz-gold))]', icon: '⚡', bgColor: 'bg-[hsl(var(--quiz-gold))]/10' },
  hard: { label: 'Hard', timer: 15, multiplier: 2, color: 'text-destructive', icon: '🔥', bgColor: 'bg-destructive/10' },
};

interface EnhancedQuizCardProps {
  question: QuizQuestion;
  onComplete: (isCorrect: boolean, selectedAnswer: string) => void;
  difficulty?: Difficulty;
  onDifficultyChange?: (difficulty: Difficulty) => void;
  showDifficultySelector?: boolean;
  questionsAnswered?: number;
  streak?: number;
  isChallenge?: boolean;
  totalPoints?: number;
}

const EnhancedQuizCard: React.FC<EnhancedQuizCardProps> = ({
  question,
  onComplete,
  difficulty = 'medium',
  onDifficultyChange,
  showDifficultySelector = false,
  questionsAnswered = 0,
  streak = 0,
  isChallenge = false,
  totalPoints = 0
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(DIFFICULTY_CONFIG[difficulty].timer);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('cuizin_sound_enabled');
    return stored !== 'false';
  });
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [streakBonusApplied, setStreakBonusApplied] = useState<typeof STREAK_BONUSES[0] | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0);
  
  const { playCorrectSound, playWrongSound, playTickSound, playTimeUpSound, playSelectSound } = useQuizSounds();
  
  const config = DIFFICULTY_CONFIG[difficulty];
  const isLoggedIn = isUserLoggedIn();
  const guestCanPlay = canGuestPlay();
  const remainingPlays = getRemainingGuestPlays();

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeRemaining(config.timer);
    setPointsEarned(null);
  }, [question.id, config.timer]);

  // Timer logic
  useEffect(() => {
    if (timerStarted && !isAnswered) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          // Play tick sound when time is low
          if (prev <= 10 && prev > 1 && soundEnabled) {
            const now = Date.now();
            if (now - lastTickRef.current >= 900) {
              playTickSound();
              lastTickRef.current = now;
            }
          }
          
          if (prev <= 1) {
            handleTimeUp();
            return config.timer;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerStarted, isAnswered, config.timer, soundEnabled]);

  const handleTimeUp = () => {
    if (isAnswered) return;
    
    if (soundEnabled) playTimeUpSound();
    processAnswer(null);
  };

  const handleAnswerSelect = async (answer: string) => {
    if (isAnswered) return;

    // Check guest limits
    if (!isLoggedIn && !guestCanPlay) {
      setShowGuestLimitModal(true);
      return;
    }

    // Start timer on first answer if not started
    if (!timerStarted) {
      setTimerStarted(true);
    }

    if (soundEnabled) playSelectSound();
    setSelectedAnswer(answer);
    processAnswer(answer);
  };

  const processAnswer = async (answer: string | null) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsAnswered(true);
    const isCorrect = answer === question.correctAnswer;
    
    // Play sound
    if (answer !== null) {
      if (isCorrect && soundEnabled) playCorrectSound();
      else if (!isCorrect && soundEnabled) playWrongSound();
    }

    // Calculate points with streak bonus
    let points = 0;
    const currentStreakBonus = getStreakBonus(streak);
    
    if (isCorrect) {
      const basePoints = question.difficulty === 'easy' ? 2 : question.difficulty === 'medium' ? 3 : 4;
      const timeBonus = Math.floor(timeRemaining / 10);
      let calculatedPoints = (basePoints + timeBonus) * config.multiplier;
      
      // Apply streak bonus
      if (currentStreakBonus) {
        calculatedPoints *= currentStreakBonus.multiplier;
        setStreakBonusApplied(currentStreakBonus);
        setShowStreakBonus(true);
      }
      
      points = Math.round(calculatedPoints);
    } else if (answer !== null) {
      points = Math.round(0.5 * config.multiplier);
      setStreakBonusApplied(null);
    }
    setPointsEarned(points);

    // Save to database
    try {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      if (!isChallenge) {
        const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
        if (!completedQuestions.includes(question.id)) {
          completedQuestions.push(question.id);
          localStorage.setItem(STORAGE_KEYS.COMPLETED_QUESTIONS, JSON.stringify(completedQuestions));
        }
      }

      if (userId) {
        if (!isChallenge && points > 0) {
          await logPointsEarned(points, userId);
        }
        
        await supabase.from('quiz_answers').insert({
          user_id: userId,
          question_id: question.id,
          selected_answer: answer || 'timeout',
          correct: isCorrect,
          points_earned: points,
          answered_at: new Date().toISOString()
        });
      } else {
        incrementGuestPlay(points);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }

    // Auto-advance after feedback
    setTimeout(() => {
      onComplete(isCorrect, answer || 'timeout');
    }, 1500);
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('cuizin_sound_enabled', String(newValue));
  };

  const getOptionStyle = (option: string) => {
    if (!isAnswered) {
      return 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer active:scale-[0.98]';
    }

    if (option === question.correctAnswer) {
      return 'border-accent bg-accent/10';
    }

    if (option === selectedAnswer && option !== question.correctAnswer) {
      return 'border-destructive bg-destructive/10';
    }

    return 'border-border opacity-50';
  };

  const getTimerColor = () => {
    const percentage = timeRemaining / config.timer;
    if (percentage > 0.5) return 'text-accent';
    if (percentage > 0.25) return 'text-[hsl(var(--quiz-gold))]';
    return 'text-destructive animate-pulse';
  };

  const getDifficultyIcon = () => {
    switch (question.difficulty) {
      case 'easy': return <Brain className="w-4 h-4" />;
      case 'medium': return <ZapIcon className="w-4 h-4" />;
      case 'hard': return <Flame className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  // Timer visual bar calculations
  const timerPercentage = (timeRemaining / config.timer) * 100;
  const isTimeLow = timerPercentage <= 25;
  const isTimeMedium = timerPercentage <= 50 && timerPercentage > 25;
  
  // Get current streak bonus info for display
  const currentStreakBonus = getStreakBonus(streak);
  const nextStreakBonus = STREAK_BONUSES.find(b => b.threshold > streak);

  return (
    <>
      <div className="bg-card border rounded-2xl overflow-hidden shadow-lg relative">
        {/* Animated Timer Bar */}
        {timerStarted && !isAnswered && (
          <div className="h-2 bg-muted/50 overflow-hidden relative">
            {/* Background glow for urgency */}
            {isTimeLow && (
              <div className="absolute inset-0 bg-destructive/20 animate-pulse" />
            )}
            
            {/* Timer bar with gradient and glow */}
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-linear relative",
                timerPercentage > 50 
                  ? "bg-gradient-to-r from-accent to-accent/80" 
                  : timerPercentage > 25 
                  ? "bg-gradient-to-r from-[hsl(var(--quiz-gold))] to-[hsl(var(--quiz-gold))]/80" 
                  : "bg-gradient-to-r from-destructive to-destructive/80"
              )}
              style={{ width: `${timerPercentage}%` }}
            >
              {/* Shimmer effect */}
              <div 
                className={cn(
                  "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent",
                  isTimeLow ? "animate-[shimmer_0.5s_ease-in-out_infinite]" : "animate-[shimmer_2s_ease-in-out_infinite]"
                )}
                style={{
                  backgroundSize: '200% 100%',
                }}
              />
              
              {/* Pulsing dot at the end */}
              <div 
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full",
                  timerPercentage > 50 ? "bg-accent" : timerPercentage > 25 ? "bg-[hsl(var(--quiz-gold))]" : "bg-destructive",
                  isTimeLow ? "animate-ping" : "animate-pulse"
                )}
              />
            </div>
          </div>
        )}
        
        {/* Streak Bonus Celebration Overlay */}
        {showStreakBonus && streakBonusApplied && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="animate-[scale-in_0.3s_ease-out] bg-primary/90 text-primary-foreground px-4 py-2 rounded-full font-bold text-lg shadow-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {streakBonusApplied.emoji} {streakBonusApplied.label} Streak Bonus!
            </div>
          </div>
        )}

        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                question.difficulty === 'easy' ? 'bg-accent/10 text-accent' :
                question.difficulty === 'medium' ? 'bg-[hsl(var(--quiz-gold))]/10 text-[hsl(var(--quiz-gold))]' :
                'bg-destructive/10 text-destructive'
              )}>
                {getDifficultyIcon()}
                {question.difficulty}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {question.category}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Timer */}
              {timerStarted && !isAnswered && (
                <div className={cn("flex items-center gap-1 text-sm font-bold", getTimerColor())}>
                  <Clock className="w-4 h-4" />
                  <span>{timeRemaining}s</span>
                </div>
              )}
              
              {/* Sound toggle */}
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Streak and Points info with bonus indicator */}
          {(streak > 0 || totalPoints > 0 || currentStreakBonus) && (
            <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
              {streak > 0 && (
                <span className={cn(
                  "px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 transition-all",
                  currentStreakBonus 
                    ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary ring-1 ring-primary/30 animate-pulse" 
                    : "bg-primary/10 text-primary"
                )}>
                  🔥 {streak} streak
                  {currentStreakBonus && (
                    <span className="text-xs font-bold">({currentStreakBonus.label})</span>
                  )}
                </span>
              )}
              {nextStreakBonus && streak > 0 && (
                <span className="text-xs text-muted-foreground">
                  {nextStreakBonus.threshold - streak} more for {nextStreakBonus.label}!
                </span>
              )}
              {totalPoints > 0 && (
                <span className="text-muted-foreground ml-auto">
                  Total: <span className="font-semibold text-foreground">{totalPoints} pts</span>
                </span>
              )}
            </div>
          )}

          {/* Difficulty selector */}
          {showDifficultySelector && onDifficultyChange && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-muted-foreground">Difficulty:</span>
              {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, DifficultyConfig][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => {
                    onDifficultyChange(key);
                    setTimeRemaining(cfg.timer);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                    difficulty === key
                      ? cn(cfg.bgColor, cfg.color, "ring-1 ring-current")
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          )}

          {/* Question */}
          <h3 className="text-lg md:text-xl font-semibold mb-5 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-1" />
            {question.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={isAnswered}
                className={cn(
                  "w-full flex items-center justify-between p-3.5 md:p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  getOptionStyle(option)
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors",
                    isAnswered && option === question.correctAnswer
                      ? "bg-accent text-accent-foreground"
                      : isAnswered && option === selectedAnswer
                      ? "bg-destructive text-destructive-foreground"
                      : selectedAnswer === option
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-medium">{option}</span>
                </div>

                {isAnswered && option === question.correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                )}
                {isAnswered && option === selectedAnswer && option !== question.correctAnswer && (
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Feedback / Points earned with streak bonus info */}
          {isAnswered && pointsEarned !== null && (
            <div className={cn(
              "mt-4 p-3 rounded-xl text-center font-medium",
              selectedAnswer === question.correctAnswer
                ? "bg-accent/10 text-accent"
                : "bg-destructive/10 text-destructive"
            )}>
              {selectedAnswer === question.correctAnswer ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Correct! +{pointsEarned} points
                  </span>
                  {streakBonusApplied && (
                    <span className="text-xs opacity-80 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Includes {streakBonusApplied.label} streak bonus!
                    </span>
                  )}
                </div>
              ) : selectedAnswer === null ? (
                <span className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" />
                  Time's up! The answer was {question.correctAnswer}
                </span>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Wrong! Correct: {question.correctAnswer}
                  </span>
                  {streak > 0 && (
                    <span className="text-xs opacity-80">
                      Streak reset to 0
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loading next */}
          {isAnswered && (
            <div className="mt-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading next question...
            </div>
          )}

          {/* Guest warning */}
          {!isLoggedIn && remainingPlays > 0 && remainingPlays <= 5 && !isAnswered && (
            <p className="mt-4 text-xs text-muted-foreground text-center">
              {remainingPlays} free {remainingPlays === 1 ? 'question' : 'questions'} remaining •{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register to save points
              </Link>
            </p>
          )}
        </div>
      </div>

      <GuestPlayLimitModal 
        isOpen={showGuestLimitModal} 
        onClose={() => setShowGuestLimitModal(false)} 
      />
    </>
  );
};

export default EnhancedQuizCard;
