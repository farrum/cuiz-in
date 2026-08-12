import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, SlidersHorizontal, Check, Shield, Scroll } from 'lucide-react';
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
  const mountedRef = useRef(true);
  const [loadError, setLoadError] = useState(false);
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

  const clearTimers = () => {
    if (advanceTimer.current) { window.clearTimeout(advanceTimer.current); advanceTimer.current = null; }
    if (progressTimer.current) { window.clearInterval(progressTimer.current); progressTimer.current = null; }
  };

  const loadNext = async () => {
    // Any pending reveal/advance timer from the previous question must die,
    // otherwise rapid taps or a preference change double-advance the flow.
    clearTimers();
    setLoadError(false);
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
      if (!mountedRef.current) return;
      if (!q) {
        setLoadError(true);
        setPhase('loading');
        return;
      }
      setQuestion(q);
      setPhase('asking');
    } catch (e) {
      console.error('[QuizStory] failed to load question', e);
      if (!mountedRef.current) return;
      setLoadError(true);
      setPhase('loading');
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

      // After the 10s reveal, show a full-screen ad every 2nd question (more ad
      // views without interrupting every single question), otherwise advance.
      answerCount.current += 1;
      const showAd = answerCount.current % 2 === 0;
      advanceTimer.current = window.setTimeout(() => {
        if (showAd) setShowInterstitial(true);
        else loadNext();
      }, 10000);
    }, wait);
  };

  const closeInterstitial = () => {
    setShowInterstitial(false);
    setAdSeed((s) => s + 1);
    loadNext();
  };

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearTimers();
    };
  }, []);

  const exit = () => navigate('/hub');

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Top bar */}
      <div
        className="relative flex items-center justify-between px-4 py-2 bg-white panel-3d mx-4 mt-2 rounded-2xl border-2 border-primary/20"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      >
        <button onClick={exit} aria-label="Close" className="p-2 -ml-2 rounded-xl hover:bg-muted">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <StreakFlame streak={streak} />
          <GemCounter value={gems} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 mx-6 mt-4 rounded-full overflow-hidden bg-muted border border-muted-foreground/20">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${phase === 'asking' ? progress : 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col px-4 pt-4 pb-6 overflow-y-auto">
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
              <div className="mb-4 flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest font-black px-2.5 py-1 rounded-lg bg-primary/10 text-primary border-2 border-primary/20">
                  <Shield className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />{question.category}
                </span>
                <span className="text-[11px] uppercase tracking-widest font-black px-2 py-1 rounded-lg bg-secondary/10 text-secondary border-2 border-secondary/20">
                  {question.difficulty}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-[13px] font-black text-primary">
                  <Sparkles className="w-4 h-4 fill-primary" /> +{question.gems || 10}
                </span>
              </div>

              {question.imageUrl && (
                <motion.img
                  src={question.imageUrl}
                  alt=""
                  className="w-full max-h-64 object-cover rounded-2xl mb-4 shadow-md iron-frame"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                />
              )}

              <h2 className="text-xl font-black leading-snug mb-5 text-foreground tracking-tight">{question.question}</h2>

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
                        'w-full text-left rounded-2xl px-4 py-4 font-black transition-all panel-3d text-foreground border-2',
                        !isSelected && !isThisCorrect && !isThisWrong && 'bg-white border-muted-foreground/10',
                        isSelected && phase === 'revealing' && !isCorrect && 'border-destructive bg-destructive/10 text-destructive',
                        isThisCorrect && 'border-emerald-500 bg-emerald-500/10 text-emerald-600',
                        isThisWrong && 'border-destructive bg-destructive/10 text-destructive animate-[shake_0.4s]',
                      )}
                    >
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-[13px] font-black mr-3 shadow-sm bg-muted text-muted-foreground border-2 border-white">
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
                      className="flex items-center gap-3 rounded-2xl px-4 py-4 panel-3d bg-white"
                    >
                      <Scroll className="w-6 h-6 text-primary animate-pulse flex-shrink-0" />
                      <span className="text-sm font-black text-foreground tracking-tight">
                        Reviewing your answer…
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
          className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-black panel-3d bg-white text-muted-foreground hover:bg-muted transition-colors border-2 border-muted-foreground/20 uppercase tracking-wide"
        >
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          {category || 'All realms'} · {difficulty ? difficulty[0].toUpperCase() + difficulty.slice(1) : 'Any trial'}
        </button>
      </div>

      {/* Session summary footer */}
      <div
        className="px-4 py-3 panel-3d bg-white mx-4 mb-2 rounded-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-black uppercase tracking-wider">
          <span><strong className="text-foreground text-[13px]">{questionsAnswered}</strong> BATTLES · <strong className="text-emerald-500 text-[13px]">{correctAnswered}</strong> WINS</span>
          <span>SPOILS: <strong className="text-primary text-[13px]">+{sessionGems} 💎</strong></span>
          <button onClick={loadNext} className="text-primary font-black uppercase tracking-widest text-[11px] hover:underline">Skip →</button>
        </div>
      </div>

      <InterstitialAd open={showInterstitial} onClose={closeInterstitial} skipSeconds={10} seed={adSeed} />

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
              className="bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto border-t-2 border-primary/20"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-primary tracking-tight">Quest Preferences</h3>
                <button onClick={() => setPrefsOpen(false)} aria-label="Close" className="p-1.5 rounded-xl hover:bg-muted">
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2">Trial Difficulty</p>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {([null, 'easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d ?? 'any'}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      'rounded-xl px-3 py-2 text-[12px] font-black capitalize transition-colors panel-3d border-2',
                      difficulty === d ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-muted-foreground/20 text-muted-foreground',
                    )}
                  >
                    {d ?? 'Any'}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2">Knowledge Realm</p>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setCategory(null)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-black transition-colors panel-3d border-2',
                    category === null ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-muted-foreground/20 text-muted-foreground',
                  )}
                >
                  All realms
                  {category === null && <Check className="w-5 h-5 text-primary" />}
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-black transition-colors panel-3d border-2',
                      category === c ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-muted-foreground/20 text-muted-foreground',
                    )}
                  >
                    {c}
                    {category === c && <Check className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>

              <button
                onClick={() => applyPrefs(category, difficulty)}
                className="w-full rounded-2xl py-3.5 text-sm btn-3d btn-3d-primary uppercase"
              >
                ⚔️ Apply &amp; March On
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}