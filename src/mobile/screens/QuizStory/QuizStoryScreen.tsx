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
/* TopBannerAd intentionally NOT imported here — the persistent banner is already
   managed by BannerHost in AppMobile. Mounting it again caused a double-banner
   on native and a flash on every question transition. */

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
  // Full-screen ads are capped by time as well as by question count: back-to-back
  // interstitials pile up native ad memory and were crashing the app mid-session.
  const lastAdAt = useRef(0);
  const AD_COOLDOWN_MS = 90_000;
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
      if (!mountedRef.current) return;
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
      const showAd =
        answerCount.current % 2 === 0 && Date.now() - lastAdAt.current > AD_COOLDOWN_MS;
      advanceTimer.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        if (showAd) { lastAdAt.current = Date.now(); setShowInterstitial(true); }
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
    // Safe-area padding on the OUTER wrapper — this is the correct place.
    // Applying it to an inner element only grows that element's internal padding
    // but doesn't move content below the physical status bar.
    <div
      className="fixed inset-0 flex flex-col bg-background overflow-hidden"
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      {/* Ambient background — static gradient, zero GPU cost */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(150deg, hsl(38 60% 93%) 0%, hsl(200 40% 92%) 100%)' }}
      />

      {/* Top bar — safe-area handled by outer wrapper */}
      <div className="relative flex items-center justify-between px-4 py-2.5 mx-3 mt-2 rounded-2xl bg-white/85 ring-1 ring-black/[0.06] shadow-sm">
        <button onClick={exit} aria-label="Close" className="p-2 -ml-1.5 rounded-xl hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <StreakFlame streak={streak} />
          <GemCounter value={gems} />
        </div>
      </div>

      {/* Session progress bar */}
      <div className="h-1.5 mx-5 mt-3 rounded-full overflow-hidden bg-slate-100">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, hsl(45 95% 55%), hsl(30 90% 50%))' }}
          animate={{ width: `${phase === 'asking' ? progress : 100}%` }}
          transition={{ duration: 0.12 }}
        />
      </div>

      {/* Question scroll area — bottom clearance uses CSS contract variable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 6px)' }}>
        {loadError && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-bold text-foreground">Couldn't load a question</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Check your connection and try again.
            </p>
            <button
              onClick={() => loadNext()}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground"
            >
              Retry
            </button>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {question && !loadError && (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="w-full flex flex-col"
            >
              {/* Category + Difficulty + Gems row */}
              <div className="mb-4 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  <Shield className="w-3 h-3" />{question.category}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {question.difficulty}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                  <Sparkles className="w-3.5 h-3.5" /> +{question.gems || 10}
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

              <h2 className="text-[18px] font-black leading-snug mb-5 tracking-tight" style={{ color: 'hsl(220 50% 15%)' }}>{question.question}</h2>

              <div className="space-y-2.5">
                {(question.options || []).map((opt, i) => {
                  const isSelected = selected === opt;
                  const isReveal = phase === 'revealing' && correctAnswer;
                  const isThisCorrect = isReveal && opt === correctAnswer;
                  const isThisWrong = isReveal && isSelected && !isCorrect;
                  return (
                    <motion.button
                      key={opt}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.07 * i, ease: [0.22, 1, 0.36, 1] }}
                      whileTap={{ scale: phase === 'asking' ? 0.975 : 1 }}
                      disabled={phase !== 'asking'}
                      onClick={() => handleAnswer(opt)}
                      className={cn(
                        'relative w-full text-left rounded-2xl px-4 py-3.5 font-bold text-[14px] leading-snug transition-colors overflow-hidden',
                        'ring-1 bg-white',
                        !isSelected && !isThisCorrect && !isThisWrong && 'ring-black/[0.06] text-slate-800 hover:bg-slate-50',
                        isThisCorrect  && 'ring-emerald-400 bg-emerald-50 text-emerald-800',
                        isThisWrong    && 'ring-rose-400 bg-rose-50 text-rose-800 animate-[shake_0.4s]',
                        isSelected && phase === 'revealing' && !isCorrect && 'ring-rose-400 bg-rose-50 text-rose-800',
                      )}
                    >
                      {/* Left colour bar — reveals on answer */}
                      <span className={cn(
                        'absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all',
                        isThisCorrect ? 'bg-emerald-500' : isThisWrong ? 'bg-rose-500' : 'bg-transparent'
                      )} />
                      <span className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-xl text-[12px] font-black mr-3 shrink-0 align-middle border',
                        isThisCorrect ? 'bg-emerald-500 text-white border-emerald-600'
                          : isThisWrong ? 'bg-rose-500 text-white border-rose-600'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      )}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-5">
                <AnimatePresence>
                  {phase === 'revealing' && !revealReady && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-white/80 ring-1 ring-black/[0.06]"
                    >
                      <Scroll className="w-5 h-5 text-amber-500 animate-pulse flex-shrink-0" />
                      <span className="text-sm font-bold text-slate-600">Reviewing your answer…</span>
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

      {/* The persistent native banner (BannerHost) sits between MobileShell's
          TopBannerAd and BottomTabs — DO NOT mount another TopBannerAd here.
          Spacer ensures scroll content is never hidden behind the banner. */}
      <div aria-hidden className="h-[var(--banner-h)] shrink-0" />

      {/* Preferences button — floating pill */}
      <div className="px-4 pt-2">
        <button
          onClick={() => setPrefsOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] font-black bg-white/80 ring-1 ring-black/[0.06] text-slate-600 hover:bg-white transition-colors uppercase tracking-wide"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          {category || 'All realms'} · {difficulty ? difficulty[0].toUpperCase() + difficulty.slice(1) : 'Any trial'}
        </button>
      </div>

      {/* Session summary footer */}
      <div className="px-4 py-2.5 mx-3 mb-2 rounded-2xl bg-white/80 ring-1 ring-black/[0.06]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black tabular-nums px-2 py-1 rounded-full bg-slate-100 text-slate-600">{questionsAnswered} battles</span>
            <span className="text-[11px] font-black tabular-nums px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{correctAnswered} wins</span>
          </div>
          <span className="text-[11px] font-black px-2 py-1 rounded-full bg-amber-100 text-amber-700">+{sessionGems} 💎</span>
          <button onClick={loadNext} className="text-[11px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-wide">Skip →</button>
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