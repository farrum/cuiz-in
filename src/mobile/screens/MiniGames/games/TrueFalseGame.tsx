import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, X, Trophy, RotateCcw } from 'lucide-react';
import { getRandomQuestion } from '@/utils/quizData';
import type { QuizQuestion } from '@/utils/types';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { MascotPlayer } from '@/mobile/mascots/MascotPlayer';
import { characterOfTheDay } from '@/mobile/mascots/registry';
import { moodEngine } from '@/mobile/mascots/useMoodEngine';

const ROUND_SIZE = 20;

interface Card {
  q: QuizQuestion;
  claim: string;       // the answer shown to the player
  isTrue: boolean;     // whether the shown claim is actually correct
}

function buildCard(q: QuizQuestion): Card {
  const correct = q.correctAnswer || q.options?.[0] || '';
  const wrongOptions = (q.options || []).filter((o) => o && o !== correct);
  // 50/50 true vs false; fall back to true if no wrong option exists
  const makeTrue = wrongOptions.length === 0 ? true : Math.random() < 0.5;
  const claim = makeTrue ? correct : wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
  return { q, claim, isTrue: makeTrue };
}

export function TrueFalseGame() {
  const haptics = useHaptics();
  const [card, setCard] = useState<Card | null>(null);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [rounds, setRounds] = useState(1);
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null);
  const [finished, setFinished] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const trueGlow = useTransform(x, [40, 160], [0, 1]);
  const falseGlow = useTransform(x, [-160, -40], [1, 0]);

  const load = useCallback(async () => {
    try {
      const q = await getRandomQuestion();
      setCard(buildCard(q));
      x.set(0);
    } catch { /* noop */ }
  }, [x]);

  useEffect(() => { load(); }, [load]);

  const answer = (saidTrue: boolean) => {
    if (!card || feedback) return;
    const correct = saidTrue === card.isTrue;
    haptics(correct ? 'success' : 'error');
    moodEngine.recordAnswer(correct);
    if (correct) setScore((s) => s + 1);
    setFeedback(correct ? 'correct' : 'wrong');

    const nextPlayed = played + 1;
    setTimeout(() => {
      setFeedback(null);
      setPlayed(nextPlayed);
      if (nextPlayed >= ROUND_SIZE * rounds) {
        setFinished(true);
      } else {
        load();
      }
    }, 1100);
  };

  const extend = () => {
    setRounds((r) => r + 1);
    setFinished(false);
    load();
  };

  const restart = () => {
    setScore(0);
    setPlayed(0);
    setRounds(1);
    setFinished(false);
    load();
  };

  // ---- Round complete screen ----
  if (finished) {
    const total = ROUND_SIZE * rounds;
    const pct = total ? Math.round((score / total) * 100) : 0;
    return (
      <div className="flex flex-col items-center pt-8 px-4 text-center">
        <MascotPlayer character={characterOfTheDay()} mood={pct >= 50 ? 'excited' : 'sad'} size={120} />
        <h2 className="text-2xl font-bold mt-4">Round complete!</h2>
        <p className="text-muted-foreground mt-1">You scored</p>
        <p className="text-4xl font-extrabold my-2">{score}<span className="text-lg text-muted-foreground"> / {total}</span></p>
        <p className="text-sm text-muted-foreground mb-6">{pct}% correct</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={extend}
          className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-primary-foreground bg-gradient-to-r from-primary to-purple-500 shadow-lg"
        >
          <Trophy className="w-4 h-4" /> Play 20 more
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={restart}
          className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-2xl py-3 mt-3 font-semibold text-foreground border border-border"
        >
          <RotateCcw className="w-4 h-4" /> Start over
        </motion.button>
      </div>
    );
  }

  if (!card) return <div className="text-center text-muted-foreground py-10">Loading…</div>;

  const progress = Math.min(played, ROUND_SIZE * rounds);
  const target = ROUND_SIZE * rounds;

  return (
    <div className="flex flex-col items-center pt-2">
      {/* Progress + score */}
      <div className="w-72 mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Question {progress + 1} of {target}</span>
          <span>Score: <strong className="text-foreground">{score}</strong></span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-purple-500"
            animate={{ width: `${(progress / target) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      </div>

      <div className="relative">
        <motion.div
          drag={feedback ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          style={{ x, rotate, opacity }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 110) answer(true);
            else if (info.offset.x < -110) answer(false);
          }}
          className="w-72 rounded-3xl bg-card border border-border p-6 shadow-xl cursor-grab active:cursor-grabbing"
        >
          {/* Swipe hint badges */}
          <motion.div style={{ opacity: falseGlow }} className="absolute top-4 left-4 px-2 py-1 rounded-lg border-2 border-destructive text-destructive text-xs font-bold rotate-[-12deg]">FALSE</motion.div>
          <motion.div style={{ opacity: trueGlow }} className="absolute top-4 right-4 px-2 py-1 rounded-lg border-2 border-emerald-500 text-emerald-600 text-xs font-bold rotate-[12deg]">TRUE</motion.div>

          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{card.q.category}</p>
          <p className="font-bold text-base mb-3 leading-snug">{card.q.question}</p>
          <div className="rounded-xl bg-muted/60 px-3 py-2 mb-4">
            <span className="text-xs text-muted-foreground">Claimed answer</span>
            <p className="font-semibold">"{card.claim}"</p>
          </div>
          <MascotPlayer character={characterOfTheDay()} mood={moodEngine.snapshot().lastMood} size={56} noHalo />
        </motion.div>

        {/* Feedback overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl backdrop-blur-sm"
              style={{ background: feedback === 'correct' ? 'hsl(var(--card) / 0.85)' : 'hsl(var(--card) / 0.85)' }}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${feedback === 'correct' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-destructive/20 text-destructive'}`}>
                {feedback === 'correct' ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
              </div>
              <p className={`mt-3 font-bold text-lg ${feedback === 'correct' ? 'text-emerald-600' : 'text-destructive'}`}>
                {feedback === 'correct' ? 'Correct!' : 'Wrong!'}
              </p>
              {feedback === 'wrong' && (
                <p className="text-xs text-muted-foreground mt-1 px-4 text-center">
                  Correct answer: "{card.q.correctAnswer || card.q.options?.[0]}"
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-8 mt-8">
        <button
          onClick={() => answer(false)}
          disabled={!!feedback}
          className="w-14 h-14 rounded-full bg-destructive/15 text-destructive flex items-center justify-center disabled:opacity-40"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={() => answer(true)}
          disabled={!!feedback}
          className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center disabled:opacity-40"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">Swipe right = True · left = False</p>
    </div>
  );
}