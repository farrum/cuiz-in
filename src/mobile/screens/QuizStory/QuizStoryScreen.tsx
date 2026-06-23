import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, SlidersHorizontal, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { getRandomQuestion, getAvailableCategories, STORAGE_KEYS } from '@/utils/quizData';
import type { QuizQuestion } from '@/utils/types';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { logGemsEarned } from '@/utils/gemsService';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { getMotivationSync } from '@/mobile/hooks/useMotivation';
import { GemCounter } from '@/mobile/components/GemCounter';
import { StreakFlame } from '@/mobile/components/StreakFlame';
import { MascotReveal } from '@/mobile/mascots/MascotReveal';
import { moodEngine, moodToContext } from '@/mobile/mascots/useMoodEngine';
import { cn } from '@/lib/utils';
import { InterstitialAd } from '@/mobile/ads/InterstitialAd';
import { TopBannerAd } from '@/mobile/ads/TopBannerAd';

type Phase = 'loading' | 'asking' | 'revealing' | 'between';

type Difficulty = 'easy' | 'medium' | 'hard';
const PREF_KEY = 'quiz_story_prefs';

export default function QuizStoryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isImageMode = searchParams.get('mode') === 'image' || searchParams.get('type') === 'image';
  const haptics = useHaptics();
  const { streak, questionsAnswered, correctAnswered, incrementStreak, resetStreak, incrementQuestionsAnswered, incrementCorrectAnswered } = usePersistentQuizStats();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [revealReady, setRevealReady] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [sessionGems, setSessionGems] = useState(0);
  const [progress, setProgress] = useState(0);
  const [gems, setGems] = useState<number>(() => Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || 0));
  const advanceTimer = useRef<number | null>(null);
  const progressTimer = useRef<number | null>(null);
  const answerCount = useRef(0);
  const [revealMood, setRevealMood] = useState<import('@/mobile/mascots/registry').Mood>('neutral');
  const motivation = isCorrect == null ? null : getMotivationSync(moodToContext(revealMood));
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [adSeed, setAdSeed] = useState(0);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(() => {
    try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}').category ?? null; } catch { return null; }
  });
  const [difficulty, setDifficulty] = useState<Difficulty | null>(() => {
    try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}').difficulty ?? null; } catch { return null; }
  });

  const categoryRef = useRef(category);
  const difficultyRef = useRef(difficulty);
  categoryRef.current = category;
  difficultyRef.current = difficulty;

  const loadNext = async () => {
    setPhase('loading');
    setSelected(null);
    setIsCorrect(null);
    setRevealReady(false);
    setCorrectAnswer('');
    setExplanation('');
    setProgress(0);
    try {
      const q = await getRandomQuestion({ 
        category: categoryRef.current, 
        difficulty: difficultyRef.current,
        questionType: isImageMode ? 'image' : null
      });
      setQuestion(q);
      setPhase('asking');
    } catch (e) {
      console.error(e);
      setPhase('asking');
    }
  };

  useEffect(() => { loadNext(); /* eslint-disable-next-line */ }, []);

  // Load available categories for the preferences picker
  useEffect(() => {
    getAvailableCategories().then(setCategories).catch(() => {});
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

  // Progress ring while asking — 20s soft timer (no penalty, just nudge)
  useEffect(() => {
    if (phase !== 'asking') return;
    const start = Date.now();
    progressTimer.current = window.setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / 20000) * 100);
      setProgress(p);
    }, 60);
    return () => { if (progressTimer.current) window.clearInterval(progressTimer.current); };
  }, [phase, question?.id]);

  const handleAnswer = async (option: string) => {
    if (phase !== 'asking' || !question) return;
    setSelected(option);
    setPhase('revealing');
    setRevealReady(false);
    const revealStart = Date.now();
    if (progressTimer.current) window.clearInterval(progressTimer.current);

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
      }
    } catch (err) {
      console.error('[QuizStory] validate failed', err);
    }

    // Keep a short suspense window ("Hold on… checking your answer") so the
    // real result is never flashed instantly. Reveal after at least 2.5s.
    const elapsed = Date.now() - revealStart;
    const wait = Math.max(0, 2500 - elapsed);
    advanceTimer.current = window.setTimeout(() => {
      setIsCorrect(correct);
      setCorrectAnswer(serverCorrectAnswer);
      setExplanation(serverExplanation);
      setRevealReady(true);
      incrementQuestionsAnswered();
      // Update the global mood engine and remember the resolved mood for this reveal.
      moodEngine.recordAnswer(correct);
      setRevealMood(moodEngine.snapshot().lastMood);

      // Persist the attempt so profile reports (attempted/correct) populate.
      {
        const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (uid) {
          void supabase.from('quiz_answers').insert({
            user_id: uid,
            question_id: question.id,
            selected_answer: option,
            correct,
            points_earned: correct ? (question.gems || 10) : 0,
          }).then(({ error }) => {
            if (error) console.error('[QuizStory] failed to log answer', error);
          });
        }
      }

      if (correct) {
        haptics('success');
        incrementStreak();
        incrementCorrectAnswered();
        const earned = question.gems || 10;
        setSessionGems((g) => g + earned);
        const next = gems + earned;
        setGems(next);
        localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(next));
        const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (uid) { void logGemsEarned(earned, uid); }
        const burst = moodEngine.snapshot().correctStreak >= 5 ? 200 : moodEngine.snapshot().correctStreak >= 2 ? 130 : 80;
        confetti({ particleCount: burst, spread: 80, origin: { y: 0.4 }, ticks: 140 });
      } else {
        haptics('error');
        resetStreak();
      }

      // After the 5s reveal, show a full-screen ad every 3rd question (more ad
      // views without interrupting every single question), otherwise advance.
      answerCount.current += 1;
      const showAd = answerCount.current % 3 === 0;
      advanceTimer.current = window.setTimeout(() => {
        if (showAd) setShowInterstitial(true);
        else loadNext();
      }, 5000);
    }, wait);
  };

  const closeInterstitial = () => {
    setShowInterstitial(false);
    setAdSeed((s) => s + 1);
    loadNext();
  };

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      if (progressTimer.current) window.clearInterval(progressTimer.current);
    };
  }, []);

  const exit = () => navigate('/hub');

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-background via-background to-primary/10 overflow-hidden">
      {/* Top bar */}
      <div
        className="relative flex items-center justify-between px-4 py-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      >
        <button onClick={exit} aria-label="Close" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <StreakFlame streak={streak} />
          <GemCounter value={gems} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 mx-4 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-purple-500"
          animate={{ width: `${phase === 'asking' ? progress : 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col px-4 pt-6 pb-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {question.category}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {question.difficulty}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Sparkles className="w-3 h-3" /> +{question.gems || 10}
                </span>
              </div>

              {question.imageUrl && (
                <motion.img
                  src={question.imageUrl}
                  alt=""
                  className="w-full max-h-64 object-cover rounded-2xl mb-4 shadow-md"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                />
              )}

              <h2 className="text-2xl font-bold leading-snug mb-6">{question.question}</h2>

              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  const isSelected = selected === opt;
                  const isReveal = phase === 'revealing' && correctAnswer;
                  const isThisCorrect = isReveal && opt === correctAnswer;
                  const isThisWrong = isReveal && isSelected && !isCorrect;
                  return (
                    <motion.button
                      key={opt}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      whileTap={{ scale: phase === 'asking' ? 0.97 : 1 }}
                      disabled={phase !== 'asking'}
                      onClick={() => handleAnswer(opt)}
                      className={cn(
                        'w-full text-left rounded-2xl px-4 py-4 font-semibold border-2 transition-all',
                        'bg-card border-border',
                        isSelected && phase === 'revealing' && !isCorrect && 'border-destructive bg-destructive/10',
                        isThisCorrect && 'border-emerald-500 bg-emerald-500/10',
                        isThisWrong && 'border-destructive bg-destructive/10 animate-[shake_0.4s]',
                      )}
                    >
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold mr-3">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </motion.button>
                  );
                })}
              </div>

              {/* Reveal panel */}
              <div className="mt-6">
                {/* Suspense while we check the answer */}
                <AnimatePresence>
                  {phase === 'revealing' && !revealReady && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-4"
                    >
                      <span className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      </span>
                      <span className="text-sm font-semibold">
                        Hold on… are you sure? Checking your answer 🤔
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <MascotReveal
                  show={phase === 'revealing' && revealReady}
                  mood={revealMood}
                  message={motivation?.text}
                  emoji={motivation?.emoji}
                  headline={
                    isCorrect
                      ? `+${question.gems || 10} gems!`
                      : revealMood === 'angry' ? 'Argh!' : revealMood === 'upset' ? 'Hmm…' : 'Not quite.'
                  }
                  headlineClass={isCorrect ? 'text-emerald-600' : 'text-destructive'}
                  explanation={explanation}
                  size={92}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rotating banner ad */}
      <TopBannerAd />

      {/* Preferences button */}
      <div className="px-4 pt-2">
        <button
          onClick={() => setPrefsOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {category || 'All categories'} · {difficulty ? difficulty[0].toUpperCase() + difficulty.slice(1) : 'Any level'}
        </button>
      </div>

      {/* Session summary footer */}
      <div
        className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Today: <strong className="text-foreground">{questionsAnswered}</strong> attempted · <strong className="text-emerald-600">{correctAnswered}</strong> correct</span>
          <span>Session: <strong className="text-amber-600">+{sessionGems} 💎</strong></span>
          <button onClick={loadNext} className="text-primary font-semibold">Skip →</button>
        </div>
      </div>

      <InterstitialAd open={showInterstitial} onClose={closeInterstitial} skipSeconds={5} seed={adSeed} />

      {/* Preferences sheet */}
      <AnimatePresence>
        {prefsOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPrefsOpen(false)}
          >
            <motion.div
              className="bg-background rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Quiz preferences</h3>
                <button onClick={() => setPrefsOpen(false)} aria-label="Close" className="p-1.5 rounded-full hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Difficulty</p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {([null, 'easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d ?? 'any'}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      'rounded-xl px-3 py-2 text-sm font-semibold border-2 capitalize transition-colors',
                      difficulty === d ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card',
                    )}
                  >
                    {d ?? 'Any'}
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Category</p>
              <div className="space-y-2 mb-5">
                <button
                  onClick={() => setCategory(null)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold border-2 transition-colors',
                    category === null ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card',
                  )}
                >
                  All categories
                  {category === null && <Check className="w-4 h-4" />}
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold border-2 transition-colors',
                      category === c ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card',
                    )}
                  >
                    {c}
                    {category === c && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              <button
                onClick={() => applyPrefs(category, difficulty)}
                className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-3.5 text-sm"
              >
                Apply &amp; continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}