import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Sparkles, Loader2, Clock, Award, Brain, ZapIcon, Flame, Volume2, VolumeX, TrendingUp, Landmark, Star, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateTotalStars } from '@/utils/rewardService';
import { cn } from '@/lib/utils';
import { QuizQuestion, STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { useQuizSounds } from '@/hooks/useQuizSounds';
import { audioManager } from '@/utils/audioManager';
import { logGemsEarned } from '@/utils/gemsService';
import { isUserLoggedIn, canGuestPlay, incrementGuestPlay, getRemainingGuestPlays } from '@/utils/guestPlayService';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import GuestPlayLimitModal from '@/components/GuestPlayLimitModal';
import { trackGuestEvent } from '@/utils/guestAnalytics';
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
  totalGems?: number;
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
  totalGems = 0
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(DIFFICULTY_CONFIG[difficulty].timer);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return audioManager.isSfxEnabled();
  });
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  const [gemsEarned, setGemsEarned] = useState<number | null>(null);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [streakBonusApplied, setStreakBonusApplied] = useState<typeof STREAK_BONUSES[0] | null>(null);
  
  const { toast } = useToast();
  const haptics = useHaptics();
  const [userStars, setUserStars] = useState<number>(0);
  const [heroes, setHeroes] = useState<any[]>([]);
  const [socratesUsed, setSocratesUsed] = useState(false);
  const [aryabhataUsed, setAryabhataUsed] = useState(false);
  const [chanakyaUsed, setChanakyaUsed] = useState(false);
  const [ramanujanUsed, setRamanujanUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [smartClue, setSmartClue] = useState<string | null>(null);
  const [counselorDialogue, setCounselorDialogue] = useState<{ name: string; avatar: string; quote: string } | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTickRef = useRef<number>(0);
  
  const { playCorrectSound, playWrongSound, playTickSound, playTimeUpSound, playSelectSound } = useQuizSounds();
  
  const config = DIFFICULTY_CONFIG[difficulty];
  const isLoggedIn = isUserLoggedIn();
  const guestCanPlay = canGuestPlay();
  const remainingPlays = getRemainingGuestPlays();

  // Reset/fetch lifelines and states when question changes
  useEffect(() => {
    const loadHeroes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // stars
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('stars')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile) {
            setUserStars(profile.stars || 0);
          }

          // characters
          const { data: chars } = await (supabase as any)
            .from('user_characters')
            .select('character_id, level')
            .eq('user_id', session.user.id);
          setHeroes(chars || []);
        } else {
          // Guest local storage fallback
          const localHeroes = [
            { character_id: 'socrates', level: Number(localStorage.getItem('hero_socrates_level') || '0') },
            { character_id: 'aryabhata', level: Number(localStorage.getItem('hero_aryabhata_level') || '0') },
            { character_id: 'chanakya', level: Number(localStorage.getItem('hero_chanakya_level') || '0') },
            { character_id: 'ramanujan', level: Number(localStorage.getItem('hero_ramanujan_level') || '0') },
          ];
          setHeroes(localHeroes);
          setUserStars(Number(localStorage.getItem('quiz_app_user_stars') || '50'));
        }
      } catch (e) {
        console.error('Failed to load heroes on quiz card', e);
      }
    };
    loadHeroes();
    
    setSocratesUsed(false);
    setAryabhataUsed(false);
    setChanakyaUsed(false);
    setRamanujanUsed(false);
    setEliminatedOptions([]);
    setSmartClue(null);
    setCounselorDialogue(null);
    setIsShieldActive(false);
  }, [question.id, isLoggedIn]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeRemaining(config.timer);
    setGemsEarned(null);
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
      trackGuestEvent({ event_type: 'limit_reached' });
      setShowGuestLimitModal(true);
      return;
    }

    // Start timer on first answer if not started
    if (!timerStarted) {
      setTimerStarted(true);
    }

    haptics('light');
    if (soundEnabled) playSelectSound();
    setSelectedAnswer(answer);
    processAnswer(answer);
  };

  const processAnswer = async (answer: string | null) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsAnswered(true);
    
    // Validate answer server-side via edge function
    let isCorrect = false;
    let serverCorrectAnswer = question.correctAnswer || '';
    
    if (answer !== null) {
      try {
        const { data, error } = await supabase.functions.invoke('validate-quiz-answer', {
          body: { question_id: question.id, selected_answer: answer }
        });
        
        if (!error && data) {
          isCorrect = data.is_correct;
          serverCorrectAnswer = data.correct_answer || '';
          // Update the question object with server response for UI display
          question.correctAnswer = serverCorrectAnswer;
          if (data.explanation) question.explanation = data.explanation;
        }
      } catch (err) {
        console.error('Error validating answer:', err);
      }
    }
    
    // Apply Chanakya Shield if answer is incorrect and shield is active
    if (!isCorrect && isShieldActive) {
      isCorrect = true;
      setIsShieldActive(false);
      toast({
        title: "🛡️ Streak Shielded!",
        description: `Chanakya's shield absorbed the mistake! Correct answer was: ${serverCorrectAnswer || question.correctAnswer}`,
      });
    }
    
    // Play sound & trigger haptics
    if (answer !== null) {
      if (isCorrect) {
        haptics('success');
        audioManager.playSFX('correct');
        if (soundEnabled) playCorrectSound();
      } else {
        haptics('warning');
        audioManager.playSFX('wrong');
        if (soundEnabled) playWrongSound();
      }
    }

    // Calculate gems with streak bonus
    let gems = 0;
    const currentStreakBonus = getStreakBonus(streak);
    
    if (isCorrect) {
      const baseGems = question.difficulty === 'easy' ? 2 : question.difficulty === 'medium' ? 3 : 4;
      const timeBonus = Math.floor(timeRemaining / 10);
      let calculatedGems = (baseGems + timeBonus) * config.multiplier;
      
      // Apply streak bonus
      if (currentStreakBonus) {
        calculatedGems *= currentStreakBonus.multiplier;
        setStreakBonusApplied(currentStreakBonus);
        setShowStreakBonus(true);
      }
      
      gems = Math.round(calculatedGems);
    } else if (answer !== null) {
      gems = Math.round(0.5 * config.multiplier);
      setStreakBonusApplied(null);
    }
    setGemsEarned(gems);

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
        if (!isChallenge && gems > 0) {
          await logGemsEarned(gems, userId);
        }
        
        await (supabase as any).from('quiz_answers').insert({
          user_id: userId,
          question_id: question.id,
          selected_answer: answer || 'timeout',
          correct: isCorrect,
          points_earned: gems,
          answered_at: new Date().toISOString()
        });
      } else {
        incrementGuestPlay(gems);
        trackGuestEvent({ event_type: 'answer', question_id: question.id, correct: isCorrect, points: gems });
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }

    // Auto-advance after feedback (10s to allow reading explanation)
    setTimeout(() => {
      onComplete(isCorrect, answer || 'timeout');
    }, 10000);
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('cuizin_sound_enabled', String(newValue));
    
    // Sync with the global audioManager (muting BGM and SFX)
    if (newValue) {
      if (!audioManager.isBgmEnabled()) audioManager.toggleBGM();
      if (!audioManager.isSfxEnabled()) audioManager.toggleSFX();
    } else {
      if (audioManager.isBgmEnabled()) audioManager.toggleBGM();
      if (audioManager.isSfxEnabled()) audioManager.toggleSFX();
    }
  };

  const getOptionStyle = (option: string) => {
    if (!isAnswered) {
      if (ramanujanUsed && option === question.correctAnswer) {
        return 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-md shadow-purple-500/15 border-2';
      }
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

          {/* Streak and Gems info with bonus indicator */}
          {(streak > 0 || totalGems > 0 || currentStreakBonus) && (
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
              {totalGems > 0 && (
                <span className="text-muted-foreground ml-auto">
                  Total: <span className="font-semibold text-foreground">{totalGems} pts</span>
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

          {/* Shield Status Effect */}
          {isShieldActive && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 p-2.5 rounded-2xl text-xs text-indigo-400 font-semibold text-center mb-4 flex items-center justify-center gap-1.5 animate-pulse">
              <Shield className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
              <span>Chanakya's Diplomatic Shield is active!</span>
            </div>
          )}

          {/* Smart Hint Card */}
          {smartClue && (
            <div className="bg-purple-950/10 border border-purple-500/30 p-3 rounded-2xl text-xs text-purple-400 font-semibold text-center animate-pulse mb-4">
              🧠 Ramanujan's Formula: The answer is "{smartClue}".
            </div>
          )}

          {/* Counselor Dialogue Box */}
          {counselorDialogue && (
            <div className="bg-[#fcf6ea] text-[#1e1b18] border-4 border-double border-[#d4af37] p-3 rounded-2xl text-xs font-semibold animate-in slide-in-from-top duration-300 mb-4 shadow-md flex items-start gap-3">
              <span className="text-3xl bg-slate-900/10 p-1.5 rounded-xl border border-slate-900/5 select-none">{counselorDialogue.avatar}</span>
              <div className="text-left">
                <span className="font-extrabold uppercase text-[9px] tracking-wider text-[#78350f] block mb-0.5">{counselorDialogue.name}'s counsel</span>
                <p className="italic text-slate-700 leading-relaxed text-[11px]">"{counselorDialogue.quote}"</p>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => {
              if (eliminatedOptions.includes(option)) return null;
              return (
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
                        : !isAnswered && ramanujanUsed && option === question.correctAnswer
                        ? "bg-purple-500 text-white"
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
              );
            })}
          </div>

          {/* Council Lifelines */}
          {!isAnswered && !isChallenge && heroes.some(h => h.level > 0) && (
            <div className="border-t border-muted/50 pt-4 mt-6">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-wider mb-3">
                <Landmark className="w-3.5 h-3.5 text-yellow-500" />
                <span>Council Lifelines</span>
                <span className="ml-auto text-yellow-500 font-bold flex items-center gap-1 text-[9px]">
                  <Star className="w-3 h-3 fill-yellow-500/10 text-yellow-550" /> {userStars} stars
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Socrates */}
                {heroes.find(h => h.character_id === 'socrates')?.level > 0 && (
                  <Button
                    size="sm"
                    disabled={socratesUsed}
                    onClick={async () => {
                      const cost = 15;
                      if (userStars < cost) {
                        toast({ title: 'Treasury Empty', description: 'Not enough Stars.', variant: 'destructive' });
                        return;
                      }
                      haptics('medium');
                      audioManager.playSFX('socrates');
                      setCounselorDialogue({
                        name: 'Socrates',
                        avatar: '🏛️',
                        quote: 'An unexamined choice is not worth choosing, Knight. Let us discard two falsehoods.'
                      });
                      const { data: { session } } = await supabase.auth.getSession();
                      await updateTotalStars(-cost, session?.user?.id);
                      setUserStars(prev => prev - cost);
                      setSocratesUsed(true);
                      const wrongs = question.options.filter(o => o !== question.correctAnswer);
                      const toEliminate = wrongs.sort(() => 0.5 - Math.random()).slice(0, 2);
                      setEliminatedOptions(toEliminate);
                    }}
                    className="bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 text-[10px] font-bold h-11 flex flex-col justify-center items-center hover:bg-slate-850"
                  >
                    <span>🏛️ Socrates</span>
                    <span className="text-[7px] text-muted-foreground">50/50 (15★)</span>
                  </Button>
                )}

                {/* Aryabhata */}
                {heroes.find(h => h.character_id === 'aryabhata')?.level > 0 && (
                  <Button
                    size="sm"
                    disabled={aryabhataUsed}
                    onClick={async () => {
                      const cost = 20;
                      if (userStars < cost) {
                        toast({ title: 'Treasury Empty', description: 'Not enough Stars.', variant: 'destructive' });
                        return;
                      }
                      haptics('medium');
                      audioManager.playSFX('aryabhata');
                      setCounselorDialogue({
                        name: 'Aryabhata',
                        avatar: '📐',
                        quote: 'Time, like the movement of stars, can be bent. Take 15 more seconds.'
                      });
                      const { data: { session } } = await supabase.auth.getSession();
                      await updateTotalStars(-cost, session?.user?.id);
                      setUserStars(prev => prev - cost);
                      setAryabhataUsed(true);
                      setTimeRemaining(prev => prev + 15);
                    }}
                    className="bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 text-[10px] font-bold h-11 flex flex-col justify-center items-center hover:bg-slate-850"
                  >
                    <span>📐 Aryabhata</span>
                    <span className="text-[7px] text-muted-foreground">+15s (20★)</span>
                  </Button>
                )}

                {/* Chanakya */}
                {heroes.find(h => h.character_id === 'chanakya')?.level > 0 && (
                  <Button
                    size="sm"
                    disabled={chanakyaUsed}
                    onClick={async () => {
                      const cost = 25;
                      if (userStars < cost) {
                        toast({ title: 'Treasury Empty', description: 'Not enough Stars.', variant: 'destructive' });
                        return;
                      }
                      haptics('medium');
                      audioManager.playSFX('chanakya');
                      setCounselorDialogue({
                        name: 'Chanakya',
                        avatar: '📜',
                        quote: "A king's best shield is foresight. Your streak is protected."
                      });
                      const { data: { session } } = await supabase.auth.getSession();
                      await updateTotalStars(-cost, session?.user?.id);
                      setUserStars(prev => prev - cost);
                      setChanakyaUsed(true);
                      setIsShieldActive(true);
                    }}
                    className="bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-350 text-[10px] font-bold h-11 flex flex-col justify-center items-center hover:bg-slate-850"
                  >
                    <span>📜 Chanakya</span>
                    <span className="text-[7px] text-muted-foreground">Shield (25★)</span>
                  </Button>
                )}

                {/* Ramanujan */}
                {heroes.find(h => h.character_id === 'ramanujan')?.level > 0 && (
                  <Button
                    size="sm"
                    disabled={ramanujanUsed}
                    onClick={async () => {
                      const cost = 35;
                      if (userStars < cost) {
                        toast({ title: 'Treasury Empty', description: 'Not enough Stars.', variant: 'destructive' });
                        return;
                      }
                      haptics('medium');
                      audioManager.playSFX('ramanujan');
                      setCounselorDialogue({
                        name: 'Ramanujan',
                        avatar: '🧠',
                        quote: `The equation of truth points directly to: "${question.correctAnswer}"!`
                      });
                      const { data: { session } } = await supabase.auth.getSession();
                      await updateTotalStars(-cost, session?.user?.id);
                      setUserStars(prev => prev - cost);
                      setRamanujanUsed(true);
                      setSmartClue(question.correctAnswer);
                    }}
                    className="bg-slate-900 border border-slate-800 text-purple-400 hover:text-purple-300 text-[10px] font-bold h-11 flex flex-col justify-center items-center hover:bg-slate-850"
                  >
                    <span>🧠 Ramanujan</span>
                    <span className="text-[7px] text-muted-foreground">Hint (35★)</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Feedback / Gems earned with streak bonus info */}
          {isAnswered && gemsEarned !== null && (
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
                    Correct! +{gemsEarned} gems
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

          {/* Explanation */}
          {isAnswered && question.explanation && (
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <h4 className="font-semibold text-sm text-primary flex items-center gap-1.5 mb-1.5">
                💡 Did you know?
              </h4>
              <p className="text-sm text-foreground/80 leading-relaxed">{question.explanation}</p>
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
                Register to save gems
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
