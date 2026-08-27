import { useCallback, useEffect, useState } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, X, Trophy, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { getRandomQuestion, getBatchQuestions } from '@/utils/quizData';
import type { QuizQuestion } from '@/utils/types';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { MascotPlayer } from '@/mobile/mascots/MascotPlayer';
import { characterOfTheDay } from '@/mobile/mascots/registry';
import { moodEngine } from '@/mobile/mascots/useMoodEngine';
import { audioManager } from '@/utils/audioManager';
import confetti from 'canvas-confetti';

const ROUND_SIZE = 10;

interface Card {
  q: QuizQuestion;
  claim: string;       // the answer shown to the player
  isTrue: boolean;     // whether the shown claim is actually correct
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  try {
    const parser = new DOMParser();
    const decoded = parser.parseFromString(str, 'text/html').body.textContent;
    return decoded || str;
  } catch (e) {
    return str;
  }
}

function buildCard(q: QuizQuestion): Card {
  const correct = q.correctAnswer || q.options?.[0] || '';
  const wrongOptions = (q.options || []).filter((o) => o && o !== correct);
  // 50/50 true vs false; fall back to true if no wrong option exists
  const makeTrue = wrongOptions.length === 0 ? true : Math.random() < 0.5;
  const claim = makeTrue ? correct : wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
  return { q, claim, isTrue: makeTrue };
}

export function TrueFalseGame({ onRoundComplete }: { onRoundComplete?: () => void } = {}) {
  const haptics = useHaptics();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<Card | null>(null);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [rounds, setRounds] = useState(1);
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null);
  const [finished, setFinished] = useState(false);
  const [showSwipeGuides, setShowSwipeGuides] = useState(true);
  const { showVideoAd, adElement } = useMiniGameVideoAd();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const trueGlow = useTransform(x, [40, 160], [0, 1]);
  const falseGlow = useTransform(x, [-160, -40], [1, 0]);

  // Hide swipe guides after 4.5 seconds or once user drags the card
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeGuides(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [played]);

  const loadBatch = useCallback(async (count: number, append = false) => {
    setLoading(true);
    try {
      const batch = await getBatchQuestions(count);
      if (batch.length > 0) {
        if (append) {
          setQuestions((prev) => [...prev, ...batch]);
          setCard(buildCard(batch[0]));
        } else {
          setQuestions(batch);
          setCard(buildCard(batch[0]));
        }
      } else {
        const q = await getRandomQuestion();
        if (append) {
          setQuestions((prev) => [...prev, q]);
        } else {
          setQuestions([q]);
        }
        setCard(buildCard(q));
      }
    } catch (e) {
      console.error('Failed to load questions batch', e);
      try {
        const q = await getRandomQuestion();
        setQuestions([q]);
        setCard(buildCard(q));
      } catch { /* noop */ }
    } finally {
      setLoading(false);
      x.set(0);
    }
  }, [x]);

  useEffect(() => {
    loadBatch(ROUND_SIZE, false);
  }, [loadBatch]);

  const answer = (saidTrue: boolean) => {
    if (!card || feedback) return;
    const correct = saidTrue === card.isTrue;
    haptics(correct ? 'success' : 'error');
    audioManager.playSFX(correct ? 'correct' : 'wrong');
    moodEngine.recordAnswer(correct);
    setShowSwipeGuides(false);

    if (correct) setScore((s) => s + 1);
    setFeedback(correct ? 'correct' : 'wrong');

    const nextPlayed = played + 1;
    setTimeout(() => {
      setFeedback(null);
      setPlayed(nextPlayed);
      if (nextPlayed >= ROUND_SIZE * rounds) {
        // Trigger celebratory confetti on a perfect or high score round
        const total = ROUND_SIZE * rounds;
        const currentScore = correct ? score + 1 : score;
        if (currentScore / total >= 0.7) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.45 } });
        }
        showVideoAd(() => {
          setFinished(true);
          onRoundComplete?.();
        });
      } else {
        const nextQ = questions[nextPlayed];
        if (nextQ) {
          setCard(buildCard(nextQ));
          x.set(0);
        } else {
          getRandomQuestion().then((q) => {
            setCard(buildCard(q));
            x.set(0);
          });
        }
      }
    }, 1100);
  };

  const extend = () => {
    setRounds((r) => r + 1);
    setFinished(false);
    loadBatch(ROUND_SIZE, true);
  };

  const restart = () => {
    setScore(0);
    setPlayed(0);
    setRounds(1);
    setFinished(false);
    loadBatch(ROUND_SIZE, false);
  };

  // ---- Round complete screen ----
  if (finished) {
    const total = ROUND_SIZE * rounds;
    const pct = total ? Math.round((score / total) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center pt-4 px-4 text-center w-full max-w-sm mx-auto">
        <MascotPlayer character={characterOfTheDay()} mood={pct >= 50 ? 'excited' : 'sad'} size={140} />
        <h2 className="text-3xl font-black mt-6 tracking-tight text-amber-900">Round complete!</h2>
        <p className="text-muted-foreground mt-1.5 text-sm font-bold">You scored</p>
        <p className="text-5xl font-black my-4 text-amber-800">
          {score}
          <span className="text-xl text-slate-400 font-black"> / {total}</span>
        </p>
        <p className="text-[11px] tracking-widest uppercase font-black text-slate-400 mb-8">
          {pct}% questions correct
        </p>
        {onRoundComplete ? (
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            Spend 5 gems or watch an ad below for another round.
          </p>
        ) : (
          <div className="w-full space-y-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={extend}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-4 font-black uppercase text-base text-white"
              style={{
                background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                boxShadow: '0 4px 0 hsl(30 80% 35%), 0 4px 12px rgba(245, 158, 11, 0.25)',
              }}
            >
              <Trophy className="w-5 h-5" /> Play {ROUND_SIZE} more
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={restart}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-4 font-black uppercase text-base bg-white text-slate-600 border border-slate-350 shadow-sm"
            >
              <RotateCcw className="w-5 h-5" /> Start over
            </motion.button>
          </div>
        )}
      </div>
    );
  }

  if (loading || !card) return <div className="text-center text-slate-400 py-10 font-black tracking-widest uppercase">Shuffling facts...</div>;

  const progress = Math.min(played, ROUND_SIZE * rounds);
  const target = ROUND_SIZE * rounds;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4 pb-4 relative">
      {/* Background flash response screen overlays */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-0 pointer-events-none ${feedback === 'correct' ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
        )}
      </AnimatePresence>

      {/* Progress + score */}
      <div className="w-full mb-5 z-10">
        <div className="flex justify-between text-xs font-black text-slate-400 mb-2 px-1">
          <span>QUESTION {progress + 1} OF {target}</span>
          <span>SCORE: <strong className="text-slate-700">{score}</strong></span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
            animate={{ width: `${(progress / target) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      </div>

      {/* Main card box */}
      <div className="relative w-full aspect-[4/5] min-h-[380px] max-h-[460px] flex items-center justify-center z-10">
        <motion.div
          drag={feedback ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          style={{ x, rotate, opacity }}
          onDragStart={() => setShowSwipeGuides(false)}
          onDragEnd={(_, info) => {
            if (info.offset.x > 110) answer(true);
            else if (info.offset.x < -110) answer(false);
          }}
          className="w-full h-full rounded-[2rem] bg-white border border-slate-200 p-8 shadow-xl flex flex-col justify-between cursor-grab active:cursor-grabbing select-none relative overflow-hidden"
        >
          {/* Swipe indicator helper guides (bouncing animations) */}
          <AnimatePresence>
            {showSwipeGuides && !feedback && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: [0, 0.8, 0], x: [-10, -30, -10] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-1 text-rose-500"
                >
                  <ArrowLeft className="w-6 h-6 stroke-[3]" />
                  <span className="text-[8px] font-black tracking-widest uppercase">False</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: [0, 0.8, 0], x: [10, 30, 10] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-1 text-emerald-500"
                >
                  <ArrowRight className="w-6 h-6 stroke-[3]" />
                  <span className="text-[8px] font-black tracking-widest uppercase">True</span>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Swipe glow labels */}
          <motion.div 
            style={{ opacity: falseGlow }} 
            className="absolute top-6 left-6 px-3 py-1.5 rounded-xl border-2 border-red-500 bg-red-50/90 text-red-600 text-sm font-black rotate-[-12deg]"
          >
            FALSE
          </motion.div>
          <motion.div 
            style={{ opacity: trueGlow }} 
            className="absolute top-6 right-6 px-3 py-1.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/90 text-emerald-600 text-sm font-black rotate-[12deg]"
          >
            TRUE
          </motion.div>

          <div className="flex-1 flex flex-col justify-center gap-6 mt-4">
            <span className="self-center px-3 py-1 bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-700 uppercase tracking-widest rounded-full">
              {decodeHtmlEntities(card.q.category || 'General')}
            </span>
            <p className="font-extrabold text-lg md:text-xl text-center leading-snug tracking-tight text-slate-800 select-none">
              {decodeHtmlEntities(card.q.question)}
            </p>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Claimed Answer
              </span>
              <p className="font-black text-center text-sm text-slate-700 select-none">
                "{decodeHtmlEntities(card.claim)}"
              </p>
            </div>
          </div>

          <div className="flex justify-center items-center mt-2">
            <MascotPlayer character={characterOfTheDay()} mood={moodEngine.snapshot().lastMood} size={64} noHalo />
          </div>
        </motion.div>

        {/* Feedback overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] backdrop-blur-sm z-30"
              style={{ background: 'rgba(255, 255, 255, 0.95)' }}
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${feedback === 'correct' ? 'bg-emerald-50 text-emerald-500 border-emerald-400' : 'bg-red-50 text-red-500 border-red-400 animate-pulse'}`}>
                {feedback === 'correct' ? <Check className="w-10 h-10 stroke-[3]" /> : <X className="w-10 h-10 stroke-[3]" />}
              </div>
              <p className={`mt-4 font-black text-2xl tracking-tight ${feedback === 'correct' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {feedback === 'correct' ? 'Correct!' : 'Wrong!'}
              </p>
              {feedback === 'wrong' && (
                <div className="px-6 mt-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Correct Answer</span>
                  <p className="font-black text-sm text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    "{decodeHtmlEntities(card.q.correctAnswer || card.q.options?.[0] || '')}"
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Larger Button Controls with labels */}
      <div className="flex justify-center gap-12 mt-6 z-10">
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => answer(false)}
            disabled={!!feedback}
            aria-label="Answer false"
            className="w-16 h-16 rounded-full bg-red-500 border-2 border-red-600 flex items-center justify-center disabled:opacity-40 transition-transform active:scale-90 hover:scale-105 shadow-md text-white"
          >
            <X className="w-9 h-9" strokeWidth={3.5} />
          </button>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">False</span>
        </div>
        
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => answer(true)}
            disabled={!!feedback}
            aria-label="Answer true"
            className="w-16 h-16 rounded-full bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center disabled:opacity-40 transition-transform active:scale-90 hover:scale-105 shadow-md text-white"
          >
            <Check className="w-9 h-9" strokeWidth={3.5} />
          </button>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">True</span>
        </div>
      </div>
      
      <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-wider z-10">
        Swipe left for FALSE · Swipe right for TRUE
      </p>
      {adElement}
    </div>
  );
}