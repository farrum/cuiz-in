
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Trophy, Sparkles, Loader2, Clock, Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useQuizSounds } from '@/hooks/useQuizSounds';
import IQResultModal from './IQResultModal';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer?: string;
  category: string;
  gems: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  label: string;
  timer: number;
  multiplier: number;
  color: string;
  icon: string;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { label: 'Easy', timer: 45, multiplier: 1, color: 'text-accent', icon: '🌱' },
  medium: { label: 'Medium', timer: 30, multiplier: 1.5, color: 'text-[hsl(var(--quiz-gold))]', icon: '⚡' },
  hard: { label: 'Hard', timer: 15, multiplier: 2, color: 'text-destructive', icon: '🔥' },
};

const TOTAL_QUESTIONS = 5;
const BEST_IQ_KEY = 'cuizin_best_iq_score';

const InteractiveQuizPreview: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalGems, setTotalGems] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [bestIQ, setBestIQ] = useState<number | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTickRef = useRef<number>(0);

  const { playCorrectSound, playWrongSound, playTickSound, playTimeUpSound, playSelectSound } = useQuizSounds();

  const config = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;

  // Load best IQ from localStorage on mount
  useEffect(() => {
    const storedBestIQ = localStorage.getItem(BEST_IQ_KEY);
    if (storedBestIQ) {
      setBestIQ(parseInt(storedBestIQ, 10));
    }
  }, []);

  // Timer logic with sound warnings
  useEffect(() => {
    if (timerStarted && !isAnswered && !isLoading && !showResult && config) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          // Play tick sound when time is low (every second under 10)
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
  }, [timerStarted, isAnswered, isLoading, showResult, questionsAnswered, config, soundEnabled]);

  const handleTimeUp = () => {
    if (isAnswered) return;
    
    if (soundEnabled) playTimeUpSound();
    setIsAnswered(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimeout(() => {
      const newCount = questionsAnswered + 1;
      setQuestionsAnswered(newCount);

      if (newCount >= TOTAL_QUESTIONS) {
        setShowResult(true);
      } else {
        loadQuestion();
      }
    }, 1500);
  };

  const loadQuestion = useCallback(async () => {
    if (!config) return;
    
    setIsLoading(true);
    setTimeRemaining(config.timer);
    
    try {
      let query = supabase
        .from('quiz_questions')
        .select('id, question, options, category, gems:points')
        .eq('question_type', 'text')
        .limit(20);
      
      if (usedQuestionIds.length > 0) {
        query = query.not('id', 'in', `(${usedQuestionIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        setCurrentQuestion({
          id: 'default-1',
          question: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correct_answer: 'Mars',
          category: 'Science',
          gems: 10
        });
      } else {
        const randomIndex = Math.floor(Math.random() * data.length);
        const q = data[randomIndex];
        const options = Array.isArray(q.options) 
          ? q.options as string[]
          : typeof q.options === 'object' 
            ? Object.values(q.options as object) as string[]
            : ['Option A', 'Option B', 'Option C', 'Option D'];
        
        setCurrentQuestion({
          id: q.id,
          question: q.question,
          options: options,
          category: q.category,
          gems: q.gems || 10
        });
        setUsedQuestionIds(prev => [...prev, q.id]);
      }
    } catch (err) {
      console.error('Error loading question:', err);
      setCurrentQuestion({
        id: 'default-1',
        question: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correct_answer: 'Mars',
        category: 'Science',
        gems: 10
      });
    }
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsLoading(false);
  }, [usedQuestionIds, config]);

  const handleDifficultySelect = (selectedDifficulty: Difficulty) => {
    if (soundEnabled) playSelectSound();
    setDifficulty(selectedDifficulty);
    setTimeRemaining(DIFFICULTY_CONFIG[selectedDifficulty].timer);
  };

  // Load first question when difficulty is selected
  useEffect(() => {
    if (difficulty && !currentQuestion) {
      loadQuestion();
    }
  }, [difficulty]);

  const handleAnswerSelect = async (answer: string) => {
    if (isAnswered || isLoading || !config) return;

    // Start timer on first answer
    if (!timerStarted) {
      setTimerStarted(true);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSelectedAnswer(answer);
    setIsAnswered(true);

    // Validate answer server-side
    let isCorrect = false;
    try {
      const { data, error } = await supabase.functions.invoke('validate-quiz-answer', {
        body: { question_id: currentQuestion?.id, selected_answer: answer }
      });
      if (!error && data) {
        isCorrect = data.is_correct;
        setCurrentQuestion(prev => prev ? { ...prev, correct_answer: data.correct_answer } : prev);
      }
    } catch (err) {
      console.error('Error validating answer:', err);
    }

    if (isCorrect) {
      if (soundEnabled) playCorrectSound();
      setCorrectAnswers(prev => prev + 1);
      const timeBonus = Math.floor(timeRemaining / 10);
      const baseGems = (currentQuestion?.gems || 10) + timeBonus;
      const multipliedGems = Math.round(baseGems * config.multiplier);
      setTotalGems(prev => prev + multipliedGems);
    } else {
      if (soundEnabled) playWrongSound();
    }

    setTimeout(() => {
      const newCount = questionsAnswered + 1;
      setQuestionsAnswered(newCount);

      if (newCount >= TOTAL_QUESTIONS) {
        setShowResult(true);
      } else {
        loadQuestion();
      }
    }, 1500);
  };

  const handlePlayAgain = () => {
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setTotalGems(0);
    setShowResult(false);
    setUsedQuestionIds([]);
    setTimerStarted(false);
    setDifficulty(null);
    setCurrentQuestion(null);
  };

  const handleNewBestIQ = (newIQ: number) => {
    if (!bestIQ || newIQ > bestIQ) {
      setBestIQ(newIQ);
      localStorage.setItem(BEST_IQ_KEY, newIQ.toString());
    }
  };

  const getOptionStyle = (option: string) => {
    if (!isAnswered) {
      return 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer';
    }

    if (option === currentQuestion?.correct_answer) {
      return 'border-accent bg-accent/10';
    }

    if (option === selectedAnswer && option !== currentQuestion?.correct_answer) {
      return 'border-destructive bg-destructive/10';
    }

    return 'border-border opacity-50';
  };

  const getTimerColor = () => {
    if (!config) return 'text-muted-foreground';
    const percentage = timeRemaining / config.timer;
    if (percentage > 0.5) return 'text-accent';
    if (percentage > 0.25) return 'text-[hsl(var(--quiz-gold))]';
    return 'text-destructive animate-pulse';
  };

  // Difficulty selection screen
  if (!difficulty) {
    return (
      <div className="premium-card max-w-md mx-auto lg:mx-0">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Quick IQ Test</h2>
          <p className="text-sm text-muted-foreground">
            Answer {TOTAL_QUESTIONS} questions and discover your Quiz IQ!
          </p>
        </div>

        {/* Best IQ badge */}
        {bestIQ && (
          <div className="flex items-center justify-center gap-2 mb-4 p-2 rounded-lg bg-[hsl(var(--quiz-gold))]/10 border border-[hsl(var(--quiz-gold))]/20">
            <Award className="w-4 h-4 text-[hsl(var(--quiz-gold))]" />
            <span className="text-sm font-medium text-[hsl(var(--quiz-gold))]">
              Your Best IQ: {bestIQ}
            </span>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-center mb-3">Select Difficulty:</p>
          {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, DifficultyConfig][]).map(([key, cfg]) => (
            <Button
              key={key}
              onClick={() => handleDifficultySelect(key)}
              variant="outline"
              className={cn(
                "w-full justify-between p-4 h-auto border-2 hover:border-primary transition-all",
                key === 'medium' && "border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{cfg.icon}</span>
                <div className="text-left">
                  <div className={cn("font-semibold", cfg.color)}>{cfg.label}</div>
                  <div className="text-xs text-muted-foreground">{cfg.timer}s per question</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-primary">{cfg.multiplier}x</div>
                <div className="text-xs text-muted-foreground">gems</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>
      </div>
    );
  }

  if (isLoading && !currentQuestion) {
    return (
      <div className="premium-card max-w-md mx-auto lg:mx-0 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="premium-card max-w-md mx-auto lg:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                {currentQuestion?.category || 'Quiz'}
              </span>
              <span className={cn("text-xs font-semibold", config?.color)}>
                {config?.icon} {config?.label} ({config?.multiplier}x)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Timer */}
            {timerStarted && !isAnswered && (
              <div className={cn("flex items-center gap-1 text-sm font-bold", getTimerColor())}>
                <Clock className="w-4 h-4" />
                <span>{timeRemaining}s</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm font-medium text-accent">
              <Sparkles className="w-4 h-4" />
              <span>+{Math.round((currentQuestion?.gems || 10) * (config?.multiplier || 1))} pts</span>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  i < questionsAnswered
                    ? "bg-accent"
                    : i === questionsAnswered
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            Question {questionsAnswered + 1} of {TOTAL_QUESTIONS}
          </span>
        </div>

        {/* Gems display */}
        {totalGems > 0 && (
          <div className="mb-4 text-sm font-medium text-primary">
            Total: {totalGems} gems
          </div>
        )}

        {/* Question */}
        <div className={cn("transition-opacity duration-300", isLoading && "opacity-50")}>
          <h4 className="text-lg font-semibold mb-4 leading-snug">
            {currentQuestion?.question}
          </h4>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={isAnswered || isLoading}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 text-left",
                  getOptionStyle(option)
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-medium">{option}</span>
                </div>

                {isAnswered && option === currentQuestion?.correct_answer && (
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                )}
                {isAnswered && option === selectedAnswer && option !== currentQuestion?.correct_answer && (
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading next question indicator */}
        {isAnswered && questionsAnswered < TOTAL_QUESTIONS - 1 && (
          <div className="mt-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading next question...
          </div>
        )}
      </div>

      {/* IQ Result Modal */}
      <IQResultModal
        isOpen={showResult}
        correctAnswers={correctAnswers}
        totalQuestions={TOTAL_QUESTIONS}
        totalGems={totalGems}
        bestIQ={bestIQ}
        difficulty={difficulty}
        onPlayAgain={handlePlayAgain}
        onNewBestIQ={handleNewBestIQ}
        soundEnabled={soundEnabled}
      />
    </>
  );
};

export default InteractiveQuizPreview;
