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
      <div className="flex flex-col items-center justify-center pt-4 px-4 text-center w-full max-w-sm mx-auto">
        <MascotPlayer character={characterOfTheDay()} mood={pct >= 50 ? 'excited' : 'sad'} size={140} />
        <h2 className="text-3xl font-black mt-6 tracking-tight">Round complete!</h2>
        <p className="text-muted-foreground mt-1.5 text-sm font-medium">You scored</p>
        <p className="text-5xl font-black my-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {score}
          <span className="text-xl text-muted-foreground font-semibold"> / {total}</span>
        </p>
        <p className="text-xs tracking-wider uppercase font-bold text-muted-foreground mb-8">
          {pct}% questions correct
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={extend}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-4 font-extrabold text-primary-foreground bg-gradient-to-r from-primary to-purple-500 shadow-lg"
        >
          <Trophy className="w-5 h-5" /> Play 20 more
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={restart}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-4 mt-3 font-bold text-foreground border border-border bg-muted/20"
        >
          <RotateCcw className="w-5 h-5" /> Start over
        </motion.button>
      </div>
    );
  }

  if (!card) return <div className="text-center text-muted-foreground py-10 font-bold">Shuffling facts...</div>;

  const progress = Math.min(played, ROUND_SIZE * rounds);
  const target = ROUND_SIZE * rounds;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4 pb-4">
      {/* Progress + score */}
      <div className="w-full mb-5">
        <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2 px-1">
          <span>QUESTION {progress + 1} OF {target}</span>
          <span>SCORE: <strong className="text-foreground">{score}</strong></span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-purple-500"
            animate={{ width: `${(progress / target) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      </div>

      {/* Main card box - enlarged to take up major space */}
      <div className="relative w-full aspect-[4/5] min-h-[380px] max-h-[460px] flex items-center justify-center">
        <motion.div
          drag={feedback ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          style={{ x, rotate, opacity }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 110) answer(true);
            else if (info.offset.x < -110) answer(false);
          }}
          className="w-full h-full rounded-[2rem] bg-card border border-border p-8 shadow-2xl flex flex-col justify-between cursor-grab active:cursor-grabbing select-none"
        >
          {/* Swipe hint badges */}
          <motion.div 
            style={{ opacity: falseGlow }} 
            className="absolute top-6 left-6 px-3 py-1.5 rounded-xl border-2 border-destructive text-destructive text-sm font-black rotate-[-12deg]"
          >
            FALSE
          </motion.div>
          <motion.div 
            style={{ opacity: trueGlow }} 
            className="absolute top-6 right-6 px-3 py-1.5 rounded-xl border-2 border-emerald-500 text-emerald-600 text-sm font-black rotate-[12deg]"
          >
            TRUE
          </motion.div>

          <div className="flex-1 flex flex-col justify-center gap-6 mt-4">
            <span className="self-center px-3 py-1 bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest rounded-full">
              {decodeHtmlEntities(card.q.category || 'General')}
            </span>
            <p className="font-extrabold text-lg md:text-xl text-center leading-snug tracking-tight text-foreground select-none">
              {decodeHtmlEntities(card.q.question)}
            </p>
            <div className="rounded-2xl bg-muted/50 border border-border/30 px-4 py-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Claimed Answer
              </span>
              <p className="font-black text-center text-md text-foreground select-none">
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
              className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] backdrop-blur-md z-30"
              style={{ background: 'hsl(var(--card) / 0.9)' }}
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${feedback === 'correct' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-destructive/20 text-destructive'}`}>
                {feedback === 'correct' ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
              </div>
              <p className={`mt-4 font-black text-2xl ${feedback === 'correct' ? 'text-emerald-500' : 'text-destructive'}`}>
                {feedback === 'correct' ? 'Correct!' : 'Wrong!'}
              </p>
              {feedback === 'wrong' && (
                <div className="px-6 mt-3 text-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Correct Answer</span>
                  <p className="font-black text-sm text-foreground">
                    "{decodeHtmlEntities(card.q.correctAnswer || card.q.options?.[0] || '')}"
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Larger Button Controls with labels */}
      <div className="flex justify-center gap-12 mt-6">
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => answer(false)}
            disabled={!!feedback}
            className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center disabled:opacity-40 transition-transform active:scale-90 hover:scale-105 shadow-md"
          >
            <X className="w-7 h-7" />
          </button>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">False</span>
        </div>
        
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => answer(true)}
            disabled={!!feedback}
            className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center disabled:opacity-40 transition-transform active:scale-90 hover:scale-105 shadow-md"
          >
            <Check className="w-7 h-7" />
          </button>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">True</span>
        </div>
      </div>
      
      <p className="text-[10px] font-semibold text-muted-foreground mt-4 uppercase tracking-wider">
        Swipe left for FALSE · Swipe right for TRUE
      </p>
    </div>
  );
}