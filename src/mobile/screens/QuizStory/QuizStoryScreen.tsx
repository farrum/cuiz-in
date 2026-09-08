import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  SlidersHorizontal,
  Check,
  Shield,
  Scroll,
  Crown,
  Flame,
  ArrowRight,
  Trophy,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getRandomQuestion, getAvailableCategories, STORAGE_KEYS } from '@/utils/quizData';
import type { QuizQuestion } from '@/utils/types';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { logGemsEarned } from '@/utils/gemsService';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { GemCounter } from '@/mobile/components/GemCounter';
import { StreakFlame } from '@/mobile/components/StreakFlame';
import { MascotReveal } from '@/mobile/mascots/MascotReveal';
import { moodEngine } from '@/mobile/mascots/useMoodEngine';
import { Mascot } from '@/mobile/components/Mascot';
import { NativeBannerAd } from '@/mobile/ads/NativeBannerAd';
import { showRewarded } from '@/mobile/ads/adManager';
import { Capacitor } from '@capacitor/core';
import { asUuidOrNull } from '@/utils/uuid';
import { cn } from '@/lib/utils';

type Phase = 'loading' | 'asking' | 'checking' | 'revealing';
type Difficulty = 'easy' | 'medium' | 'hard';
const PREF_KEY = 'quiz_story_prefs';

export default function QuizStoryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const haptics = useHaptics();
  const { toast } = useToast();

  const isDailyMode = searchParams.get('mode') === 'daily';
  const queryCategory = searchParams.get('category');
  const isImageMode = searchParams.get('type') === 'image';

  // Stats
  const {
    streak,
    questionsAnswered,
    correctAnswered,
    incrementStreak,
    resetStreak,
    incrementQuestionsAnswered,
    incrementCorrectAnswered,
  } = usePersistentQuizStats();

  // Core quiz state
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [sessionGems, setSessionGems] = useState(0);
  const [gems, setGems] = useState<number>(() => Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || 0));

  // Daily challenge progress (1 to 5)
  const [dailyStep, setDailyStep] = useState(1);
  const [dailyComplete, setDailyComplete] = useState(false);

  // Animations & visuals
  const [floatReward, setFloatReward] = useState<number | null>(null);
  const [shakeOpt, setShakeOpt] = useState<string | null>(null);
  const [pulseOpt, setPulseOpt] = useState<string | null>(null);
  const [revealMood, setRevealMood] = useState<import('@/mobile/mascots/registry').Mood>('neutral');
  const [loadError, setLoadError] = useState(false);

  // Modals & UI
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [exitSummaryOpen, setExitSummaryOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [doubleGemsAdShowing, setDoubleGemsAdShowing] = useState(false);

  // Preferences
  const [category, setCategory] = useState<string | null>(() => {
    if (queryCategory) return queryCategory;
    try {
      return JSON.parse(localStorage.getItem(PREF_KEY) || '{}').category ?? null;
    } catch {
      return null;
    }
  });
  const [difficulty, setDifficulty] = useState<Difficulty | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(PREF_KEY) || '{}').difficulty ?? null;
    } catch {
      return null;
    }
  });

  const categoryRef = useRef(category);
  const difficultyRef = useRef(difficulty);
  categoryRef.current = category;
  difficultyRef.current = difficulty;

  const advanceTimer = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const loadingNextRef = useRef(false);

  const clearTimers = () => {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };

  const loadNext = async () => {
    if (loadingNextRef.current) return;
    loadingNextRef.current = true;
    clearTimers();
    setLoadError(false);

    // If daily challenge reached 5 questions and completed
    if (isDailyMode && dailyStep > 5) {
      setDailyComplete(true);
      loadingNextRef.current = false;
      return;
    }

    setPhase('loading');
    setSelected(null);
    setIsCorrect(null);
    setCorrectAnswer('');
    setExplanation('');

    try {
      const q = await getRandomQuestion({
        category: categoryRef.current,
        difficulty: difficultyRef.current,
        questionType: isImageMode ? 'image' : null,
      });

      if (!mountedRef.current) return;
      if (!q) {
        setLoadError(true);
        setPhase('loading');
        return;
      }
      setQuestion(q);
      setPhase('asking');
    } catch (e) {
      console.warn('[QuizStory] Question load error:', e);
      if (mountedRef.current) {
        setLoadError(true);
        setPhase('loading');
      }
    } finally {
      loadingNextRef.current = false;
    }
  };

  useEffect(() => {
    loadNext();
    getAvailableCategories().then(setCategories).catch(() => {});
    return () => {
      mountedRef.current = false;
      clearTimers();
    };
  }, []);

  const applyPrefs = (nextCategory: string | null, nextDifficulty: Difficulty | null) => {
    setCategory(nextCategory);
    setDifficulty(nextDifficulty);
    categoryRef.current = nextCategory;
    difficultyRef.current = nextDifficulty;
    localStorage.setItem(PREF_KEY, JSON.stringify({ category: nextCategory, difficulty: nextDifficulty }));
    setPrefsOpen(false);
    loadNext();
  };

  const handleAnswer = async (option: string) => {
    if (phase !== 'asking' || !question) return;

    setSelected(option);
    setPhase('checking');
    haptics('light');

    let correct = false;
    let serverCorrectAnswer = '';
    let serverExplanation = '';

    try {
      const { data, error } = await supabase.functions.invoke('validate-quiz-answer', {
        body: { question_id: question.id, selected_answer: option },
      });
      if (!error && data) {
        correct = !!data.is_correct;
        serverCorrectAnswer = data.correct_answer || '';
        serverExplanation = data.explanation || '';
      } else {
        // Fallback: local check if server check fails
        correct = (question.options || [])[0] === option;
        serverCorrectAnswer = (question.options || [])[0];
      }
    } catch {
      correct = (question.options || [])[0] === option;
      serverCorrectAnswer = (question.options || [])[0];
    }

    // Fast, responsive 650ms check
    window.setTimeout(() => {
      if (!mountedRef.current) return;

      setIsCorrect(correct);
      setCorrectAnswer(serverCorrectAnswer);
      setExplanation(serverExplanation);
      setPhase('revealing');

      incrementQuestionsAnswered();
      moodEngine.recordAnswer(correct);
      setRevealMood(moodEngine.snapshot().lastMood);

      // Multiplier: 2x for Daily Challenge
      const baseGems = question.gems || 10;
      const multiplier = isDailyMode ? 2 : 1;
      const earned = correct ? baseGems * multiplier : 0;

      if (correct) {
        haptics('success');
        incrementStreak();
        incrementCorrectAnswered();
        setSessionGems((g) => g + earned);
        const nextGems = gems + earned;
        setGems(nextGems);
        localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(nextGems));

        const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (uid) {
          void logGemsEarned(earned, uid);
        }

        setFloatReward(earned);
        setTimeout(() => setFloatReward(null), 1100);
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.45 }, ticks: 120 });
        setPulseOpt(option);
        setTimeout(() => setPulseOpt(null), 700);
      } else {
        haptics('error');
        resetStreak();
        setShakeOpt(option);
        setTimeout(() => setShakeOpt(null), 500);
      }

      // Record answer attempt in DB
      const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (uid) {
        void supabase.from('quiz_answers').insert({
          user_id: uid,
          question_id: asUuidOrNull(question.id),
          selected_answer: option,
          correct,
          points_earned: earned,
        });
      }

      // Smooth auto-advance after 3.2s so the user can read the explanation,
      // or tap "Next Trial ⚔️" immediately
      advanceTimer.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        handleManualAdvance();
      }, 3200);
    }, 650);
  };

  const handleManualAdvance = () => {
    clearTimers();
    if (isDailyMode) {
      if (dailyStep >= 5) {
        // Daily Challenge complete!
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`daily_challenge_completed_${today}`, 'true');
        const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (uid) {
          // Log challenge completion
          void supabase.from('user_challenge_progress').upsert(
            {
              user_id: uid,
              challenge_id: 'daily-' + today,
              completed: true,
              completed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,challenge_id' },
          );
        }
        setDailyComplete(true);
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.4 } });
        haptics('success');
      } else {
        setDailyStep((s) => s + 1);
        loadNext();
      }
    } else {
      loadNext();
    }
  };

  const exitQuiz = () => {
    if (sessionGems > 0 && !dailyComplete) {
      setExitSummaryOpen(true);
    } else {
      navigate('/hub');
    }
  };

  const handleDoubleGems = async () => {
    setDoubleGemsAdShowing(true);
    try {
      const res = await showRewarded(2500);
      if (res.rewarded) {
        const bonus = sessionGems;
        const newTotal = gems + bonus;
        setGems(newTotal);
        localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(newTotal));
        const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (uid) void logGemsEarned(bonus, uid);
        toast({ title: '👑 Royal Bonus!', description: `Gems doubled! Added +${bonus} gems to your treasury.` });
      }
    } catch {
      // Move ahead cleanly if ad is unavailable
    } finally {
      setDoubleGemsAdShowing(false);
      navigate('/hub');
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--shell-bg, hsl(38 65% 94%))',
        paddingTop: 'var(--safe-top, 0px)',
      }}
    >
      {/* ── Top Header Bar ───────────────────────────────────────────── */}
      <header className="relative z-20 px-3 pt-2 pb-1.5 flex items-center justify-between">
        <button
          onClick={exitQuiz}
          aria-label="Close"
          className="p-2 rounded-xl bg-amber-900/5 hover:bg-amber-900/10 active:scale-95 transition-all text-amber-900"
          style={{ border: '1px solid rgba(180,140,60,0.25)' }}
        >
          <X className="w-5 h-5 text-amber-900/80" />
        </button>

        {/* Center Mode / Progress Banner */}
        <div className="flex flex-col items-center">
          {isDailyMode ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
              <Crown className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-[11px] font-black tracking-wide text-amber-900 uppercase font-serif">
                Decree {dailyStep} of 5
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-600 text-white">
                2× GEMS
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-900/70 font-serif">
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>{category || 'Royal Keep Quiz'}</span>
            </div>
          )}
        </div>

        {/* Right Counters */}
        <div className="flex items-center gap-2">
          <StreakFlame streak={streak} />
          <GemCounter value={gems} />
        </div>
      </header>

      {/* Daily Progress Dots */}
      {isDailyMode && (
        <div className="px-6 py-1.5 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                step === dailyStep
                  ? 'w-8 bg-amber-600 shadow-sm'
                  : step < dailyStep
                  ? 'w-4 bg-amber-700/60'
                  : 'w-4 bg-amber-900/15',
              )}
            />
          ))}
        </div>
      )}

      {/* Floating Gem Award Popup */}
      <AnimatePresence>
        {floatReward !== null && (
          <motion.div
            key="float-reward"
            className="absolute left-1/2 -translate-x-1/2 top-16 z-50 pointer-events-none"
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span
              className="text-base font-black px-4 py-1.5 rounded-full shadow-lg text-amber-950 flex items-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, hsl(45 95% 65%), hsl(35 90% 50%))',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 4px 14px rgba(180,120,20,0.3)',
              }}
            >
              💎 +{floatReward} Gems!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Scroll Area ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col justify-between">
        {/* Daily Completion Victory Screen */}
        {dailyComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-auto flex flex-col items-center text-center p-6 rounded-3xl"
            style={{
              background: 'linear-gradient(145deg, hsl(40 70% 97%) 0%, hsl(36 55% 93%) 100%)',
              border: '1px solid rgba(180,140,60,0.3)',
              boxShadow: '0 8px 24px rgba(120,80,20,0.12)',
            }}
          >
            <Mascot mood="celebrating" size={110} className="mb-4" />
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 text-xs font-black uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4 text-amber-600" /> Royal Decree Accomplished!
            </div>
            <h2 className="text-2xl font-black text-amber-950 font-serif mb-2">
              Glory to the Realm!
            </h2>
            <p className="text-xs text-amber-900/70 font-semibold mb-6 max-w-xs leading-relaxed">
              You conquered today's royal challenge! Your streak stands unblemished, and your treasury swells with double riches.
            </p>

            <div className="w-full p-4 rounded-2xl bg-amber-900/5 border border-amber-700/15 mb-6 flex items-center justify-around">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800/60 block">Earned</span>
                <span className="text-lg font-black text-amber-950">💎 +{sessionGems}</span>
              </div>
              <div className="h-8 w-px bg-amber-700/20" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800/60 block">Multiplier</span>
                <span className="text-lg font-black text-amber-700">2× Active</span>
              </div>
              <div className="h-8 w-px bg-amber-700/20" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800/60 block">Streak</span>
                <span className="text-lg font-black text-orange-600">🔥 {streak}</span>
              </div>
            </div>

            <Button
              onClick={() => navigate('/hub')}
              className="w-full py-6 font-black uppercase text-sm rounded-2xl text-white shadow-md active:scale-[0.98] transition-all"
              style={{
                background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                boxShadow: '0 4px 0 hsl(30 80% 35%)',
              }}
            >
              👑 Return to the Keep
            </Button>
          </motion.div>
        ) : loadError ? (
          <div className="my-auto flex flex-col items-center justify-center text-center p-6">
            <p className="text-sm font-bold text-amber-900 mb-1">Could not fetch question</p>
            <p className="text-xs text-amber-800/60 mb-4">Please check your connection and try again.</p>
            <button
              onClick={loadNext}
              className="px-5 py-2.5 rounded-xl font-black text-xs uppercase bg-amber-600 text-white shadow-md active:scale-95 transition-all"
            >
              Retry Trial
            </button>
          </div>
        ) : question ? (
          <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full">
            {/* Question Card */}
            <div
              className="rounded-3xl p-5 mb-4 relative"
              style={{
                background: 'linear-gradient(145deg, hsl(40 70% 97%) 0%, hsl(36 55% 93%) 100%)',
                border: '1px solid rgba(180,140,60,0.25)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 16px rgba(120,80,20,0.08)',
              }}
            >
              {/* Question Meta Tags */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/25">
                    <Shield className="w-3 h-3 text-amber-700" />
                    {question.category}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-900/5 text-amber-800/70 border border-amber-900/10">
                    {question.difficulty}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/25">
                  <Sparkles className="w-3 h-3" />
                  +{isDailyMode ? (question.gems || 10) * 2 : question.gems || 10}
                </span>
              </div>

              {/* Optional Question Image */}
              {question.imageUrl && (
                <img
                  src={question.imageUrl}
                  alt=""
                  loading="lazy"
                  className="w-full max-h-48 object-cover rounded-2xl mb-3 shadow-md border border-amber-700/20"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}

              {/* Question Text */}
              <h2 className="text-[17px] font-black leading-snug text-amber-950 tracking-tight font-serif">
                {question.question}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5 mb-4">
              {(question.options || []).map((opt, i) => {
                const isSelected = selected === opt;
                const isReveal = phase === 'revealing' && correctAnswer;
                const isThisCorrect = isReveal && opt === correctAnswer;
                const isThisWrong = isReveal && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: phase === 'asking' ? 0.98 : 1 }}
                    disabled={phase !== 'asking'}
                    onClick={() => handleAnswer(opt)}
                    className={cn(
                      'relative w-full text-left rounded-2xl px-4 py-3.5 font-bold text-[14px] leading-snug transition-all flex items-center overflow-hidden',
                      'border',
                      !isSelected && !isThisCorrect && !isThisWrong &&
                        'bg-white/85 text-amber-950 hover:bg-white border-amber-800/15 shadow-sm',
                      isSelected && phase === 'checking' &&
                        'bg-amber-100 border-amber-600 text-amber-950 font-black shadow-md',
                      isThisCorrect &&
                        'bg-emerald-50/95 border-emerald-600 text-emerald-950 font-black shadow-md ring-2 ring-emerald-500/30',
                      isThisWrong &&
                        'bg-rose-50/95 border-rose-600 text-rose-950 font-black shadow-md ring-2 ring-rose-500/30',
                      opt === shakeOpt && 'animate-shake',
                      opt === pulseOpt && 'animate-pulse',
                    )}
                  >
                    {/* Letter badge (A, B, C, D) */}
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-black mr-3 shrink-0 border',
                        isThisCorrect
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : isThisWrong
                          ? 'bg-rose-600 text-white border-rose-700'
                          : isSelected
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-amber-100/70 text-amber-900 border-amber-300/60',
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>

                    <span className="flex-1 min-w-0 pr-2">{opt}</span>

                    {/* Check / Cross status icon */}
                    {isThisCorrect && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback & Mascot Reveal or Checking Status */}
            <div className="min-h-[90px] mb-3">
              {phase === 'checking' && (
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-black uppercase tracking-wider">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  Verifying decree with the royal archives...
                </div>
              )}

              {phase === 'revealing' && (
                <MascotReveal
                  show={true}
                  mood={revealMood}
                  headline={isCorrect ? `+${isDailyMode ? (question.gems || 10) * 2 : question.gems || 10} Gems!` : 'Not quite!'}
                  headlineClass={isCorrect ? 'text-emerald-700 font-serif' : 'text-rose-700 font-serif'}
                  explanation={explanation}
                  size={84}
                />
              )}
            </div>

            {/* Next Question Control Button */}
            {phase === 'revealing' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2"
              >
                <Button
                  onClick={handleManualAdvance}
                  className="w-full py-6 font-black uppercase text-sm rounded-2xl text-white shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  style={{
                    background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                    boxShadow: '0 4px 0 hsl(30 80% 35%)',
                  }}
                >
                  <span>{isDailyMode && dailyStep >= 5 ? 'Crown Victory 👑' : 'Next Trial ⚔️'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Footer: Realm Preferences Pill ──────────────────────────── */}
      {!dailyComplete && !isDailyMode && (
        <div className="px-4 pb-1 z-10">
          <button
            onClick={() => setPrefsOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-[11px] font-black uppercase tracking-wider text-amber-900/70 bg-amber-900/5 hover:bg-amber-900/10 border border-amber-900/10 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
            {category || 'All Realms'} · {difficulty ? difficulty.toUpperCase() : 'Any Difficulty'}
          </button>
        </div>
      )}

      {/* Fixed bottom banner ad spacer */}
      <NativeBannerAd noMargin />

      {/* ── Preferences Bottom Sheet ─────────────────────────────────── */}
      <AnimatePresence>
        {prefsOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPrefsOpen(false)}
          >
            <motion.div
              className="rounded-t-3xl p-5 max-h-[75vh] overflow-y-auto"
              style={{
                backgroundColor: 'var(--shell-bg, hsl(38 65% 94%))',
                borderTop: '2px solid rgba(180,140,60,0.3)',
                boxShadow: '0 -8px 24px rgba(0,0,0,0.15)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-amber-950 font-serif tracking-tight">
                  Knowledge Realms & Trials
                </h3>
                <button
                  onClick={() => setPrefsOpen(false)}
                  className="p-1.5 rounded-xl bg-amber-900/10 text-amber-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Difficulty */}
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-800/60 mb-2">
                Trial Difficulty
              </p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {([null, 'easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d ?? 'any'}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      'rounded-xl py-2 px-1 text-xs font-black capitalize transition-all border',
                      difficulty === d
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                        : 'bg-white/80 text-amber-900 border-amber-900/15',
                    )}
                  >
                    {d ?? 'Any'}
                  </button>
                ))}
              </div>

              {/* Realms */}
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-800/60 mb-2">
                Realm of Study
              </p>
              <div className="space-y-2 mb-5">
                <button
                  onClick={() => setCategory(null)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-black border transition-colors',
                    category === null
                      ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                      : 'bg-white/80 text-amber-900 border-amber-900/15',
                  )}
                >
                  <span>All Knowledge Realms</span>
                  {category === null && <Check className="w-4 h-4" />}
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-black border transition-colors',
                      category === c
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                        : 'bg-white/80 text-amber-900 border-amber-900/15',
                    )}
                  >
                    <span>{c}</span>
                    {category === c && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => applyPrefs(category, difficulty)}
                className="w-full py-5 font-black uppercase text-xs rounded-xl text-white shadow-md"
                style={{
                  background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                  boxShadow: '0 3px 0 hsl(30 80% 35%)',
                }}
              >
                ⚔️ Apply & March On
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exit Session Summary Modal ───────────────────────────────── */}
      <AnimatePresence>
        {exitSummaryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="w-full max-w-sm rounded-3xl p-6 text-center"
              style={{
                backgroundColor: 'var(--shell-bg, hsl(38 65% 94%))',
                border: '1px solid rgba(180,140,60,0.3)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
              }}
            >
              <Mascot mood="cheer" size={80} className="mx-auto mb-3" />
              <h3 className="text-xl font-black text-amber-950 font-serif mb-1">
                Trial Concluded
              </h3>
              <p className="text-xs text-amber-900/70 font-semibold mb-5">
                You gathered <strong className="text-amber-700">+{sessionGems} gems</strong> during this expedition.
              </p>

              <div className="space-y-2.5 mb-2">
                {sessionGems > 0 && Capacitor.isNativePlatform() && (
                  <Button
                    disabled={doubleGemsAdShowing}
                    onClick={handleDoubleGems}
                    className="w-full py-5 text-xs font-black uppercase rounded-2xl text-white shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                      boxShadow: '0 3px 0 hsl(30 80% 35%)',
                    }}
                  >
                    {doubleGemsAdShowing ? 'Preparing Scroll...' : `📜 Watch Scroll to Double (+${sessionGems * 2} Gems)`}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={() => navigate('/hub')}
                  className="w-full py-4 text-xs font-black uppercase text-amber-900/70 hover:text-amber-950"
                >
                  Claim Riches & Return
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}